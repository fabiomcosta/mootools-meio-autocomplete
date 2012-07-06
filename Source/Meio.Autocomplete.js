/*
---

description: A plugin for enabling autocomplete of a text input or textarea.

authors:
 - Fábio Miranda Costa

requires:
 - Meio.Widget
 - Meio.Element.List
 - Meio.Element.Field

license: MIT-style license

provides: [Meio.Autocomplete]

...
*/

(function(global, $) {

    var Meio = global.Meio;

    var keysThatDontChangeValueOnKeyUp = {
        9:   1,  // tab
        16:  1,  // shift
        17:  1,  // control
        18:  1,  // alt
        224: 1,  // command (meta onkeypress)
        91:  1,  // command (meta onkeydown)
        37:  1,  // left
        38:  1,  // up
        39:  1,  // right
        40:  1   // down
    };

    var encode = function(str) {
        return str.replace(/"/g, '&quot;').replace(/'/g, '&#39;');
    };

    Meio.Autocomplete = new Class({

        Extends: Meio.Widget,

        Implements: [Options, Events],

        options: {

            delay: 200,
            minChars: 0,
            cacheLength: 20,
            selectOnTab: true,
            maxVisibleItems: 10,
            cacheType: 'shared', // 'shared' or 'own'

            filter: {
                /*
                    its posible to pass the filters directly or by passing a type and optionaly a path.

                    filter: function(text, data) {}
                    formatMatch: function(text, data, i) {}
                    formatItem: function(text, data) {}

                    or

                    type: 'startswith' or 'contains' // can be any defined on the Meio.Autocomplete.Filter object
                    path: 'a.b.c' // path to the text value on each object thats contained on the data array
                */
            },

            /*
            onNoItemToList: function(elements) {},
            onSelect: function(elements, value) {},
            onDeselect: function(elements) {},
            */

            fieldOptions: {}, // see Element options
            listOptions: {}, // see List options
            requestOptions: {}, // see DataRequest options
            urlOptions: {} // see URL options

        },

        initialize: function(input, data, options, listInstance) {
            this.parent();
            this.setOptions(options);
            this.active = 0;

            this.filters = Meio.Autocomplete.Filter.get(this.options.filter);

            this.addElement('list', listInstance || new Meio.Element.List(this.options.listOptions));
            this.addListEvents();

            this.addElement('field', new Meio.Element.Field(input, this.options.fieldOptions));
            this.addFieldEvents();

            this.addSelectEvents();

            this.attach();
            this.initCache();
            this.initData(data);
        },

        addFieldEvents: function() {
            this.addEventsToElement('field', {
                'beforeKeyrepeat': function(e) {
                    this.active = 1;
                    var e_key = e.key, list = this.elements.list;
                    if (e_key == 'up' || e_key == 'down' || (e_key == 'enter' && list.showing)) e.preventDefault();
                },
                'delayedKeyrepeat': function(e) {
                    var e_key = e.key, field = this.elements.field;
                    field.keyPressControl[e_key] = true;
                    switch (e_key) {
                    case 'up': case 'down':
                        this.focusItem(e_key);
                        break;
                    case 'enter':
                        this.setInputValue();
                        break;
                    case 'tab':
                        if (this.options.selectOnTab) this.setInputValue();
                        field.keyPressControl[e_key] = false; // tab blurs the input so the keyup event wont happen at the same input you made a keydown
                        break;
                    case 'esc':
                        this.elements.list.hide();
                        break;
                    default:
                        this.setupList();
                    }
                    this.oldInputedText = field.node.get('value');
                },
                'keyup': function(e) {
                    var field = this.elements.field;
                    if (!keysThatDontChangeValueOnKeyUp[e.code]) {
                        if (!field.keyPressControl[e.key]) this.setupList();
                        field.keyPressControl[e.key] = false;
                    }
                },
                'focus': function() {
                    this.active = 1;
                    var list = this.elements.list;
                    list.focusedItem = null;
                    list.positionNextTo(this.elements.field.node);
                },
                'click': function() {
                    if (++this.active > 2 && !this.elements.list.showing) {
                        this.forceSetupList();
                    }
                },
                'blur': function(e) {
                    this.active = 0;
                    var list = this.elements.list;
                    if (list.shouldNotBlur) {
                        this.elements.field.node.setCaretPosition('end');
                        list.shouldNotBlur = false;
                        if (list.focusedItem) list.hide();
                    } else {
                        list.hide();
                    }
                },
                'paste': function() {
                    return this.setupList();
                }
            });
        },

        addListEvents: function() {
            this.addEventsToElement('list', {
                'mousedown': function(e) {
                    if (this.active && !e.dontHide) this.setInputValue();
                }
            });
        },

        update: function() {
            var data = this.data, list = this.elements.list;
            var cacheKey = data.getKey(), cached = this.cache.get(cacheKey), html;
            if (cached) {
                html = cached.html;
                this.itemsData = cached.data;
            } else {
                data = data.get();
                var itemsHtml = [], itemsData = [], classes = list.options.classes, text = this.inputedText;
                var filter = this.filters.filter, formatMatch = this.filters.formatMatch, formatItem = this.filters.formatItem;
                for (var row, i = 0, n = 0; row = data[i++];) if (filter.call(this, text, row)) {
                    itemsHtml.push(
                        '<li title="', encode(formatMatch.call(this, text, row)),
                        '" data-index="', n,
                        '" class="', (n%2 ? classes.even : classes.odd), '">',
                        formatItem.call(this, text, row, n),
                        '</li>'
                    );
                    itemsData.push(row);
                    n++;
                }
                html = itemsHtml.join('');
                this.cache.set(cacheKey, {html: html, data: itemsData});
                this.itemsData = itemsData;
            }
            list.focusedItem = null;
            this.fireEvent('deselect', [this.elements]);
            list.list.set('html', html);
            if (this.options.maxVisibleItems) list.applyMaxHeight(this.options.maxVisibleItems);
        },

        setupList: function() {
            this.inputedText = this.elements.field.node.get('value');
            if (this.inputedText !== this.oldInputedText) {
                this.forceSetupList(this.inputedText);
            } else {
                this.elements.list.hide();
            }
            return true;
        },

        forceSetupList: function(inputedText) {
            inputedText = inputedText || this.elements.field.node.get('value');
            if (inputedText.length >= this.options.minChars) {
                clearInterval(this.prepareTimer);
                this.prepareTimer = this.data.prepare.delay(this.options.delay, this.data, this.inputedText);
            }
        },

        dataReady: function() {
            this.update();
            if (this.onUpdate) {
                this.onUpdate();
                this.onUpdate = null;
            }
            var list = this.elements.list;
            if (list.list.get('html')) {
                if (this.active) list.show();
            } else {
                this.fireEvent('noItemToList', [this.elements]);
                list.hide();
            }
        },

        setInputValue: function() {
            var list = this.elements.list;
            if (list.focusedItem) {
                var text = list.focusedItem.get('title');
                this.elements.field.node.set('value', text);
                var index = list.focusedItem.get('data-index');
                this.fireEvent('select', [this.elements, this.itemsData[index], text, index]);
            }
            list.hide();
        },

        focusItem: function(direction) {
            var list = this.elements.list;
            if (list.showing) {
                list.focusItem(direction);
            } else {
                this.forceSetupList();
                this.onUpdate = function() { list.focusItem(direction); };
            }
        },

        addSelectEvents: function() {
            this.addEvents({
                select: function(elements) {
                    elements.field.addClass('selected');
                },
                deselect: function(elements) {
                    elements.field.removeClass('selected');
                }
            });
        },

        initData: function(data) {
            this.data = (typeOf(data) == 'string') ?
                new Meio.Autocomplete.Data.Request(data, this.cache, this.elements.field, this.options.requestOptions, this.options.urlOptions) :
                (typeOf(data) == 'function') ? new Meio.Autocomplete.Data.Source(data, this.cache, this.elements.field) :
                new Meio.Autocomplete.Data(data, this.cache);
            this.data.addEvent('ready', this.dataReady.bind(this));
        },

        initCache: function() {
            var cacheLength = this.options.cacheLength;
            if (this.options.cacheType == 'shared') {
                this.cache = Meio.Autocomplete.Cache.instance;
                this.cache.setMaxLength(cacheLength);
            } else { // 'own'
                this.cache = new Meio.Autocomplete.Cache(cacheLength);
            }
        },

        refreshCache: function(cacheLength) {
            this.cache.refresh();
            this.cache.setMaxLength(cacheLength || this.options.cacheLength);
        },

        refreshAll: function(cacheLength, urlOptions) {
            // TODO, do you really need to refresh the url? see a better way of doing this
            this.refreshCache(cacheLength);
            this.data.refreshKey(urlOptions);
        }

    });

}(this, document.id || this.$));
