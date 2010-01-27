/*
---

description: An event that will fire when a text input has changed.

authors:
 - Fábio Miranda Costa

requires:
 - core/1.2.4: [Element.Event]

license: MIT-style license

provides: [Event.Changed]

...
*/

/**
 * @author Fábio Miranda Costa <fabiomcosta [at] gmail [dot] com>
 * 09-07-2009
 * http://www.meiocodigo.com
 * Changed Event for Mootools 1.2.x
 */

(function(){

	var $ = document.id || $;
	var STORAGE_VALUE = 'changed-event-value-storage';
	var lastFocused = null;
	var focusFunc = function(){
		lastFocused = this;
		this.store(STORAGE_VALUE, this.get('value'));
	};
	var submitFunc = function(e){
		if(check.call(lastFocused)){
			lastFocused.fireEvent('changed');
		}
	};
	var check = function(e){
		var storedValue = this.retrieve(STORAGE_VALUE);
		// this happens when you focus the input before adding the changed event on the input
		if(storedValue === null) return false;
		return this.value !== storedValue;
	};

	Element.Events.changed = {
		base: 'blur',
		onAdd: function(){
			var evts = this.retrieve('events');
			if(!(evts && evts.focus && evts.focus.keys.contains(focusFunc))){
				this.addEvent('focus', focusFunc);
				var formEl = $(this.form), fevts = formEl.retrieve('events');
				if(!(fevts && fevts.submit && fevts.submit.keys.contains(submitFunc))){
					formEl.addEvent('submit', submitFunc);
				}
			}
		},
		condition: function(e){
			e.type = 'changed';
			return check.call(this, e);
		},
		onRemove: function(){
			var evts = this.retrieve('events');
			if(!evts.changed.keys.length){
				this.removeEvent('focus', focusFunc);
				if(lastFocused == this) lastFocused = null;
				if(!submitInputs.length){
					$(this.form).removeEvent('submit', submitFunc);
				}
			}
		}
	};

})();
