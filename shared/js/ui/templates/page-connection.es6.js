const bel = require('bel')
const hero = require('./shared/hero.es6.js')
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
            ${renderConnectionDescription(this.model)}
        </div>
        <div class="padded">
            <div class="certificate-header border-light--bottom--inner border-light--top--inner">
                ${renderHeader(this.model)}
            </div>
        </div>
        ${renderCertificateDetails(this.model)}
    </div>`
}

function getKeyUsage (key) {
    const capabilities = {
        canEncrypt: i18n.t('connection:encrypt.title'),
        canDecrypt: i18n.t('connection:decrypt.title'),
        canSign: i18n.t('connection:sign.title'),
        canVerify: i18n.t('connection:verify.title'),
        canDerive: i18n.t('connection:derive.title'),
        canWrap: i18n.t('connection:wrap.title'),
        canUnwrap: i18n.t('connection:unwrap.title')
    }

    const keyUsage = Object.keys(capabilities).reduce((usage, capability) => {
        if (!key[capability]) return usage
        return [].concat(usage, capabilities[capability])
    }, [])

    if (keyUsage.length === 0) return i18n.t('connection:unknown.title')
    return keyUsage.join(', ')
}

function renderCertificateDetails (model) {
    if (!model.tab.certificate || model.tab.certificate.length === 0) return ''

    const certificate = model.tab.certificate[0]
    return bel`
        <div class="page-connection__certificate">
            <div class="page-connection__certificate-details border--bottom-light--inner">
                <h3>${i18n.t('connection:certificateDetail.title')}</h3>
                <div>
                    <span>${i18n.t('connection:commonName.title')}</span>
                    <span class="page-connection__certificate-value">${certificate.commonName}</span>
                </div>
                ${renderCertificateSummary(certificate)}
            </div>
            <div class="page-connection__certificate-details">
                <h3>${i18n.t('connection:publicKey.title')}</h3>
                <div>
                    <span>${i18n.t('connection:algorithm.title')}</span>
                    <span class="page-connection__certificate-value">${certificate.publicKey.type}</span>
                </div>
                <div>
                    <span>${i18n.t('connection:keySize.title')}</span>
                    <span class="page-connection__certificate-value">${certificate.publicKey.bitSize} bits</span>
                </div>
                ${renderCertificateEffectiveSize(certificate)}
                <div>
                    <span>${i18n.t('connection:usage.title')}</span>
                    <span class="page-connection__certificate-value">${getKeyUsage(certificate.publicKey)}</span>
                </div>
                ${renderCertificateIsPermanent(certificate)}
            </div>
        </div>
    `
}

function renderCertificateSummary (certificate) {
    if (!certificate.summary) return ''

    return bel`<div>
                <span>${i18n.t('connection:summary.title')}</span>
                <span class="page-connection__certificate-value">${certificate.summary}</span>
            </div>`
}

function renderCertificateIsPermanent (certificate) {
    if (!certificate.publicKey || typeof certificate.publicKey.isPermanent !== 'boolean') return ''

    return bel`<div>
                <span>${i18n.t('connection:permanent.title')}</span>
                <span class="page-connection__certificate-value">${certificate.publicKey.isPermanent ? 'Yes' : 'No'}</span>
            </div>`
}

function renderCertificateEffectiveSize (certificate) {
    if (!certificate.publicKey && !certificate.publicKey.effectiveSize) return ''

    return bel`<div>
                <span>${i18n.t('connection:effectiveSize.title')}</span>
                <span class="page-connection__certificate-value">${certificate.publicKey.effectiveSize} bits</span>
            </div>`
}

function renderHeader (model) {
    if (model.site.httpsState === 'none') return i18n.t('connection:certificateNotFound.title')

    return i18n.t('connection:certificateForDomain.title', { domain: model.domain })
}

function renderConnectionDescription (model) {
    if (model.site.httpsState === 'none') {
        return i18n.t('connection:insecureConnectionDesc.title')
    }

    if (model.site.httpsState === 'upgraded') {
        return i18n.t('connection:upgradedConnectionDesc.title')
    }

    return i18n.t('connection:secureConnectionDesc.title')
}

function renderHero (site) {
    site = site || {}

    return bel`${hero({
        status: `connection-${site.httpsState}`,
        title: i18n.t('connection:connection.title'),
        showClose: true
    })}`
}
