import { convertTrackerDataPayload, concatParams, setupMutationObserver } from './common.es6'

let channel = null
const backgroundMessage = (backgroundModel) => {
    channel = backgroundModel
}

const getBackgroundTabDataPromises = []
let trackerBlockingData
let permissionsData
let certificateData
let upgradedHttps
let isProtected
let isPendingUpdates
let parentEntity
let consentManaged

const combineSources = () => Object.assign(
    {
        isPendingUpdates,
        parentEntity,
        consentManaged
    },
    trackerBlockingData || {},
    permissionsData ? { permissions: permissionsData } : {},
    certificateData ? { certificate: certificateData } : {}
)

const resolveInitialRender = function () {
    const isUpgradedHttpsSet = typeof upgradedHttps === 'boolean'
    const isIsProtectedSet = typeof isProtected === 'boolean'
    const isTrackerBlockingDataSet = typeof trackerBlockingData === 'object'
    if (!isUpgradedHttpsSet || !isIsProtectedSet || !isTrackerBlockingDataSet) {
        return
    }

    getBackgroundTabDataPromises.forEach((resolve) => resolve(combineSources()))
    channel?.send('updateTabData')
}

// Change handlers
// -----------------------------------------------------------------------------

window.onChangeTrackerBlockingData = function (tabUrl, rawTrackerBlockingData) {
    trackerBlockingData = convertTrackerDataPayload(tabUrl, upgradedHttps, !isProtected, rawTrackerBlockingData)
    resolveInitialRender()
}

window.onChangeAllowedPermissions = function (data) {
    permissionsData = data
    channel?.send('updateTabData')
}

window.onChangeUpgradedHttps = function (data) {
    upgradedHttps = data

    if (trackerBlockingData) trackerBlockingData.upgradedHttps = upgradedHttps
    resolveInitialRender()
}

window.onChangeProtectionStatus = function (data) {
    isProtected = data

    if (trackerBlockingData) trackerBlockingData.site.whitelisted = !isProtected
    resolveInitialRender()
}

window.onChangeCertificateData = function (data) {
    certificateData = data.secCertificateViewModels
    channel?.send('updateTabData')
}

window.onIsPendingUpdates = function (data) {
    isPendingUpdates = data
    channel?.send('updateTabData')
}

window.onChangeParentEntity = function (data) {
    parentEntity = data
    channel?.send('updateTabData')
}

window.onChangeConsentManaged = function (data) {
    consentManaged = data
    channel?.send('updateTabData')
}

// -----------------------------------------------------------------------------

function getAdditionalParams () {
    const browser = 'macos_desktop'
    const queryStringParams = {}
    const result = [browser, queryStringParams]

    return result
}

const fetch = (message) => {
    if (!window.webkit) {
        console.error('window.webkit not available')
        return
    }

    if (message.toggleWhitelist) {
        const isProtected = message.toggleWhitelist.value
        window.webkit.messageHandlers.privacyDashboardSetProtection.postMessage(isProtected)

        // Call as if this was an outside change. This will trigger events to
        // have all models re-request data from background state.
        window.onChangeProtectionStatus(isProtected)
    }

    if (message.updatePermission) {
        window.webkit.messageHandlers.privacyDashboardSetPermission.postMessage({
            permission: message.updatePermission.id,
            value: message.updatePermission.value
        })
    }

    if (message.firePixel) {
        const pixelName = message.firePixel[0]

        // Only allow broken site reports
        if (pixelName !== 'epbf') return

        const args = message.firePixel.slice(1).concat(getAdditionalParams())
        const paramString = concatParams(args)

        // Pass to native to send request
        window.webkit.messageHandlers.privacyDashboardFirePixel.postMessage(`${pixelName}${paramString}`)
    }
}

const getBackgroundTabData = () => {
    return new Promise((resolve) => {
        if (trackerBlockingData) {
            resolve(combineSources())
            return
        }

        getBackgroundTabDataPromises.push(resolve)
    })
}

setupMutationObserver((height) => {
    window.webkit.messageHandlers.privacyDashboardSetHeight.postMessage(height)
})

module.exports = {
    fetch: fetch,
    backgroundMessage: backgroundMessage,
    getBackgroundTabData: getBackgroundTabData
}
