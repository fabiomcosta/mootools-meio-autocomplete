/*
---

description: A plugin for enabling autocomplete of a text input or textarea.

authors:
 - Fábio Miranda Costa

requires:
 - Meio.Autocomplete

license: MIT-style license

provides: [Meio.Autocomplete.Data]

...
*/


Meio.Autocomplete.Data = new Class({

    Implements: [Options, Events],

    initialize: function(data, cache) {
        this._cache = cache;
        this.data = data;
        this.dataString = JSON.encode(this.data);
    },

    get: function() {
        return this.data;
    },

    getKey: function() {
        return this.cachedKey;
    },

    prepare: function(text) {
        this.cachedKey = this.dataString + (text || '');
        this.fireEvent('ready');
    },

    cache: function(key, data) {
        this._cache.set(key, data);
    },

    refreshKey: function() {}

});
