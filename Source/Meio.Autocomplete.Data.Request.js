/*
---

description: A plugin for enabling autocomplete of a text input or textarea.

authors:
 - Fábio Miranda Costa

requires:
 - Meio.Autocomplete.Data

license: MIT-style license

provides: [Meio.Autocomplete.Data.Request]

...
*/

Meio.Autocomplete.Data.Request = new Class({

    Extends: Meio.Autocomplete.Data,

    options: {
        noCache: true,
        formatResponse: function(jsonResponse) {
            return jsonResponse;
        },
        link: 'cancel'
    },

    initialize: function(url, cache, element, options, urlOptions) {
        this.setOptions(options);
        this.rawUrl = url;
        this._cache = cache;
        this.element = element;
        this.urlOptions = urlOptions;
        this.refreshKey();
        this.createRequest();
    },

    prepare: function(text) {
        this.cachedKey = this.url.evaluate(text);
        if (this._cache.has(this.cachedKey)) {
            this.fireEvent('ready');
        } else {
            this.request.send({url: this.cachedKey});
        }
    },

    createRequest: function() {
        var self = this;
        this.request = new Request.JSON(this.options);
        this.request.addEvents({
            request: function() {
                self.element.addClass('loading');
            },
            complete: function() {
                self.element.removeClass('loading');
            },
            success: function(jsonResponse) {
                self.data = self.options.formatResponse(jsonResponse);
                self.fireEvent('ready');
            }
        });
    },

    refreshKey: function(urlOptions) {
        urlOptions = Object.merge(this.urlOptions, {url: this.rawUrl}, urlOptions || {});
        this.url = new Meio.Autocomplete.Data.Request.URL(urlOptions.url, urlOptions);
    }

});
