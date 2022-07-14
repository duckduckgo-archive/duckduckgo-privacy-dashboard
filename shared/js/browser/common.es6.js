const convertTrackers = (trackerList) => {
    return trackerList.reduce((mapping, tracker) => {
        if (!tracker.knownTracker) return mapping

        const key = tracker.knownTracker.owner.name

        if (!mapping[key]) {
            mapping[key] = {
                displayName: tracker.entity.displayName,
                prevalence: tracker.entity.prevalence,
                urls: {}
            }
        }

        const urlKey = new URL(tracker.url).hostname
        mapping[key].urls[urlKey] = {
            isBlocked: tracker.blocked,
            categories: tracker.knownTracker.categories
        }
        mapping[key].count = Object.keys(mapping[key].urls).length

        return mapping
    }, {})
}

export const convertTrackerDataPayload = (tabUrl, upgradedHttps, whitelisted, data) => {
    const allTrackers = data.trackersDetected.concat(data.trackersBlocked)
    const trackers = convertTrackers(allTrackers)
    const trackersBlocked = convertTrackers(data.trackersBlocked)
    const tabDomain = (new URL(tabUrl).host).replace(/^www\./, '')

    return {
        url: tabUrl,
        status: 'complete',
        upgradedHttps,
        site: {
            url: tabUrl,
            domain: tabDomain,
            whitelisted
        },
        trackers,
        trackersBlocked
    }
}

export function concatParams (args) {
    args = args || []

    let paramString = ''
    let objParamString = ''
    let resultString = ''
    const randomNum = Math.ceil(Math.random() * 1e7)

    args.forEach((arg) => {
        // append keys if object
        if (typeof arg === 'object') {
            objParamString += Object.keys(arg).reduce((params, key) => {
                const val = arg[key]
                if (val || val === 0) return `${params}&${key}=${val}`
                return params
            }, '')
        } else if (arg) {
            // otherwise just add args separated by _
            paramString += `_${arg}`
        }
    })

    resultString = `${paramString}?${randomNum}${objParamString}`

    return resultString
}

export const getContentHeight = () => {
    const $openSubview = window.document.querySelector('#popup-container.sliding-subview--open > section:last-child > div')
    const $rootSubview = window.document.querySelector('#popup-container.sliding-subview--root > section:first-child > div')
    return ($openSubview || $rootSubview)?.scrollHeight
}

export function setupMutationObserver (callback) {
    const bufferHeight = 200
    let lastHeight
    const mutationObserver = new MutationObserver(() => {
        const contentHeight = getContentHeight()
        if (!contentHeight) return

        const height = Math.min(window.screen.height - bufferHeight, contentHeight)

        // Only update if the height has changed since last run
        if (lastHeight === height) return
        lastHeight = height

        callback(height)
    })
    const config = { childList: true, attributes: true, subtree: true }
    mutationObserver.observe(window.document, config)
}
