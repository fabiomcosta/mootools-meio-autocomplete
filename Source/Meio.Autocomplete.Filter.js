/*
---

description: A plugin for enabling autocomplete of a text input or textarea.

authors:
 - Fábio Miranda Costa

requires:
 - Meio.Autocomplete

license: MIT-style license

provides: [Meio.Autocomplete.Filter]

...
*/

Meio.Autocomplete.Filter = {

    filters: {},

    get: function(options) {
        var type = options.type, keys = (options.path || '').split('.');
        var filters = (type && this.filters[type]) ? this.filters[type](this, keys) : options;
        return Object.merge(this.defaults(keys), filters);
    },

    define: function(name, options) {
        this.filters[name] = options;
    },

    defaults: function(keys) {
        var self = this;
        return {
            filter: function(text, data) {
                return text ? self._getValueFromKeys(data, keys).test(new RegExp(text.escapeRegExp(), 'i')) : true;
            },
            formatMatch: function(text, data) {
                return self._getValueFromKeys(data, keys);
            },
            formatItem: function(text, data, i) {
                return text ? self._getValueFromKeys(data, keys).replace(new RegExp('(' + text.escapeRegExp() + ')', 'gi'), '<strong>$1</strong>') : self._getValueFromKeys(data, keys);
            }
        };
    },

    _getValueFromKeys: function(obj, keys) {
        var key, value = obj;
        for (var i = 0; key = keys[i++];) value = value[key];
        return value;
    }

};

Meio.Autocomplete.Filter.define('contains', function(self, keys) {return {};});
Meio.Autocomplete.Filter.define('startswith', function(self, keys) {
    return {
        filter: function(text, data) {
            return text ? self._getValueFromKeys(data, keys).test(new RegExp('^' + text.escapeRegExp(), 'i')) : true;
        }
    };
});


