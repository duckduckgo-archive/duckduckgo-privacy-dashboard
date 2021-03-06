const Parent = window.DDG.base.Model
const constants = require('../../../data/constants')
const httpsMessages = constants.httpsMessages
const supportedLocales = constants.supportedLocales
const browserUIWrapper = require('../../browser/communication.es6.js')
const i18n = window.DDG.base.i18n

// We consider major tracker networks as those found on this percentage of sites
// that we crawl
const MAJOR_TRACKER_THRESHOLD_PCT = 25

function Site (attrs) {
    attrs = attrs || {}
    attrs.disabled = true // disabled by default
    attrs.tab = null
    attrs.permissions = null
    attrs.domain = '-'
    attrs.isWhitelisted = false
    attrs.whitelistOptIn = false
    attrs.httpsState = 'none'
    attrs.httpsStatusText = ''
    attrs.trackersCount = 0 // unique trackers count
    attrs.majorTrackerNetworksCount = 0
    attrs.totalTrackerNetworksCount = 0
    attrs.trackerNetworks = []
    attrs.isaMajorTrackingNetwork = false
    Parent.call(this, attrs)

    this.bindEvents([
        [this.store.subscribe, 'action:backgroundMessage', this.handleBackgroundMsg]
    ])
}

Site.prototype = window.$.extend({},
    Parent.prototype,
    {

        modelName: 'site',

        getBackgroundTabData: function () {
            return new Promise((resolve) => {
                browserUIWrapper.getBackgroundTabData().then((tab) => {
                    if (tab) {
                        if (tab.locale) {
                            if (supportedLocales.includes(tab.locale)) {
                                i18n.changeLanguage(tab.locale)
                            } else {
                                console.warn(`Unsupported locale ${tab.locale}`)
                            }
                        }

                        this.set('tab', tab)
                        this.domain = tab.site.domain
                        this.set('isaMajorTrackingNetwork', (tab.parentEntity?.prevalence || 0) >= MAJOR_TRACKER_THRESHOLD_PCT)
                    } else {
                        console.debug('Site model: no tab')
                    }

                    this.update()
                    resolve()
                })
            })
        },

        setSiteProperties: function () {
            if (!this.tab) {
                this.domain = 'new tab' // tab can be null for firefox new tabs
            } else {
                this.isWhitelisted = this.tab.site.whitelisted
                this.whitelistOptIn = this.tab.site.whitelistOptIn
                if (this.tab.site.specialDomainName) {
                    this.domain = this.tab.site.specialDomainName // eg "extensions", "options", "new tab"
                } else {
                    this.set({ disabled: false })
                }
            }

            if (this.domain && this.domain === '-') this.set('disabled', true)
        },

        setHttpsMessage: function () {
            if (!this.tab) return

            if (this.tab.upgradedHttps) {
                this.httpsState = 'upgraded'
            } else if (/^https/.exec(this.tab.url)) {
                this.httpsState = 'secure'
            } else {
                this.httpsState = 'none'
            }

            this.httpsStatusText = i18n.t(httpsMessages[this.httpsState])
        },

        handleBackgroundMsg: function (message) {
            if (!this.tab) return
            if (message.action && message.action === 'updateTabData') {
                browserUIWrapper.getBackgroundTabData().then((tab) => {
                    this.tab = tab
                    this.update()
                })
            }
        },

        updatePermission: function (id, value) {
            if (!this.permissions) return

            const permissionIndex = this.permissions.findIndex(({ key }) => key === id)
            if (permissionIndex === -1) return

            // Deep copy permissions before mutating
            const updatedPermissions = JSON.parse(JSON.stringify(this.permissions))
            updatedPermissions[permissionIndex].permission = value
            this.set('permissions', updatedPermissions)
            this.fetch({ updatePermission: { id, value } })
        },

        // calls `this.set()` to trigger view re-rendering
        update: function (ops) {
            this.setSiteProperties()
            this.setHttpsMessage()

            if (this.tab) {
                this.set('permissions', this.tab.permissions)

                const newTrackersCount = this.getUniqueTrackersCount()
                if (newTrackersCount !== this.trackersCount) {
                    this.set('trackersCount', newTrackersCount)
                }

                const newTrackersBlockedCount = this.getUniqueTrackersBlockedCount()
                if (newTrackersBlockedCount !== this.trackersBlockedCount) {
                    this.set('trackersBlockedCount', newTrackersBlockedCount)
                }

                const newTrackerNetworks = this.getTrackerNetworksOnPage()
                if (this.trackerNetworks.length === 0 ||
                        (newTrackerNetworks.length !== this.trackerNetworks.length)) {
                    this.set('trackerNetworks', newTrackerNetworks)
                }

                const newUnknownTrackersCount = this.getUnknownTrackersCount()
                const newTotalTrackerNetworksCount = newUnknownTrackersCount + newTrackerNetworks.length
                if (newTotalTrackerNetworksCount !== this.totalTrackerNetworksCount) {
                    this.set('totalTrackerNetworksCount', newTotalTrackerNetworksCount)
                }

                const newMajorTrackerNetworksCount = this.getMajorTrackerNetworksCount()
                if (newMajorTrackerNetworksCount !== this.majorTrackerNetworksCount) {
                    this.set('majorTrackerNetworksCount', newMajorTrackerNetworksCount)
                }
            }
        },

        getUniqueTrackersCount: function () {
            const count = Object.keys(this.tab.trackers).reduce((total, name) => {
                return this.tab.trackers[name].count + total
            }, 0)

            return count
        },

        getUniqueTrackersBlockedCount: function () {
            const count = Object.keys(this.tab.trackersBlocked).reduce((total, name) => {
                const companyBlocked = this.tab.trackersBlocked[name]

                // Don't throw a TypeError if urls are not there
                let trackersBlocked = companyBlocked.urls ? Object.keys(companyBlocked.urls) : null
                if (trackersBlocked) {
                    trackersBlocked = trackersBlocked.filter(url => companyBlocked.urls[url].isBlocked)
                }

                // Counting unique URLs instead of using the count
                // because the count refers to all requests rather than unique number of trackers
                const trackersBlockedCount = trackersBlocked ? trackersBlocked.length : 0
                return trackersBlockedCount + total
            }, 0)

            return count
        },

        getUnknownTrackersCount: function () {
            const unknownTrackers = this.tab.trackers ? this.tab.trackers.unknown : {}

            let count = 0
            if (unknownTrackers && unknownTrackers.urls) {
                const unknownTrackersUrls = Object.keys(unknownTrackers.urls)
                count = unknownTrackersUrls ? unknownTrackersUrls.length : 0
            }

            return count
        },

        getMajorTrackerNetworksCount: function () {
            // Show only blocked major trackers count, unless site is whitelisted
            const trackers = this.isWhitelisted ? this.tab.trackers : this.tab.trackersBlocked
            const count = Object.values(trackers).reduce((total, t) => {
                const isMajor = t.prevalence > MAJOR_TRACKER_THRESHOLD_PCT
                total += isMajor ? 1 : 0
                return total
            }, 0)

            return count
        },

        getTrackerNetworksOnPage: function () {
            // all tracker networks found on this page/tab
            const networks = Object.keys(this.tab.trackers)
                .map((t) => t.toLowerCase())
                .filter((t) => t !== 'unknown')
            return networks
        },

        toggleWhitelist: function () {
            if (this.tab && this.tab.site) {
                this.isWhitelisted = !this.isWhitelisted
                this.set('whitelisted', this.isWhitelisted)
                const whitelistOnOrOff = this.isWhitelisted ? 'off' : 'on'

                if (whitelistOnOrOff === 'on' && this.whitelistOptIn) {
                    this.set('whitelistOptIn', false)
                }

                const isProtected = !this.isWhitelisted
                this.fetch({ toggleWhitelist: { value: isProtected } })
            }
        },

        companyNames: function () {
            if (!this.tab) return []

            return Object.keys(this.tab.trackers)
                .reduce((companyNames, companyName) => {
                    if (companyName === 'unknown') return companyNames

                    const company = this.tab.trackers[companyName]

                    const urlsList = company.urls ? Object.keys(company.urls) : []
                    if (!this.isWhitelisted && company.urls && urlsList.every((url) => company.urls[url].isBlocked === false)) {
                        return companyNames
                    }

                    return companyNames.concat({
                        name: company.displayName || companyName,
                        prevalence: company.prevalence || 0
                    })
                }, [])
                .sort((a, b) => b.prevalence - a.prevalence)
                .map(({ name }) => name)
        },

        submitBreakageForm: function (category, description) {
            if (!this.tab) return

            const blockedTrackers = []
            const surrogates = []
            const upgradedHttps = this.tab.upgradedHttps
            // remove params and fragments from url to avoid including sensitive data
            const siteUrl = this.tab.url.split('?')[0].split('#')[0]
            const trackerObjects = this.tab.trackersBlocked
            const pixelParams = ['epbf',
                { category: category },
                { description: encodeURIComponent(description || '') },
                { siteUrl: encodeURIComponent(siteUrl) },
                { upgradedHttps: upgradedHttps.toString() },
                { tds: this.tds },
                { reportFlow: 'dashboard' }
            ]

            for (const tracker in trackerObjects) {
                const trackerDomains = trackerObjects[tracker].urls
                Object.keys(trackerDomains).forEach((domain) => {
                    if (trackerDomains[domain].isBlocked) {
                        blockedTrackers.push(domain)
                        if (trackerDomains[domain].reason === 'matched rule - surrogate') {
                            surrogates.push(domain)
                        }
                    }
                })
            }
            if (this.tab.consentManaged) {
                const { consentManaged, optoutFailed, selftestFailed } = this.tab.consentManaged
                pixelParams.push({
                    consentManaged: consentManaged ? '1' : '0'
                })
                if (consentManaged && optoutFailed !== undefined) {
                    pixelParams.push({ consentOptoutFailed: optoutFailed ? '1' : '0' })
                }
                if (consentManaged && selftestFailed !== undefined) {
                    pixelParams.push({ consentSelftestFailed: selftestFailed ? '1' : '0' })
                }
            }
            pixelParams.push({ blockedTrackers: blockedTrackers }, { surrogates: surrogates })
            this.fetch({ firePixel: pixelParams })
        }
    }
)

module.exports = Site
