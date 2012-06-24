/*
---

description: A plugin for enabling autocomplete of a text input or textarea.

authors:
 - Fábio Miranda Costa

requires:
 - Meio.Base

license: MIT-style license

provides: [Meio.Autocomplete.Cache]

...
*/


(function(global) {

    global.Meio.Autocomplete = global.Meio.Autocomplete || {};

    global.Meio.Autocomplete.Cache = new Class({

        initialize: function(maxLength) {
            this.refresh();
            this.setMaxLength(maxLength);
        },

        set: function(key, value) {
            if (!this.cache[key]) {
                if (this.getLength() >= this.maxLength) {
                    var keyToRemove = this.pos.shift();
                    this.cache[keyToRemove] = null;
                    delete this.cache[keyToRemove];
                }
                this.cache[key] = value;
                this.pos.push(key);
            }
            return this;
        },

        get: function(key) {
            return this.cache[key || ''] || null;
        },

        has: function(key) {
            return !!this.get(key);
        },

        getLength: function() {
            return this.pos.length;
        },

        refresh: function() {
            this.cache = {};
            this.pos = [];
        },

        setMaxLength: function(maxLength) {
            this.maxLength = Math.max(maxLength, 1);
        }

    });

    global.Meio.Autocomplete.Cache.instance = new Meio.Autocomplete.Cache();

}(this));


