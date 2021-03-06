/**
 * @jest-environment jsdom
 */

const generateData = require('./mock-data/generate-data')
class MockMutationObserver {
    observe () {}
    unobserve () {}
}
window.MutationObserver = MockMutationObserver
jest.mock('../../../browser/$ENVIRONMENT-communication.es6.js', () => ({
    fetch: jest.fn(),
    backgroundMessage: jest.fn(),
    getBackgroundTabData: jest.fn()
}), { virtual: true })
jest.mock('../../pages/popup.es6.js', () => {})

describe('Site view', () => {
    let macosCommunication
    let dataResolve

    beforeEach(() => {
    // Set the scene
        document.body.innerHTML = '<div id="test-container"></div>'
        jest.spyOn(console, 'info').mockImplementation()

        jest.isolateModules(() => {
            // Import the base to set up globals
            require('../../../ui/base/index.es6.js')

            // Mock out communication calls
            const dataPromise = new Promise((resolve) => { dataResolve = resolve })
            macosCommunication = require('../../../browser/$ENVIRONMENT-communication.es6.js')
            macosCommunication.getBackgroundTabData.mockReturnValue(dataPromise)

            // Call the site view and pass in dependencies
            const SiteModel = require('../../models/site.es6.js')
            const siteTemplate = require('../../templates/site.es6')
            const SiteView = require('../site.es6.js')
            // eslint-disable-next-line no-new
            new SiteView({
                pageView: this,
                model: new SiteModel(),
                appendTo: window.$('#test-container'),
                template: siteTemplate
            })
        })
    })

    it('renders nothing initially', () => {
        expect(document.getElementById('test-container').innerHTML).toBe('')
    })

    describe('when protection is enabled', () => {
        describe('and locale is changed', () => {
            beforeEach(() => {
                dataResolve(generateData({ permissions: [], site: { whitelisted: false }, locale: 'cimode' }))
            })

            it('renders the correct output', () => {
                expect(document.getElementById('test-container')).toMatchSnapshot()
            })
        })

        describe('and connection is secure', () => {
            beforeEach(() => {
                dataResolve(generateData({ permissions: [], site: { whitelisted: false } }))
            })

            it('renders the correct output', () => {
                expect(document.getElementById('test-container')).toMatchSnapshot()
            })
        })

        describe('and connection is insecure', () => {
            beforeEach(() => {
                dataResolve(generateData({ permissions: [], site: { whitelisted: false }, isSecure: false }))
            })

            it('renders the correct output', () => {
                expect(document.getElementById('test-container')).toMatchSnapshot()
            })
        })

        describe('and connection was upgraded', () => {
            beforeEach(() => {
                dataResolve(generateData({ permissions: [], site: { whitelisted: false }, upgradedHttps: true }))
            })

            it('renders the correct output', () => {
                expect(document.getElementById('test-container')).toMatchSnapshot()
            })
        })

        describe('and no trackers are found', () => {
            beforeEach(() => {
                const data = generateData({ permissions: [], site: { whitelisted: false, trackerUrls: [] } })
                data.trackers = {}
                data.trackersBlocked = {}
                dataResolve(data)
            })

            it('renders the correct output', () => {
                expect(document.getElementById('test-container')).toMatchSnapshot()
            })
        })

        describe('and site is owned by tracking network', () => {
            beforeEach(() => {
                const data = generateData({ permissions: [], site: { whitelisted: false }, parentEntity: { prevalence: 90.123 } })
                dataResolve(data)
            })

            it('renders the correct output', () => {
                expect(document.getElementById('test-container')).toMatchSnapshot()
            })
        })
    })

    describe('when protection is not enabled', () => {
        describe('and locale is changed', () => {
            beforeEach(() => {
                dataResolve(generateData({ permissions: [], site: { whitelisted: true }, locale: 'cimode' }))
            })

            it('renders the correct output', () => {
                expect(document.getElementById('test-container')).toMatchSnapshot()
            })
        })

        describe('and connection is secure', () => {
            beforeEach(() => {
                dataResolve(generateData({ permissions: [], site: { whitelisted: true }, isSecure: true }))
            })

            it('renders the correct output', () => {
                expect(document.getElementById('test-container')).toMatchSnapshot()
            })
        })

        describe('and connection is insecure', () => {
            beforeEach(() => {
                dataResolve(generateData({ permissions: [], site: { whitelisted: true }, isSecure: false }))
            })

            it('renders the correct output', () => {
                expect(document.getElementById('test-container')).toMatchSnapshot()
            })
        })

        describe('and connection was upgraded', () => {
            beforeEach(() => {
                dataResolve(generateData({ permissions: [], site: { whitelisted: true }, upgradedHttps: true }))
            })

            it('renders the correct output', () => {
                expect(document.getElementById('test-container')).toMatchSnapshot()
            })
        })

        describe('and no trackers are found', () => {
            beforeEach(() => {
                const data = generateData({ permissions: [], site: { whitelisted: true, trackerUrls: [] } })
                data.trackers = {}
                data.trackersBlocked = {}
                dataResolve(data)
            })

            it('renders the correct output', () => {
                expect(document.getElementById('test-container')).toMatchSnapshot()
            })
        })

        describe('and site is owned by tracking network', () => {
            beforeEach(() => {
                const data = generateData({ permissions: [], site: { whitelisted: true }, parentEntity: { prevalence: 90.123 } })
                dataResolve(data)
            })

            it('renders the correct output', () => {
                expect(document.getElementById('test-container')).toMatchSnapshot()
            })
        })
    })

    describe('when permissions are set', () => {
        beforeEach(() => {
            const permissions = [
                {
                    key: 'camera',
                    options: [
                        { id: 'ask', title: 'Always Ask on example.com' },
                        { id: 'grant', title: 'Always Allow on example.com' },
                        { id: 'deny', title: 'Never ask again for example.com' }
                    ],
                    paused: false,
                    permission: 'ask',
                    title: 'camera',
                    used: true
                }
            ]
            dataResolve(generateData({ permissions }))
        })

        it('renders the correct output', () => {
            expect(document.getElementById('test-container')).toMatchSnapshot()
        })

        describe('and permission access is changed', () => {
            beforeEach(() => {
                // Change the permission
                const $select = document.querySelector('.js-site-permission')
                $select.selectedIndex = 2 // deny
                $select.dispatchEvent(new Event('change'))
            })

            it('calls the native handler', () => {
                expect(macosCommunication.fetch).toBeCalledTimes(1)
                expect(macosCommunication.fetch.mock.calls[0][0]).toEqual({ updatePermission: { id: 'camera', value: 'deny' } })
            })
        })
    })

    describe('when cookie consent popups are hidden', () => {
        beforeEach(() => {
            const consentManaged = {
                consentManaged: true,
                optoutFailed: false,
                selftestFailed: false
            }
            dataResolve(generateData({ consentManaged }))
        })

        it('renders the correct output', () => {
            expect(document.getElementById('test-container')).toMatchSnapshot()
        })
    })
})
