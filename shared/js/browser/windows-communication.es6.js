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

const combineSources = () => Object.assign(
    {
        isPendingUpdates,
        parentEntity
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

function handleViewModelUpdate (viewModel) {
    upgradedHttps = viewModel.upgradedHttps
    isProtected = viewModel.isProtected
    parentEntity = viewModel.parentEntity || {}
    permissionsData = viewModel.permissions || []

    trackerBlockingData = convertTrackerDataPayload(viewModel.tabUrl, upgradedHttps, !isProtected, viewModel.rawTrackerBlockingData)

    if (trackerBlockingData) trackerBlockingData.upgradedHttps = upgradedHttps
    if (trackerBlockingData) trackerBlockingData.site.whitelisted = !isProtected

    certificateData = viewModel.certificates

    resolveInitialRender()
}

// -----------------------------------------------------------------------------

function getAdditionalParams () {
    const browser = 'windows'
    const queryStringParams = {}
    const result = [browser, queryStringParams]

    return result
}

function windowsPostMessage (name, data) {
    window.chrome.webview.postMessage({
        Feature: 'PrivacyDashboard',
        Name: name,
        Data: data
    })
}

const fetch = (message) => {
    if (!window.chrome.webview) {
        console.error('window.chrome.webview not available')
        return
    }

    if (message.toggleWhitelist) {
        const isProtected = message.toggleWhitelist.value
        if (isProtected) {
            windowsPostMessage('RemoveFromAllowListCommand')
        } else {
            windowsPostMessage('AddToAllowListCommand')
        }

        // Call as if this was an outside change. This will trigger events to
        // have all models re-request data from background state.
        window.onChangeProtectionStatus(isProtected)
    }

    if (message.updatePermission) {
        windowsPostMessage('SetPermissionCommand', {
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
        windowsPostMessage('PrivacyDashboardFirePixelCommand', `${pixelName}${paramString}`)
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

window.chrome.webview.addEventListener('message', event => handleViewModelUpdate(event.data))

setupMutationObserver((height) => {
    windowsPostMessage('UpdateWindowSizeCommand', { height: height })
})

module.exports = {
    fetch: fetch,
    backgroundMessage: backgroundMessage,
    getBackgroundTabData: getBackgroundTabData
}
