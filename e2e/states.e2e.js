import generateData from '../shared/js/ui/views/tests/mock-data/generate-data'
import setupPage from './setup-page'

describe('Privacy Dashboard States', () => {
    const {
        goTo,
        setupColorScheme,
        setupPageData,
        takeScreenshot,
        clickTrackerListAction,
        clickConnectionAction,
        clickBrokenSiteAction
    } = setupPage()

    const sanitize = (value) =>
        value
            .toLowerCase()
            .trim()
            .replace(/\s+/g, '-')
            .replace(/[^a-z0-9-]/g, '')

    describe.each([
        ['Light Appearance', 'light'],
        ['Dark Appearance', 'dark']
    ])('%s', (name, colorScheme) => {
        const testScreenshot = () => {
            it('renders correctly', async () => {
                expect(await takeScreenshot()).toMatchImageSnapshot({
                    customSnapshotIdentifier: ({ currentTestName, counter }) => {
                        const [, testDetails] = currentTestName.split(' Appearance ')
                        const imageName = testDetails.replace('renders correctly', '')
                        return `states/${colorScheme}/${sanitize(imageName)}-${counter}`
                    },
                    failureThreshold: 0.005,
                    failureThresholdType: 'percent'
                })
            })
        }

        beforeEach(() => {
            setupColorScheme(colorScheme)
        })

        describe('when there is populated data', () => {
            beforeEach(async () => {
                await setupPageData(generateData({}))
                await goTo('popup')
            })

            describe('on summary page', () => {
                testScreenshot()
            })

            describe('on tracker list page', () => {
                beforeEach(clickTrackerListAction)
                testScreenshot()
            })

            describe('on connection page', () => {
                beforeEach(clickConnectionAction)
                testScreenshot()
            })

            describe('on report broken site page', () => {
                beforeEach(clickBrokenSiteAction)
                testScreenshot()
            })
        })

        describe('when there are no permissions requested', () => {
            beforeEach(async () => {
                await setupPageData(generateData({ permissions: [] }))
                await goTo('popup')
            })

            describe('on summary page', () => {
                testScreenshot()
            })
        })

        describe('when the site parent entity is a tracker network', () => {
            beforeEach(async () => {
                await setupPageData(generateData({ parentEntity: { prevalence: 80 } }))
                await goTo('popup')
            })

            describe('on summary page', () => {
                testScreenshot()
            })
        })

        describe('when there are no trackers detected', () => {
            beforeEach(async () => {
                await setupPageData(
                    generateData({
                        overwrites: { trackers: {}, trackersBlocked: {} }
                    })
                )
                await goTo('popup')
            })

            describe('on summary page', () => {
                testScreenshot()
            })

            describe('on tracker list page', () => {
                beforeEach(clickTrackerListAction)
                testScreenshot()
            })
        })

        describe('when there are only first-party trackers detected for tracker network', () => {
            beforeEach(async () => {
                const trackers = [generateData({}).trackers['Example Ltd']]
                await setupPageData(
                    generateData({
                        parentEntity: { prevalence: 80 },
                        site: { trackerUrls: ['example.com'] },
                        overwrites: { trackers, trackersBlocked: {} }
                    })
                )
                await goTo('popup')
            })

            describe('on summary page', () => {
                testScreenshot()
            })

            describe('on tracker list page', () => {
                beforeEach(clickTrackerListAction)
                testScreenshot()
            })
        })

        describe('when protections are disabled', () => {
            beforeEach(async () => {
                await setupPageData(generateData({ site: { whitelisted: true } }))
                await goTo('popup')
            })

            describe('on summary page', () => {
                testScreenshot()
            })

            describe('on tracker list page', () => {
                beforeEach(clickTrackerListAction)
                testScreenshot()
            })
        })

        describe('when locale is changed', () => {
            beforeEach(async () => {
                await setupPageData(generateData({ locale: 'cimode' }))
                await goTo('popup')
            })

            describe('on summary page', () => {
                testScreenshot()
            })

            describe('on tracker list page', () => {
                beforeEach(clickTrackerListAction)
                testScreenshot()
            })
        })

        describe('when there is an upgraded connection', () => {
            beforeEach(async () => {
                await setupPageData(generateData({ upgradedHttps: true }))
                await goTo('popup')
            })

            describe('on summary page', () => {
                testScreenshot()
            })

            describe('on connection page', () => {
                beforeEach(clickConnectionAction)
                testScreenshot()
            })
        })

        describe('when there is an insecure connection', () => {
            beforeEach(async () => {
                await setupPageData(
                    generateData({ isSecure: false, certificate: null })
                )
                await goTo('popup')
            })

            describe('on summary page', () => {
                testScreenshot()
            })

            describe('on connection page', () => {
                beforeEach(clickConnectionAction)
                testScreenshot()
            })
        })

        describe('when there are cookie consent popups hidden', () => {
            beforeEach(async () => {
                await setupPageData(generateData({
                    consentManaged: {
                        consentManaged: true,
                        optoutFailed: false,
                        selftestFailed: false
                    }
                }))
                await goTo('popup')
            })

            describe('on summary page', () => {
                testScreenshot()
            })
        })
    })
})
