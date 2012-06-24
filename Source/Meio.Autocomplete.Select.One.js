/*
---

description: Transforms a select on an autocomplete field.

authors:
 - Fábio Miranda Costa

requires:
 - Meio.Autocomplete.Select

license: MIT-style license

provides: [Meio.Autocomplete.Select.One]

...
*/


(function(global, $) {

    Meio.Autocomplete.Select.One = new Class({

        Extends: Meio.Autocomplete.Select,

        options: {
            filter: {
                path: 'text' // path to the text value on each object thats contained on the data array
            }
        },

        //overwritten
        initialize: function(select, options, listInstance) {
            this.select = $(select);
            this.replaceSelect();
            this.parent(this.field, this.createDataArray(), Object.merge(options || {}, {
                valueField: this.select,
                valueFilter: function(data) {
                    return data.value;
                }
            }), listInstance);
        },

        replaceSelect: function() {
            var selectedOption = this.select.getSelected()[0];
            this.field = new Element('input', {type: 'text'});
            var optionValue = selectedOption.get('value');
            if (optionValue || optionValue === 0) {
                this.field.set('value', selectedOption.get('html'));
            }
            this.select.setStyle('display', 'none');
            this.field.inject(this.select, 'after');
        },

        createDataArray: function() {
            var selectOptions = this.select.options, data = [];
            for (var i = 0, selectOption, optionValue; selectOption = selectOptions[i++];) {
                optionValue = selectOption.value;
                if (optionValue || optionValue === 0) data.push({value: optionValue, text: selectOption.innerHTML});
            }
            return data;
        },

        addValueFieldEvents: function() {
            this.addEvents({
                'select': function(elements, data, text, index) {
                    var option = this.valueField.getElement('option[value="' + this.options.valueFilter.call(this, data) + '"]');
                    if (option) option.selected = true;
                },
                'deselect': function(elements) {
                    var option = this.valueField.getSelected()[0];
                    if (option) option.selected = false;
                }
            });
        },

        getValueFromValueField: function() {
            return this.valueField.getSelected()[0].get('value');
        }

    });

}(this, document.id || this.$));
