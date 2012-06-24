/*
---

description: A plugin for enabling autocomplete of a text input or textarea.

authors:
 - Fábio Miranda Costa

requires:
 - Meio.Element

license: MIT-style license

provides: [Meio.Element.Field]

...
*/

(function(global, $) {

    global.Meio.Element.Field = new Class({

        Extends: global.Meio.Element,

        Implements: [Options],

        options: {
            classes: {
                loading: 'ma-loading',
                selected: 'ma-selected'
            }
        },

        initialize: function(field, options) {
            this.keyPressControl = {};
            this.boundEvents = ['paste', 'focus', 'blur', 'click', 'keyup', 'keyrepeat'];
            if (Browser.ie6) this.boundEvents.push('keypress'); // yeah super ugly, but what can be awesome with ie?
            this.setOptions(options);
            this.parent(field);

            $(global).addEvent('unload', function() {
                // if autocomplete is off when you reload the page the input value gets erased
                if (this.node) this.node.set('autocomplete', 'on'); 
            }.bind(this));
        },

        setNode: function(element) {
            this.parent(element);
            this.node.set('autocomplete', 'off');
        },

        // this let me get the value of the input on keydown and keypress
        keyrepeat: function(e) {
            clearInterval(this.keyrepeatTimer);
            this.keyrepeatTimer = this._keyrepeat.delay(1, this, e);
        },

        _keyrepeat: function(e) {
            this.fireEvent('delayedKeyrepeat', e);
        },

        destroy: function() {
            this.detach();
            this.node.removeAttribute('autocomplete');
        },

        // ie6 only, uglyness
        // this fix the form being submited on the press of the enter key
        keypress: function(e) {
            if (e.key == 'enter') this.bound.keyrepeat(e);
        }

    });

}(this, document.id || this.$));
