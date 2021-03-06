const Parent = window.DDG.base.View
const TrackerNetworksView = require('./../views/tracker-networks.es6.js')
const BreakageFormView = require('./../views/breakage-form.es6.js')
const pageConnectionTemplate = require('./../templates/page-connection.es6.js')
const trackerNetworksTemplate = require('./../templates/tracker-networks.es6.js')
const breakageFormTemplate = require('./../templates/breakage-form.es6.js')

function Site (ops) {
    this.model = ops.model
    this.pageView = ops.pageView
    this.template = ops.template

    // cache 'body' selector
    this.$body = window.$('body')

    // get data from background process, then re-render template with it
    this.model.getBackgroundTabData().then(() => {
        if (this.model.tab &&
                (this.model.tab.status === 'complete' || this.model.domain === 'new tab')) {
            // render template for the first time here
            Parent.call(this, ops)
            this._setup()
        } else {
            // the timeout helps buffer the re-render cycle during heavy
            // page loads with lots of trackers
            Parent.call(this, ops)
            setTimeout(() => this.rerender(), 750)
        }
    })
}

Site.prototype = window.$.extend({},
    Parent.prototype,
    {
        _onWhitelistClick: function (e) {
            if (this.$body.hasClass('is-disabled')) return

            this.model.toggleWhitelist()
        },

        _changePermission: function (e) {
            this.model.updatePermission(e.target.name, e.target.value)
        },

        // NOTE: after ._setup() is called this view listens for changes to
        // site model and re-renders every time model properties change
        _setup: function () {
            this._cacheElems('.js-site', [
                'toggle',
                'protection',
                'show-page-connection',
                'show-page-trackers',
                'report-broken',
                'permission'
            ])

            this.bindEvents([
                [this.$toggle, 'click', this._onWhitelistClick],
                [this.$showpageconnection, 'click', this._showPageConnection],
                [this.$showpagetrackers, 'click', this._showPageTrackers],
                [this.$reportbroken, 'click', this._onReportBrokenSiteClick],
                [this.$permission, 'change', this._changePermission],
                [this.store.subscribe, 'change:site', this.rerender]
            ])
        },

        rerender: function () {
            // Prevent rerenders when confirmation form is active,
            // otherwise form will disappear on rerender.
            if (this.$body.hasClass('confirmation-active')) return

            if (this.model && this.model.disabled) {
                if (!this.$body.hasClass('is-disabled')) {
                    this.$body.addClass('is-disabled')
                    this._rerender()
                    this._setup()
                }
            } else {
                this.$body.removeClass('is-disabled')
                this.unbindEvents()
                this._rerender()
                this._setup()
            }
        },

        _onReportBrokenSiteClick: function (e) {
            e.preventDefault()

            if (this.model && this.model.disabled) {
                return
            }

            this.showBreakageForm('reportBrokenSite')
        },

        // pass clickSource to specify whether page should reload
        // after submitting breakage form.
        showBreakageForm: function (clickSource) {
            this.views.breakageForm = new BreakageFormView({
                siteView: this,
                template: breakageFormTemplate,
                model: this.model,
                appendTo: this.$body,
                clickSource: clickSource
            })
        },

        _showPageTrackers: function (e) {
            if (this.$body.hasClass('is-disabled')) return
            this.views.slidingSubview = new TrackerNetworksView({
                template: trackerNetworksTemplate
            })
        },

        _showPageConnection: function (e) {
            if (this.$body.hasClass('is-disabled')) return
            this.views.slidingSubview = new TrackerNetworksView({
                template: pageConnectionTemplate
            })
        }
    }
)

module.exports = Site
