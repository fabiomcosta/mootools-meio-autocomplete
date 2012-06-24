/*
---

description: A plugin for enabling autocomplete of a text input or textarea.

authors:
 - Fábio Miranda Costa

requires:
 - Core/Class.Extras
 - Core/Element.Event
 - Core/Element.Style
 - More/Element.Forms

license: MIT-style license

provides: [Meio]

...
*/

(function(global, $) {

    var browser = Browser; // better compression and faster

    // Custom Events

    // thanks Jan Kassens
    Object.append(Element.NativeEvents, {
        'paste': 2, 'input': 2
    });
    Element.Events.paste = {
        base : (browser.opera || (browser.firefox && browser.version < 3)) ? 'input' : 'paste',
        condition: function(e) {
            this.fireEvent('paste', e, 1);
            return false;
        }
    };

    // the key event that repeats
    Element.Events.keyrepeat = {
        base : (browser.firefox || browser.opera) ? 'keypress' : 'keydown',
        condition: Function.from(true)
    };

    // Meio namespace

    global.Meio = global.Meio || {};

}(this, document.id || this.$));
