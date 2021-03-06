const exampleTrackers = {
    displayName: 'Example',
    prevalence: 0.0189,
    urls: {
        'example.com': {
            isBlocked: false,
            reason: 'first party',
            categories: []
        }
    },
    count: 6,
    type: ''
}

const googleTrackers = {
    displayName: 'Google',
    prevalence: 82.6,
    urls: {
        'securepubads.g.doubleclick.net': {
            isBlocked: true,
            reason: 'matched rule - surrogate',
            categories: [
                'Ad Motivated Tracking',
                'Advertising'
            ]
        },
        'pagead2.googlesyndication.com': {
            isBlocked: true,
            reason: 'default block',
            categories: [
                'Ad Motivated Tracking',
                'Advertising'
            ]
        }
    },
    count: 2,
    type: ''
}

const indexExchangeTrackers = {
    displayName: 'Index Exchange',
    prevalence: 12.7,
    urls: {
        'htlb.casalemedia.com': {
            isBlocked: true,
            reason: 'default block',
            categories: [
                'Ad Motivated Tracking',
                'Advertising',
                'Analytics'
            ]
        },
        'indexww.com': {
            isBlocked: false,
            categories: [
                'Advertising',
                'Analytics'
            ]
        }
    },
    count: 1,
    type: ''
}

const certificate = [
    {
        commonName: 'sni.cloudflaressl.com',
        publicKey: {
            blockSize: 72,
            canEncrypt: true,
            bitSize: 256,
            canSign: false,
            canDerive: true,
            canUnwrap: false,
            canWrap: false,
            canDecrypt: false,
            effectiveSize: 256,
            isPermanent: false,
            type: 'Elliptic Curve',
            externalRepresentation:
          'BEO3YVjG8jpNVRlh9G10paEfrx9XnVG9GvNtOAYkZvuytfhKTZ9sW+MhQaFDAgKveZUDIMg7WvG8QXZGPNTWCKg=',
            canVerify: true,
            keyId: 'Xbo6o2j/lA8zNZ/axcChz8ID2MM='
        },
        emails: [],
        summary: 'sni.cloudflaressl.com'
    },
    {
        commonName: 'Cloudflare Inc ECC CA-3',
        publicKey: {
            blockSize: 72,
            canEncrypt: true,
            bitSize: 256,
            canSign: false,
            canDerive: true,
            canUnwrap: false,
            canWrap: false,
            canDecrypt: false,
            effectiveSize: 256,
            isPermanent: false,
            type: 'Elliptic Curve',
            externalRepresentation:
          'BLmtTWaZFAtG7B+B0SpQHp0DFS80En0tlriIOJuFX4+/u03vYUbEyXPUJE/g7hzObLNRcS9q7kwFCXfTcmKkm9c=',
            canVerify: true,
            keyId: 'pc436uuwdQ6UZ4i0RfrZJBCHlh8='
        },
        emails: [],
        summary: 'Cloudflare Inc ECC CA-3'
    },
    {
        commonName: 'Baltimore CyberTrust Root',
        publicKey: {
            blockSize: 256,
            canEncrypt: false,
            bitSize: 2048,
            canSign: false,
            canDerive: false,
            canUnwrap: false,
            canWrap: false,
            canDecrypt: false,
            effectiveSize: 2048,
            isPermanent: false,
            type: 'RSA',
            externalRepresentation:
          'MIIBCgKCAQEAowS7IquYPVfoJnKatXnUKeLh6JWAsbDjW44rKZpk36Fd7bAJBW3bKC7OYqJi/rSI2hLrOOshncBBKwFSe4h30xyPx7q5iLVqCedz6BFAp9HMymKNLeWPC6ZQ0qhQwyjq9aslh4qalhypZ7g/DNX3+VITL8Ib1XBw8I/AEsoGy5rh2cozenfW+Oy58WhEQkgT0sDCpK5eYP62pgX8tN0HWQLUWRiYY/WlY+CQDH1dsgZ684Xq69QDrl6EPl//Fe1pvPk5NnJ1z3dSTfPJkCy5PeXJI1M/HySYIVwHmSm9xjrs526GOmuXdGMzvWgYMfB4jXa//J6OXSqGp02Q3CcaOQIDAQAB',
            canVerify: true,
            keyId: '5Z1ZMIJHWMys+ghUNoZ7OrUETfA='
        },
        emails: [],
        summary: 'Baltimore CyberTrust Root'
    }
]

const permissions = [
    {
        key: 'camera',
        paused: false,
        permission: 'deny',
        title: 'Camera',
        used: true,
        options: [
            {
                id: 'ask',
                title: 'Ask every time'
            },
            {
                id: 'grant',
                title: 'Always allow'
            },
            {
                id: 'deny',
                title: 'Always deny'
            }
        ]
    },
    {
        key: 'microphone',
        paused: false,
        permission: 'ask',
        title: 'Microphone',
        used: true,
        options: [
            {
                id: 'ask',
                title: 'Ask every time'
            },
            {
                id: 'grant',
                title: 'Always allow'
            },
            {
                id: 'deny',
                title: 'Always deny'
            }
        ]
    },
    {
        key: 'geolocation',
        paused: false,
        permission: 'ask',
        title: 'Geolocation',
        used: true,
        options: [
            {
                id: 'ask',
                title: 'Ask every time'
            },
            {
                id: 'deny',
                title: 'Always deny'
            }
        ]
    },
    {
        key: 'popups',
        paused: false,
        permission: 'notify',
        title: 'Pop-ups',
        used: true,
        options: [
            {
                id: 'notify',
                title: 'Notify'
            },
            {
                id: 'grant',
                title: 'Always allow'
            },
            {
                id: 'deny',
                title: 'Always deny'
            }
        ]
    }
]

const consentManaged = null

module.exports = ({ isSecure = true, site = {}, trackers = {}, trackersBlocked = {}, parentEntity = {}, overwrites = {}, ...overrides }) => ({
    id: 123,
    url: `http${isSecure ? 's' : ''}://www.example.com/`,
    status: 'complete',
    upgradedHttps: false,
    parentEntity: {
        displayName: 'Example',
        domains: [],
        prevalence: 0.123,
        ...parentEntity
    },
    site: {
        url: `http${isSecure ? 's' : ''}://www.example.com/`,
        domain: 'example.com',
        whitelisted: false,
        trackerUrls: [
            'example.com',
            'doubleclick.net',
            'casalemedia.com',
            'googlesyndication.com'
        ],
        ...site
    },
    trackers: {
        'Example Ltd': exampleTrackers,
        'Google LLC': googleTrackers,
        'Index Exchange, Inc.': indexExchangeTrackers,
        ...trackers
    },
    trackersBlocked: {
        'Google LLC': googleTrackers,
        'Index Exchange, Inc.': indexExchangeTrackers,
        ...trackersBlocked
    },
    locale: 'en',
    certificate,
    permissions,
    consentManaged,
    ...overrides,
    ...overwrites
})
