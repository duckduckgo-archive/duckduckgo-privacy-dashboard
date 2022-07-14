// This is am example interface purely for previewing the panel
const generateData = require('../ui/views/tests/mock-data/generate-data')

let channel = null

let isSecure = true
let isPendingUpdates = false
const siteOverrides = {
    whitelisted: false
}

// Modify state after render
// eslint-disable-next-line no-unused-vars
const tweakSecureStatus = () => {
    isSecure = false
    channel?.send('updateTabData')
}
// setTimeout(() => tweakSecureStatus(), 10000)

export function fetch (...args) {
    if (args[0].toggleWhitelist) {
        console.log('fetch - Updating in memory overrides', args)
        isPendingUpdates = true
        channel?.send('updateTabData')
        setTimeout(() => {
            isPendingUpdates = false
            siteOverrides.whitelisted = !args[0].toggleWhitelist.value
            channel?.send('updateTabData')
        }, 2000)
        return
    }

    console.log('fetch - Not implemented', args)
}

export function backgroundMessage (backgroundModel) {
    console.log('backgroundMessage - setting local channel')
    channel = backgroundModel
}

const consentManaged = {
    consentManaged: true,
    optoutFailed: false,
    selftestFailed: false
}

export async function getBackgroundTabData () {
    const data = generateData({ isSecure, isPendingUpdates, consentManaged, site: siteOverrides })
    console.log('getBackgroundTabData', data)
    return data
}
