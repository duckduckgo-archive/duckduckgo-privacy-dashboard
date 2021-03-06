const Parent = window.DDG.base.Model
const normalizeCompanyName = require('./mixins/normalize-company-name.es6')
const browserUIWrapper = require('../../browser/communication.es6.js')

function SiteCompanyList (attrs) {
    attrs = attrs || {}
    attrs.tab = null
    attrs.companyList = []
    Parent.call(this, attrs)
}

SiteCompanyList.prototype = window.$.extend({},
    Parent.prototype,
    normalizeCompanyName,
    {

        modelName: 'siteCompanyList',

        fetchAsyncData: function () {
            return new Promise((resolve, reject) => {
                browserUIWrapper.getBackgroundTabData().then((bkgTab) => {
                    this.tab = bkgTab
                    this.domain = this.tab && this.tab.site ? this.tab.site.domain : ''
                    this._updateCompaniesList()
                    resolve()
                })
            })
        },

        _updateCompaniesList: function () {
            // list of all trackers on page (whether we blocked them or not)
            this.trackers = this.tab.trackers || {}
            const companyNames = Object.keys(this.trackers)
            let unknownSameDomainCompany = null

            // set trackerlist metadata for list display by company:
            this.companyList = companyNames
                .map((companyName) => {
                    const company = this.trackers[companyName]

                    const displayName = company.displayName || companyName
                    if (!this.tab.site.whitelisted && (!this.tab.parentEntity || this.tab.parentEntity.displayName !== displayName)) {
                        // Filter out unblocked 3rd party urls
                        Object.keys(company.urls).forEach((url) => {
                            if (!company.urls[url].isBlocked) {
                                delete company.urls[url]
                            }
                        })
                    }

                    const urlsList = company.urls ? Object.keys(company.urls) : []
                    // Unknown same domain trackers need to be individually fetched and put
                    // in the unblocked list
                    if (companyName === 'unknown' && this.hasUnblockedTrackers(company, urlsList)) {
                        unknownSameDomainCompany = this.createUnblockedList(company, urlsList)
                    }

                    return {
                        name: companyName,
                        displayName: displayName,
                        slug: this.normalizeCompanyName(displayName),
                        count: company.count,
                        prevalence: company.prevalence || 0,
                        urls: company.urls,
                        urlsList: urlsList
                    }
                }, this)
                .sort((a, b) => {
                    return b.prevalence - a.prevalence
                }).concat(unknownSameDomainCompany || [])
        },

        // Make ad-hoc unblocked list
        // used to cherry pick unblocked trackers from unknown companies
        // the name is the site domain, count is -2 to show the list at the bottom
        createUnblockedList: function (company, urlsList) {
            const unblockedTrackers = this.spliceUnblockedTrackers(company, urlsList)
            return {
                name: this.domain,
                iconName: '', // we won't have an icon for unknown first party trackers
                count: -2,
                urls: unblockedTrackers,
                urlsList: Object.keys(unblockedTrackers)
            }
        },

        // Return an array of unblocked trackers
        // and remove those entries from the specified company
        // only needed for unknown trackers, so far
        spliceUnblockedTrackers: function (company, urlsList) {
            if (!company || !company.urls || !urlsList) return null

            return urlsList.filter((url) => company.urls[url].isBlocked === false)
                .reduce((unblockedTrackers, url) => {
                    unblockedTrackers[url] = company.urls[url]

                    // Update the company urls and urlsList
                    delete company.urls[url]
                    urlsList.splice(urlsList.indexOf(url), 1)

                    return unblockedTrackers
                }, {})
        },

        // Return true if company has unblocked trackers in the current tab
        hasUnblockedTrackers: function (company, urlsList) {
            if (!company || !company.urls || !urlsList) return false

            return urlsList.some((url) => company.urls[url].isBlocked === false)
        }
    }
)

module.exports = SiteCompanyList
