/*
---

description: A plugin for enabling autocomplete of a text input or textarea.

authors:
 - Fábio Miranda Costa

requires:
 - Meio.Base

license: MIT-style license

provides: [Meio.Widget]

...
*/

Meio.Widget = new Class({

    initialize: function() {
        this.elements = {};
    },

    addElement: function(name, obj) {
        this.elements[name] = obj;
    },

    addEventToElement: function(name, eventName, event) {
        this.elements[name].addEvent(eventName, event.bind(this));
    },

    addEventsToElement: function(name, events) {
        for (var eventName in events) {
            this.addEventToElement(name, eventName, events[eventName]);
        }
    },

    attach: function() {
        for (var element in this.elements) {
            this.elements[element].attach();
        }
    },

    detach: function() {
        for (var element in this.elements) {
            this.elements[element].detach();
        }
    },

    destroy: function() {
        for (var element in this.elements) {
            if (this.elements[element]) {
                this.elements[element].destroy();
            }
        }
    }
});
