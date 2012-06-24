/*
---

description: A plugin for enabling autocomplete of a text input or textarea.

authors:
 - Fábio Miranda Costa

requires:
 - Meio.Autocomplete.Data.Request

license: MIT-style license

provides: [Meio.Autocomplete.Data.Request.URL]

...
*/


Meio.Autocomplete.Data.Request.URL = new Class({

    Implements: [Options],

    options: {
        queryVarName: 'q',
        extraParams: null,
        max: 20
    },

    initialize: function(url, options) {
        this.setOptions(options);
        this.rawUrl = url;
        this.url = url;
        this.url += this.url.contains('?') ? '&' : '?';
        this.dynamicExtraParams = [];
        var params = Array.from(this.options.extraParams);
        for (var i = params.length; i--;) {
            this.addParameter(params[i]);
        }
        if (this.options.max) this.addParameter('limit=' + this.options.max);
    },

    evaluate: function(text) {
        text = text || '';
        var params = this.dynamicExtraParams, url = [];
        url.push(this.options.queryVarName + '=' + encodeURIComponent(text));
        for (var i = params.length; i--;) {
            url.push(encodeURIComponent(params[i].name) + '=' + encodeURIComponent(Function.from(params[i].value)()));
        }
        return this.url + url.join('&');
    },

    addParameter: function(param) {
        if (param.nodeType == 1 || typeOf(param.value) == 'function') {
            this.dynamicExtraParams.push(param);
        } else {
            this.url += ((typeOf(param) == 'string') ? param : encodeURIComponent(param.name) + '=' + encodeURIComponent(param.value)) + '&';
        }
    },

    // TODO remove non dynamic parameters
    removeParameter: function(param) {
        this.dynamicExtraParams.erase(param);
    }

});
