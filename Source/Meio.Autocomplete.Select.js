/*
---

description:
  This is the same autocomplete class but it acts like a normal select element.
  When you select an option from the autocomplete it will set the value of a given element (valueField)
  with the return of the valueFilter.
  if the syncAtInit option is set to true, it will synchonize the value of the autocomplete with the corresponding data
  from the valueField's value.
  to understand better see the user specs.

authors:
 - Fábio Miranda Costa

requires:
 - Meio.Autocomplete

license: MIT-style license

provides: [Meio.Autocomplete.Select]

...
*/

(function(global, $) {

    global.Meio.Autocomplete.Select = new Class({

        Extends: global.Meio.Autocomplete,

        options: {
            syncName: 'id', // if falsy it wont sync at start
            valueField: null,
            valueFilter: function(data) {
                return data.id;
            }
        },

        // overwritten
        initialize: function(input, data, options, listInstance) {
            this.parent(input, data, options, listInstance);
            this.valueField = $(this.options.valueField);

            if (!this.valueField) return;

            this.syncWithValueField(data);
        },

        syncWithValueField: function(data) {
            var value = this.getValueFromValueField();

            if (value && this.options.syncName) {
                this.addParameter(data);
                this.addDataReadyEvent(value);
                this.data.prepare(this.elements.field.node.get('value'));
            } else {
                this.addValueFieldEvents();
            }
        },

        addValueFieldEvents: function() {
            this.addEvents({
                'select': function(elements, data) {
                    this.valueField.set('value', this.options.valueFilter.call(this, data));
                },
                'deselect': function(elements) {
                    this.valueField.set('value', '');
                }
            });
        },

        addParameter: function(data) {
            this.parameter = {
                name: this.options.syncName,
                value: function() {
                    return this.valueField.value;
                }.bind(this)
            };
            if (this.data.url) this.data.url.addParameter(this.parameter);
        },

        addDataReadyEvent: function(value) {
            var self = this;
            var runOnce = function() {
                self.addValueFieldEvents();
                var values = this.get();
                for (var i = values.length; i--;) {
                    if (self.options.valueFilter.call(self, values[i]) == value) {
                        var text = self.filters.formatMatch.call(self, '', values[i], 0);
                        self.elements.field.node.set('value', text);
                        self.fireEvent('select', [self.elements, values[i], text, i]);
                        break;
                    }
                }
                if (this.url) this.url.removeParameter(self.parameter);
                this.removeEvent('ready', runOnce);
            };
            this.data.addEvent('ready', runOnce);
        },

        getValueFromValueField: function() {
            return this.valueField.get('value');
        }

    });

}(this, document.id || this.$));
