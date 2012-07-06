/*
---

description: A plugin for enabling autocomplete of a text input or textarea.

authors:
 - Fábio Miranda Costa

requires:
 - Meio.Autocomplete.Data

license: MIT-style license

provides: [Meio.Autocomplete.Data.Source]

...
*/

Meio.Autocomplete.Data.Source = new Class({

    Extends: Meio.Autocomplete.Data,

    initialize: function(source, cache, element) {
        this.source = source;
        this._cache = cache;
        this.element = element;
    },

    prepare: function(text) {
        this.element.addClass('loading');
        this.source(text, this.done.bind(this));
    },

    done: function(data) {
        this.data = data;
        this.element.removeClass('loading');
        this.fireEvent('ready');
    }

});

