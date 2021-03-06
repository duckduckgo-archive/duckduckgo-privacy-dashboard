const bel = require('bel')
const hero = require('./shared/hero.es6.js')
const trackerNetworksIcon = require('./shared/tracker-network-icon.es6.js')
const { isSiteWithOnlyOwnTrackers, isSameEntity, getColorId } = require('./shared/utils.es6.js')
const displayCategories = require('./../../../data/constants.js').displayCategories
const i18n = window.DDG.base.i18n

module.exports = function () {
    if (!this.model) {
        return bel`<section class="sliding-subview"></section>`
    }

    return bel`<div class="tracker-networks site-info card">
        <div class="js-tracker-networks-hero">
            ${renderHero(this.model.site)}
        </div>
        <div class="tracker-networks__explainer text--center">
            ${renderSummary(this.model)}
        </div>
        <div class="tracker-networks__details padded js-tracker-networks-details">
            ${renderTrackerDetails(this.model)}
        </div>
    </div>`
}

function renderHero (site) {
    site = site || {}

    return bel`${hero({
        status: trackerNetworksIcon(site),
        title: i18n.t('trackers.title'),
        showClose: true
    })}`
}

function renderSummary (model) {
    if (isSiteWithOnlyOwnTrackers(model.site)) {
        const name = model.tab.parentEntity?.displayName || model.tab.site.domain
        return i18n.t('site:firstPartyDesc.title', { companyName: name })
    }

    if ((model.companyList || []).length === 0) {
        return i18n.t('site:trackerNetworksSummaryNone.title')
    }

    if (model.site.isWhitelisted) {
        return i18n.t('site:trackersFoundForAllowlisted.title')
    }

    return i18n.t('site:trackersFoundAndBlocked.title')
}

function trackerListWrapper (heading, contents) {
    if (contents.length === 0) return ''

    return bel`
        <ol class="default-list site-info__trackers__company-list" aria-label="List of tracker networks">
            ${heading ? bel`<li class="tracker-list-header border-light--bottom--inner border-light--top--inner">${heading}</li>` : ''}
            ${contents}
        </ol>
    `
}

function renderCompanyTrackers (model) {
    return (c, i, companyList) => {
        if (c.name && c.name === 'unknown') {
            c.name = `(${i18n.t('site:trackerNetworkUnknown.title')})`
        }
        const isLast = companyList.length - 1 === i

        return bel`<li class="site-info__trackers__company-list-item ${isLast ? '' : 'border-light--bottom--inner'}">
            <h1 title="${c.name}" class="site-info__domain block">
                <span class="site-info__tracker__icon ${c.slug[0].toUpperCase()} color-${getColorId(c.slug)} ${c.slug}"></span>
                ${c.displayName}
            </h1>
            <ol class="default-list site-info__trackers__company-list__url-list" aria-label="${i18n.t('site:trackerDomainsForCompany.title', { companyName: c.name })}">
                ${c.urlsList.map((url) => {
        // find first matching category from our list of allowed display categories
        let category = ''
        if (c.urls[url] && c.urls[url].categories) {
            Object.keys(displayCategories).some(displayCat => {
                const match = c.urls[url].categories.find(cat => cat === displayCat)
                if (match) {
                    category = displayCategories[match]
                    return true
                }
                return false
            })
        }
        return bel`<li>
                        <div class="url">${url}</div>
                        <div class="category">${i18n.t(category)}</div>
                    </li>`
    })}
            </ol>
        </li>`
    }
}

function reduceCompanyListByUrl (companyList, filterBy) {
    return companyList.reduce((group, company) => {
        const filteredUrlsList = company.urlsList.filter((url) => filterBy(company, url))
        if (filteredUrlsList.length === 0) return group

        const filteredUrls = filteredUrlsList.reduce((group, url) =>
            Object.assign(group, { [url]: company.urls[url] }), {})
        const blockedCompany = Object.assign({}, company, { urls: filteredUrls, urlsList: filteredUrlsList })
        return group.concat(blockedCompany)
    }, [])
}

function renderTrackerDetails (model) {
    const companyList = model.companyList || []
    if (companyList.length === 0) {
        return trackerListWrapper(i18n.t('site:zeroTrackersFound.title'), [''])
    }

    const blockedCompanies = reduceCompanyListByUrl(companyList, (company, url) => {
        const sameEntity = isSameEntity(company, model.tab.parentEntity)

        return model.site.isWhitelisted ? !sameEntity : (!sameEntity && company.urls[url].isBlocked)
    })
    const unblockedCompanies = reduceCompanyListByUrl(companyList, (company, url) => isSameEntity(company, model.tab.parentEntity))
    const count = model.site.isWhitelisted ? model.site.trackersCount : model.site.trackersBlockedCount

    return bel`
        <div>
            ${trackerListWrapper(
        i18n.t('site:trackerOwnedByThisSite.title'),
        unblockedCompanies.map(renderCompanyTrackers(model))
    )}
            ${trackerListWrapper(
        i18n.t('site:trackerCountForDomain.title', { trackerCount: count, blocked: !model.site.isWhitelisted, domain: model.domain }),
        blockedCompanies.map(renderCompanyTrackers(model))
    )}
        </div>
    `
}
