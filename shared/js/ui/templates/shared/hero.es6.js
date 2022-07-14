const bel = require('bel')

module.exports = function (ops) {
    const slidingSubviewClass = ops.showClose ? 'js-sliding-subview-close' : ''
    return bel`
        <div>
            <div class="hero text--center border--bottom ${slidingSubviewClass} ${ops.className || ''}">
                ${renderOpenOrCloseButton(ops.showClose)}
                <h1 class="hero__title">${ops.title}</h1>
            </div>
            <div class="hero__icon hero__icon--${ops.status}"></div>
        </div>
    `
}

function renderOpenOrCloseButton (isCloseButton) {
    const openOrClose = isCloseButton ? 'close' : 'open'
    const arrowIconClass = isCloseButton ? 'icon__back-arrow' : ''
    return bel`
        <a href="javascript:void(0)"
            class="hero__${openOrClose}"
            role="button"
            aria-label="${isCloseButton ? 'Go back' : 'More details'}"
        >
            <span class="icon ${arrowIconClass}"></span>
        </a>
    `
}
