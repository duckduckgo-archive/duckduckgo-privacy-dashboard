const bel = require('bel')
const raw = require('bel/raw')
const { normalizeCompanyName } = require('../models/mixins/normalize-company-name.es6.js')
const toggleButton = require('./shared/toggle-button.es6.js')
const trackerNetworksIcon = require('./shared/tracker-network-icon.es6.js')
const trackerNetworksText = require('./shared/tracker-networks-text.es6.js')
const { isSiteWithOnlyOwnTrackers, getColorId } = require('./shared/utils.es6.js')
const i18n = window.DDG.base.i18n

const renderUpdatingSpinner = () => {
    return bel`<img src="../img/spinner.svg" style="height: 18px; width: 18px;" alt="${i18n.t('site:updatingProtectionList.title')}" />`
}

module.exports = function () {
    const protectionStatus = this.model.isWhitelisted
        ? bel`${raw(i18n.t('site:protectionsDisabled.title'))}`
        : bel`${raw(i18n.t('site:protectionsEnabled.title'))}`

    const protectionToggle = this.model.tab.isPendingUpdates
        ? renderUpdatingSpinner()
        : toggleButton(!this.model.isWhitelisted, 'js-site-toggle pull-right')

    return bel`<div class="site-info site-info--main">
    <div class="popover-title border--bottom">
        <h1>${this.model.tab.site.domain}</h1>
    </div>
    <ul class="default-list card-list">
        <li class="site-info__li--toggle padded ${this.model.isWhitelisted ? '' : 'is-active'}">
            <p class="site-info__protection js-site-protection"><span>${protectionStatus}</span></p>
            <div class="site-info__toggle-container">${protectionToggle}</div>
        </li>
        ${renderKeyInsight(this.model)}
        <li class="js-site-tracker-networks js-site-show-page-trackers site-info__li--trackers padded border-light--top">
            <a href="javascript:void(0)" class="link-action" role="button">
                ${renderTrackerNetworks(this.model)}
            </a>
        </li>
        <li class="js-site-show-page-connection site-info__li--https-status padded border-light--top">
            <a href="javascript:void(0)" class="link-action" role="button">
                ${renderConnection(this.model)}
            </a>
        </li>
       ${renderCookieConsentManaged(this.model)}
    </ul>
    <ul class="default-list">
        <li class="site-info__li--manage-permissions">
            ${renderManagePermissions(this.model)}
        </li>
    </ul>
    <ul class="default-list">
        <li class="js-site-manage-whitelist-li site-info__li--manage-whitelist">
            ${renderManageWhitelist(this.model)}
        </li>
    </ul>
</div>`

    function renderConnectionDescription (model) {
        if (model.httpsState === 'none') {
            return i18n.t('site:connectionDescriptionUnencrypted.title')
        }

        if (model.httpsState === 'upgraded') {
            return i18n.t('site:connectionDescriptionUpgraded.title')
        }

        return i18n.t('site:connectionDescriptionEncrypted.title')
    }

    function renderConnection (model) {
        return bel`<div>
            <div class="site-info__trackers">
                <span class="site-info__https-status__icon is-${model.httpsState}"></span>
                <span class="bold"> ${model.httpsStatusText} </span>
                <span class="icon icon__arrow pull-right"></span>
            </div>
            <div class="action-description">
                ${renderConnectionDescription(model)}
            </div>
        </div>`
    }

    function renderTrackerNetworksSummary (model) {
        const networksCount = model.totalTrackerNetworksCount
        if (networksCount === 0) {
            return bel`<div class="action-description">
                ${i18n.t('site:trackerNetworksSummaryNone.title')}
            </div>`
        }

        if (isSiteWithOnlyOwnTrackers(model)) {
            const name = model.tab.parentEntity?.displayName || model.tab.site.domain
            return bel`<div class="action-description">
                ${i18n.t('site:trackerNetworksSummaryOwn.title', { name })}
            </div>`
        }

        const displayCount = model.isWhitelisted ? model.trackersCount : model.trackersBlockedCount
        const companyCount = model.isWhitelisted ? networksCount : Object.keys(model.tab.trackersBlocked).length
        return bel`<div class="action-description">
            ${i18n.t('site:trackerNetworksSummaryOther.title', { isWhitelisted: model.isWhitelisted, displayCount, companyCount })}
        </div>`
    }

    function renderTrackerNetworks (model) {
        const isActive = !model.isWhitelisted ? 'is-active' : ''

        return bel`
        <div>
            <div class="site-info__trackers">
                <span class="site-info__trackers-status__icon icon-${trackerNetworksIcon(model)}"></span>
                <span class="${isActive} bold"> ${trackerNetworksText(model, false)} </span>
                <span class="icon icon__arrow pull-right"></span>
            </div>
            ${renderTrackerNetworksSummary(model)}
        </div>`
    }

    function renderManagePermissions (model) {
        if (!model.permissions || model.permissions.length === 0) {
            return ''
        }

        const localizedPerms = localizePermissions(model.permissions)

        return localizedPerms.map(({ key: permissionId, title, permission, options }, index) => {
            return bel`<div class="site-info__page-permission ${index !== model.permissions.length - 1 ? 'border-light--bottom--inner' : ''}">
                <label>
                    <div>
                        <div class="site-info__page-permission__icon ${permissionId}"></div>
                        ${title}
                    </div>
                    <select class="js-site-permission" name="${permissionId}">
                        ${options.map(({ id, title }) =>
        bel`<option value="${id}" ${permission === id ? 'selected' : ''}>${title}</option>`)
}
                    </select>
                </label>
            </div>`
        })
    }

    function renderManageWhitelist (model) {
        const hasPermissions = model.permissions && model.permissions.length > 0
        return bel`<div class="manage-whitelist ${hasPermissions ? 'border--top' : ''}">
            <a href="javascript:void(0)" class="js-site-report-broken site-info__report-broken">
                ${i18n.t('site:websiteNotWorkingQ.title')}
            </a>
        </div>`
    }

    function generateCompanyNamesList (model) {
        const companyNames = model.companyNames()
        return { companyCount: companyNames.length, firstCompany: companyNames[0], secondCompany: companyNames[1] }
    }

    function renderCompanyIconsList (model) {
        const companyNames = model.companyNames()
        if (companyNames.length === 0) return ''

        const topCompanies = companyNames.slice(0, 4)
        const remainingCount = companyNames.length - topCompanies.length
        const remainingCountIcon = remainingCount <= 0
            ? ''
            : bel`
                <span class="site-info__tracker__icon-wrapper">
                    <span class="site-info__tracker__count">+${remainingCount}</span>
                </span>
            `
        const topCompaniesIcons = topCompanies.reverse().map((name) => {
            const slug = normalizeCompanyName(name)
            return bel`
                <span class="site-info__tracker__icon-wrapper">
                    <span class="site-info__tracker__icon ${slug[0].toUpperCase()} color-${getColorId(slug)} ${slug}"></span>
                </span>
            `
        })

        return bel`
            <div class="site-info__key-insight_trackers-icons">
                ${remainingCountIcon}
                ${topCompaniesIcons}
            </div>
        `
    }

    function renderKeyInsight (model) {
        if (model.httpsState === 'none') {
            return bel`
                <li class="js-site-show-page-connection site-info__li--key-insight">
                    <a href="javascript:void(0)" class="link-action" role="button">
                        <div class="site-info__key-insight site-info__key-insight--insecure-connection">
                            <h2>${i18n.t('site:takePrecautions.title')}</h2>
                            <div>${i18n.t('site:connectionDescriptionUnencrypted.title')}</div>
                        </div>
                    </a>
                </li>
            `
        }

        if (model.isWhitelisted) {
            return bel`
                <li class="js-site-show-page-trackers site-info__li--key-insight">
                    <a href="javascript:void(0)" class="link-action" role="button">
                        <div class="site-info__key-insight site-info__key-insight--protections-off">
                            <h2>${i18n.t('site:protectionsAreDisabled.title')}</h2>
                            ${model.trackersCount === 0
        ? bel`<div>${i18n.t('site:trackerNetworksSummaryNone.title')}</div>`
        : bel`<div>${i18n.t('site:foundCompanyNamesList.title', generateCompanyNamesList(model))}</div>`
}
                        </div>
                    </a>
                </li>
            `
        }

        if (model.isaMajorTrackingNetwork) {
            const company = model.tab.parentEntity

            return bel`
                <li class="js-site-show-page-trackers site-info__li--key-insight">
                    <a href="javascript:void(0)" class="link-action" role="button">
                        <div class="site-info__key-insight site-info__key-insight--tracker-network">
                            <h2>${i18n.t('site:majorTrackerNetwork.title')}</h2>
                            <div>
                                ${i18n.t('site:majorTrackingNetworkDesc.title', { companyDisplayName: company.displayName, domain: model.tab.site.domain, companyPrevalence: Math.round(company.prevalence) })}
                            </div>
                        </div>
                    </a>
                </li>
            `
        }

        if (model.trackersCount === 0) {
            return bel`
                <li class="js-site-show-page-trackers site-info__li--key-insight">
                    <a href="javascript:void(0)" class="link-action" role="button">
                        <div class="site-info__key-insight site-info__key-insight--no-activity">
                            <h2>${i18n.t('site:noActivityToReport.title')}</h2>
                            <div>${i18n.t('site:trackerNetworksSummaryNone.title')}</div>
                        </div>
                    </a>
                </li>
            `
        }

        return bel`
            <li class="js-site-show-page-trackers site-info__li--key-insight">
                <a href="javascript:void(0)" class="link-action" role="button">
                    <div class="site-info__key-insight site-info__key-insight--trackers-blocked">
                        <h2>${i18n.t('site:trackersBlocked.title')}</h2>
                        <div>${i18n.t('site:trackersBlockedDesc.title', generateCompanyNamesList(model))}</div>
                    </div>
                    ${renderCompanyIconsList(model)}
                </a>
            </li>
        `
    }

    function renderCookieConsentManaged (model) {
        if (!model.tab?.consentManaged) return bel``

        const { consentManaged, optoutFailed } = model.tab.consentManaged
        if (consentManaged && !optoutFailed) {
            return bel`
            <li class="js-site-show-consent-managed site-info__li--consent-managed padded border-light--top">
                <div>
                    <div class="site-info__trackers">
                        <span class="site-info__https-status__icon is-secure"></span>
                        <span class="bold">${i18n.t('site:cookiesMinimized.title')}</span>
                    </div>
                    <div class="action-description">
                        ${i18n.t('site:cookiesMinimizedDesc.title')}
                    </div>
                </div>
            </li>
            `
        }
        return bel``
    }

    function localizePermissions (permissions) {
        // deep copy before mutating
        const updatedPermissions = JSON.parse(JSON.stringify(permissions))

        return updatedPermissions.map((perm) => {
            const permKey = `permissions:${perm.key}.title`
            if (i18n.exists(permKey)) {
                perm.title = i18n.t(permKey)
            }

            perm.options = perm.options.map((option) => {
                const optionKey = `permissions:${option.id}.title`
                if (i18n.exists(optionKey)) {
                    option.title = i18n.t(optionKey)
                }
                return option
            })

            return perm
        })
    }
}
