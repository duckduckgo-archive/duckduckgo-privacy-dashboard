const bel = require('bel')
const hero = require('./shared/hero.es6.js')
const i18n = window.DDG.base.i18n

function categories () {
    return [
        { category: i18n.t('report:videos.title'), value: 'videos' },
        { category: i18n.t('report:images.title'), value: 'images' },
        { category: i18n.t('report:comments.title'), value: 'comments' },
        { category: i18n.t('report:content.title'), value: 'content' },
        { category: i18n.t('report:links.title'), value: 'links' },
        { category: i18n.t('report:login.title'), value: 'login' },
        { category: i18n.t('report:paywall.title'), value: 'paywall' }
    ]
}

function shuffle (arr) {
    let len = arr.length
    let temp
    let index
    while (len > 0) {
        index = Math.floor(Math.random() * len)
        len--
        temp = arr[len]
        arr[len] = arr[index]
        arr[index] = temp
    }
    return arr
}

function renderHero () {
    return bel`${hero({
        status: 'breakage-form',
        title: i18n.t('report:reportBrokenSite.title'),
        showClose: true,
        className: 'js-breakage-form-close'
    })}`
}

module.exports = function () {
    return bel`<div class="breakage-form js-breakage-form">
        ${renderHero()}
        <div class="breakage-form__content">
            <div class="breakage-form__element js-breakage-form-element">
                <div class="breakage-form__explanation">
                    ${i18n.t('report:selectTheOptionDesc.title')}
                </div>
                <div class="form__group">
                    <div class="form__select breakage-form__input--dropdown">
                        <select class="js-breakage-form-dropdown">
                            <option value=''>${i18n.t('report:pickYourIssueFromTheList.title')}</option>
                            ${shuffle(categories()).map(function (item) { return bel`<option value=${item.value}>${item.category}</option>` })}
                            <option value='Other'>${i18n.t('report:other.title')}</option>
                        </select>
                    </div>
                    <textarea class="form__textarea js-breakage-form-description" placeholder="${i18n.t('report:tellUsMoreDesc.title')}"></textarea>
                    <button class="form__submit js-breakage-form-submit" role="button">${i18n.t('report:sendReport.title')}</button>
                </div>
                <div class="breakage-form__footer">
                    ${i18n.t('report:reportsAreAnonymousDesc.title')}
                </div>
            </div>
            <div class="breakage-form__message js-breakage-form-message is-transparent">
                <h2 class="breakage-form__success--title">${i18n.t('report:thankYou.title')}</h2>
                <div class="breakage-form__success--message">${i18n.t('report:yourReportWillHelpDesc.title')}</div>
            </div>
        </div>
    </div>`
}
