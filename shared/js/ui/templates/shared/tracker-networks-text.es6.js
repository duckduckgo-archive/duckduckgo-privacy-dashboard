const bel = require('bel')
const { isSiteWithOnlyOwnTrackers } = require('./utils.es6')
const i18n = window.DDG.base.i18n

module.exports = function (site, isMajorNetworksCount) {
    // Show all trackers found if site is whitelisted
    // but only show the blocked ones otherwise
    let trackerCount = site.isWhitelisted ? site.trackersCount : site.trackersBlockedCount || 0
    if (isMajorNetworksCount) {
        trackerCount = site.majorTrackerNetworksCount
    }

    const finalText = i18n.t('site:trackerNetworksDesc.title', { trackerCount, majorNetwork: isMajorNetworksCount, blocked: trackersBlocked(site) })

    return bel`${finalText}`
}

function trackersBlocked (site) {
    if (site.isWhitelisted) return false
    if (isSiteWithOnlyOwnTrackers(site)) return true
    if (site.trackersCount === 0) return false
    return true
}
