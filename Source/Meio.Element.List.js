/*
---

description: A plugin for enabling autocomplete of a text input or textarea.

authors:
 - Fábio Miranda Costa

requires:
 - Meio.Element

license: MIT-style license

provides: [Meio.Element.List]

...
*/

(function(global, $) {

    global.Meio.Element.List = new Class({

        Extends: global.Meio.Element,

        Implements: [Options],

        options: {
            width: 'field', // you can pass any other value settable by set('width') to the list container
            container: 'body',
            classes: {
                container: 'ma-container',
                hover: 'ma-hover',
                odd: 'ma-odd',
                even: 'ma-even'
            }
        },

        initialize: function(options) {
            this.boundEvents = ['mousedown', 'mouseover'];
            this.setOptions(options);
            this.parent();
            this.focusedItem = null;
        },

        applyMaxHeight: function(maxVisibleItems) {
            var listChildren = this.list.childNodes;
            var node = listChildren[maxVisibleItems - 1] || (listChildren.length ? listChildren[listChildren.length - 1] : null);
            if (!node) return;
            node = $(node);
            // uggly hack to fix the height of the autocomplete list
            for (var i = 2; i--;) this.node.setStyle('height', node.getCoordinates(this.list).bottom);
        },

        mouseover: function(e) {
            var item = this.getItemFromEvent(e), hoverClass = this.options.classes.hover;
            if (!item) return true;
            if (this.focusedItem) this.focusedItem.removeClass(hoverClass);
            item.addClass(hoverClass);
            this.focusedItem = item;
            this.fireEvent('focusItem', [this.focusedItem]);
        },

        mousedown: function(e) {
            e.preventDefault();
            this.shouldNotBlur = true;
            if (!(this.focusedItem = this.getItemFromEvent(e))) {
                e.dontHide = true;
                return true;
            }
            this.focusedItem.removeClass(this.options.classes.hover);
        },

        focusItem: function(direction) {
            var hoverClass = this.options.classes.hover, newFocusedItem;
            if (this.focusedItem) {
                if ((newFocusedItem = this.focusedItem[direction == 'up' ? 'getPrevious' : 'getNext']())) {
                    this.focusedItem.removeClass(hoverClass);
                    newFocusedItem.addClass(hoverClass);
                    this.focusedItem = newFocusedItem;
                    this.scrollFocusedItem(direction);
                }
            } else {
                if ((newFocusedItem = this.list.getFirst())) {
                    newFocusedItem.addClass(hoverClass);
                    this.focusedItem = newFocusedItem;
                }
            }
        },

        scrollFocusedItem: function(direction) {
            var focusedItemCoordinates = this.focusedItem.getCoordinates(this.list),
                scrollTop = this.node.scrollTop;
            if (direction == 'down') {
                var delta = focusedItemCoordinates.bottom - this.node.getStyle('height').toInt();
                if ((delta - scrollTop) > 0) {
                    this.node.scrollTop = delta;
                }
            } else {
                var top = focusedItemCoordinates.top;
                if (scrollTop && scrollTop > top) {
                    this.node.scrollTop = top;
                }
            }
        },

        getItemFromEvent: function(e) {
            var target = e.target;
            while (target && target.tagName.toLowerCase() != 'li') {
                if (target === this.node) return null;
                target = target.parentNode;
            }
            return $(target);
        },

        render: function() {
            var node = new Element('div', {'class': this.options.classes.container});
            if (node.bgiframe) node.bgiframe({top: 0, left: 0});
            this.list = new Element('ul').inject(node);
            $$(this.options.container)[0].grab(node);
            return node;
        },

        positionNextTo: function(fieldNode) {
            var width = this.options.width, listNode = this.node;
            var elPosition = fieldNode.getCoordinates();
            listNode.setStyle('width', width == 'field' ? fieldNode.getWidth().toInt() - listNode.getStyle('border-left-width').toInt() - listNode.getStyle('border-right-width').toInt() : width);
            listNode.setPosition({x: elPosition.left, y: elPosition.bottom});
        },

        show: function() {
            this.node.scrollTop = 0;
            this.node.setStyle('visibility', 'visible');
            this.showing = true;
        },

        hide: function() {
            this.showing = false;
            this.node.setStyle('visibility', 'hidden');
        }

    });

}(this, document.id || this.$));
