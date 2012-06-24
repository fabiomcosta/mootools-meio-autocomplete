/*
---

description: A plugin for enabling autocomplete of a text input or textarea.

authors:
 - Fábio Miranda Costa

requires:
 - Meio.Base

license: MIT-style license

provides: [Meio.Element]

...
*/

(function(global, $) {

    global.Meio.Element = new Class({

        Implements: [Events],

        initialize: function(node) {
            this.setNode(node);
            this.createBoundEvents();
            this.attach();
        },

        setNode: function(node) {
            this.node = node ? $(node) || $$(node)[0] : this.render();
        },

        createBoundEvents: function() {
            this.bound = {};
            this.boundEvents.each(function(evt) {
                this.bound[evt] = function(e) {
                    this.fireEvent('before' + evt.capitalize(), e);
                    if (this[evt]) this[evt](e);
                    this.fireEvent(evt, e);
                    return true;
                }.bind(this);
            }, this);
        },

        attach: function() {
            for (var e in this.bound) {
                this.node.addEvent(e, this.bound[e]);
            }
        },

        detach: function() {
            for (var e in this.bound) {
                this.node.removeEvent(e, this.bound[e]);
            }
        },

        addClass: function(type) {
            this.node.addClass(this.options.classes[type]);
        },

        removeClass: function(type) {
            this.node.removeClass(this.options.classes[type]);
        },

        toElement: function() {
            return this.node;
        },

        render: function() {}

    });

}(this, document.id || this.$));
