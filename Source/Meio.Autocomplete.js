/*
---

description: A plugin for enabling autocomplete of a text input or textarea.

authors:
 - Fábio Miranda Costa

requires:
 - core/1.2.4: [Class.Extras, Element.Event, Element.Style]
 - Event.Changed

license: MIT-style license

provides: [Meio.Autocomplete]

...
*/

(function(global){

	var $ = global.document.id || global.$;
	var browserEngine = Browser.Engine; // better compression and faster
	
	/*if(typeof console == 'undefined'){
		var console = {};
		if(!console.log) console.log = function(text){
			$(document.body).grab(new Element('span', {'html': text + ' '}), 'bottom');
		}
	}*/

	// Custom Events
	
	// thanks Jan Kassens
	$extend(Element.NativeEvents, {
		'paste': 2, 'input': 2
	});
	Element.Events.paste = {
		base : (browserEngine.presto || (browserEngine.gecko && browserEngine.version < 19)) ? 'input' : 'paste',
		condition: function(e){
			this.fireEvent('paste', e, 1);
			return false;
		}
	};
	
	// the key event that repeats
	Element.Events.keyrepeat = {
		base : (browserEngine.gecko || browserEngine.presto) ? 'keypress' : 'keydown',
		condition: $lambda(true)
	};
	
	
	/* Port of bgiframe plugin for mootools
	 * Original plugin copyright:
	 * Copyright (c) 2006 Brandon Aaron (http://brandonaaron.net)
	 * Dual licensed under the MIT (http://www.opensource.org/licenses/mit-license.php) 
	 * and GPL (http://www.opensource.org/licenses/gpl-license.php) licenses.
	 * Version 2.1.1
	 */
	
	var BgIframe = new Class({
		Implements: Options,
		options: {
			top		: 'auto',
			left	: 'auto',
			width	: 'auto',
			height	: 'auto',
			opacity	: true,
			src		: 'javascript:false;'
		},
		initialize: function(element, options){
			if(!browserEngine.trident4) return;
			this.setOptions(options);
			this.element = $(element);
			var firstChild = this.element.getFirst();
			if(!(firstChild && firstChild.hasClass('bgiframe')))
				this.element.grab(document.createElement(this.render()), 'top');
		},
		toPx: function(n){ 
			return isFinite(n) ? n + 'px' : n;
		},
		render: function(){
			var options = this.options;
			return '<iframe class="bgiframe" frameborder="0" tabindex="-1" src="' + options.src + '" ' +
				'style="display:block;position:absolute;z-index:-1;' +
				(options.opacity !== false ? 'filter:alpha(opacity=\'0\');' : '') +
				'top:' + (options.top == 'auto' ? 'expression(((parseInt(this.parentNode.currentStyle.borderTopWidth)||0)*-1)+\'px\')' : this.toPx(options.top)) + ';' +
				'left:' + (options.left == 'auto' ? 'expression(((parseInt(this.parentNode.currentStyle.borderLeftWidth)||0)*-1)+\'px\')' : this.toPx(options.left)) + ';' +
				'width:' + (options.width == 'auto' ? 'expression(this.parentNode.offsetWidth+\'px\')' : this.toPx(options.width)) + ';' +
				'height:' + (options.height == 'auto' ? 'expression(this.parentNode.offsetHeight+\'px\')' : this.toPx(options.height)) + ';' +
			'"/>';
		}
	});
	
	Element.implement('bgiframe', function(options){
		if(browserEngine.trident4) new BgIframe(this, options);
		return this;
	});
	
	// Autocomplete itself

	var Meio = {};
	var globalCache;
	var listClasses = [];
	var listInstances = [];
	
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
	
	var encode = function(str){
		return str.replace(/"/g, '&quot;').replace(/'/g, '&#39;');
	};
	
	// Temporary thing
	// more on Docs/todo.txt

	Meio.Widget = new Class({
		
		initialize: function(){
			this.elements = {};
		},
		
		addElement: function(name, obj){
			this.elements[name] = obj;
		},
		
		addEventToElement: function(name, eventName, event){
			this.elements[name].addEvent(eventName, event.bindWithEvent(this));
		},
		
		addEventsToElement: function(name, events){
			for(eventName in events){
				this.addEventToElement(name, eventName, events[eventName]);
			};
		},
		
		attach: function(){
			for(element in this.elements){
				this.elements[element].attach();
			}
		},
		
		detach: function(){
			for(element in this.elements){
				this.elements[element].detach();
			}
		},
		
		destroy: function(){
			for(element in this.elements){
				this.elements[element] && this.elements[element].destroy();
			}
		}
	});
	
	Meio.Autocomplete = new Class({
		
		Extends: Meio.Widget,
		
		Implements: [Options, Events, Chain],
		
		options: {
			
			delay: 200,
			minChars: 0,
			cacheLength: 20,
			selectOnTab: true,
			maxVisibleItems: 10,
			cacheType: 'shared', // 'shared' or 'own'
			listClass: null,
			
			filter: 'contains',
			formatMatch: function(text, data){
				return data;
			},
			formatItem: function(text, data, i){
				return text ? data.replace(new RegExp('(' + text.escapeRegExp() + ')', 'g'), '<strong>$1</strong>') : data;
			},

			onSelect: function(elements){
				elements.field.addSelectedClass();
			},
			onDeselect: function(elements){
				elements.field.removeSelectedClass();
			},
			onNoItemToList: function(elements){
				elements.field.node.highlight('#ff0000');
			},
			
			elementOptions: {}, // see Element options
			listOptions: {}, // see List options
			requestOptions: {}, // see DataRequest options
			urlOptions: {} // see URL options
			
		},
		
		initialize: function(input, data, options){
			this.parent();
			this.setOptions(options);
			this.active = 0;
			
			var listClass = this.options.listClass || Meio.Element.List;
			var classIndex = listClasses.indexOf(listClass);
			var listInstance;
			if(classIndex < 0){
				listClasses.push(listClass);
				listInstances.push((listInstance = new listClass(this.options.listOptions)));
			}else{
				listInstance = listInstances[classIndex];
			}
			
			this.addElement('list', listInstance);
			this.addListEvents();
			
			this.addElement('field', new Meio.Element.Field(input, this.options.elementOptions));
			this.addFieldEvents();
			
			this.attach();
			this.initCache();
			this.initData(data);
		},
		
		addFieldEvents: function(){
			this.addEventsToElement('field', {
				'beforeKeyrepeat': function(e){
					this.active = 1;
					var e_key = e.key, list = this.elements.list;
					if(e_key == 'up' || e_key == 'down' || (e_key == 'enter' && list.showing)) e.preventDefault();
				},
				'delayedKeyrepeat': function(e){
					var e_key = e.key, field = this.elements.field;
					field.keyPressControl[e_key] = true;
					switch(e_key){
					case 'up': case 'down':
						this.focusItem(e_key);
						break;
					case 'enter':
						this.setInputValue();
						break;
					case 'tab':
						if(this.options.selectOnTab) this.setInputValue();
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
				'keyup': function(e){
					var field = this.elements.field;
					if(!keysThatDontChangeValueOnKeyUp[e.code]){
						if(!field.keyPressControl[e.key]){
							this.setupList();
						}
						field.keyPressControl[e.key] = false;
					}
				},
				'focus': function(){
					this.active = 1;
					var list = this.elements.list;
					list.focusedItem = null;
					list.positionNextTo(this.elements.field.node);
				},
				'click': function(){
					var list = this.elements.list;
					if(this.active++ > 1 && !list.showing){
						this.forceSetupList();
					}
				},
				'blur': function(e){
					this.active = 0;
					var list = this.elements.list;
					if(list.shouldNotBlur){
						this.elements.field.node.setCaretPosition('end');
						list.shouldNotBlur = false;
						if(list.focusedItem) list.hide();
					}else{
						list.hide();
					}
				},
				'paste': function(){
					return this.setupList();
				}
			});
		},
		
		addListEvents: function(){
			this.addEventsToElement('list', {
				'mousedown': function(e){
					if(this.active && !e.dontHide) this.setInputValue();
				}
			});
		},
		
		update: function(){
			var text = this.inputedText, data = this.data, options = this.options, list = this.elements.list;
			var filter = Meio.Autocomplete.Filters.get(options.filter), formatMatch = options.formatMatch, formatItem = options.formatItem; 
			var cacheKey = data.getKey(), cached = this.cache.get(cacheKey), html;
			if(cached){
				html = cached.html;
				this.itemsData = cached.data;
			}else{
				data = data.get();
				var itemsHtml = [], itemsData = [], classes = list.options.classes;
				for(var row, i = 0, n = 0, formattedMatch; row = data[i++];){
					if(filter.call(this, text, row)){
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
				}
				html = itemsHtml.join('');
				this.cache.set(cacheKey, {html: html, data: itemsData});
				this.itemsData = itemsData;
			}
			list.focusedItem = null;
			this.fireEvent('deselect', [this.elements]);
			list.list.set('html', html);
			if(this.options.maxVisibleItems) list.applyMaxHeight(this.options.maxVisibleItems);
		},
		
		setupList: function(){
			this.inputedText = this.elements.field.node.get('value');
			if(this.inputedText !== this.oldInputedText){
				this.forceSetupList(this.inputedText);
			}else{
				this.elements.list.hide();
			}
			return true;
		},
		
		forceSetupList: function(inputedText){
			inputedText = inputedText || this.elements.field.node.get('value');
			if(inputedText.length >= this.options.minChars){
				$clear(this.prepareTimer);
				this.prepareTimer = this.data.prepare.delay(this.options.delay, this.data, this.inputedText);
			}
		},
		
		dataReady: function(){
			this.update();
			if(this.onUpdate){
				this.onUpdate();
				this.onUpdate = null;
			}
			var list = this.elements.list;
			if(list.list.get('html')){
				if(this.active) list.show();
			}else{
				this.fireEvent('noItemToList', [this.elements]);
				list.hide();
			}
		},
		
		setInputValue: function(){
			var list = this.elements.list;
			if(list.focusedItem){
				var text = list.focusedItem.get('title');
				this.elements.field.node.set('value', text);
				this.fireEvent('select', [this.elements, this.itemsData[list.focusedItem.get('data-index')], text]);
			}
			list.hide();
		},
		
		focusItem: function(direction){
			var list = this.elements.list;
			if(list.showing){
				list.focusItem(direction);
			}else{
				this.forceSetupList();
				this.onUpdate = function(){ list.focusItem(direction); };
			}
		},
		
		initData: function(data){
			this.data = ($type(data) == 'string') ?
				new Meio.Autocomplete.Data.Request(data, this.cache, this.elements.field, this.options.requestOptions, this.options.urlOptions) :
				new Meio.Autocomplete.Data(data, this.cache);
			this.data.addEvent('ready', this.dataReady.bind(this));
		},
		
		initCache: function(){
			var cacheLength = this.options.cacheLength;
			if(this.options.cacheType == 'shared'){
				this.cache = globalCache;
				this.cache.setMaxLength(cacheLength);
			}else{ // 'own'
				this.cache = new Meio.Autocomplete.Cache(cacheLength);
			}
		},
		
		refreshCache: function(cacheLength){
			this.cache.refresh();
			this.cache.setMaxLength(cacheLength || this.options.cacheLength);
		},
		
		refreshAll: function(cacheLength, urlOptions){
			// TODO, do you really need to refresh the url? see a better way of doing this
			this.refreshCache(cacheLength);
			this.data.refreshKey(urlOptions);
		}

	});
	
	// This is the same autocomplete class but it acts like a normal select element.
	// When you select an option from the autocomplete it will set the value of a given element (valueField)
	// with the return of the valueFilter.
	// if the syncAtInit option is set to true, it will synchonize the value of the autocomplete with the corresponding data
	// from the valueField's value.
	// to understand better see the user specs.
	
	Meio.Autocomplete.Select = new Class({
		
		Extends: Meio.Autocomplete,
		
		options: {
			syncName: 'id', // if falsy it wont sync at start
			valueField: null,
			valueFilter: function(data){
				return data.id;
			}
		},
		
		// overwritten
		initialize: function(input, data, options){
			this.parent(input, data, options);
			if(this.options.syncName){
				this.syncWithValueField(data);
			}
			this.addEvent('select', function(elements, data){
				this.options.valueField.set('value', this.options.valueFilter.call(this, data));
			});
		},
		
		syncWithValueField: function(data){
			var valueField = this.options.valueField;
			var value = valueField.get('value');
			if(!valueField || !value) return;
			
			this.addParameter(data);
			this.addDataReadyEvent(value);
			
			this.data.prepare(this.elements.field.node.get('value'));
		},
		
		addParameter: function(data){
			this.parameter = {
				name: this.options.syncName,
				value: function(){ return this.options.valueField.value }.bind(this)
			};
			if(this.data.url) this.data.url.addParameter(this.parameter);
		},
		
		addDataReadyEvent: function(value){
			var self = this;
			this.data.addEvent('ready', function runOnce(){
				var values = this.get();
				for(var i = values.length; i--;){
					if(self.options.valueFilter.call(self, values[i]) == value){
						self.elements.field.node.set('value', self.options.formatMatch.call(self, '', values[i], 0));
					}
				}
				if(this.url) this.url.removeParameter(self.parameter);
				this.removeEvent('ready', runOnce);
			});
		}
		
	});
	
	
	Meio.Element = new Class({
		
		Implements: [Events],
		
		initialize: function(node){
			this.setNode(node);
			this.createBoundEvents();
			this.attach();
		},
		
		setNode: function(node){
			this.node = node ? $(node) || $$(node)[0] : this.render();
		},
		
		createBoundEvents: function(){
			this.bound = {};
			this.boundEvents.each(function(evt){
				this.bound[evt] = function(e){
					this.fireEvent('before' + evt.capitalize(), e);
					this[evt] && this[evt](e);
					this.fireEvent(evt, e);
					return true;
				}.bindWithEvent(this);
			}, this);
		},
		
		attach: function(){
			for(e in this.bound){
				this.node.addEvent(e, this.bound[e]);
			}
		},
		
		detach: function(){
			for(e in this.bound){
				this.node.removeEvent(e, this.bound[e]);
			}
		},
		
		toElement: function(){
			this.node;
		},
		
		render: $empty
		
	});

	Meio.Element.Field = new Class({
		
		Extends: Meio.Element,
		
		Implements: [Options],
		
		options: {
			classes: {
				loading: 'ma-loading',
				selected: 'ma-selected'
			}
		},
		
		initialize: function(field, options){
			this.keyPressControl = {};
			this.boundEvents = ['paste', 'focus', 'blur', 'click', 'keyup', 'keyrepeat'];
			if(browserEngine.trident4) this.boundEvents.push('keypress'); // yeah super ugly, but what can be awesome with ie?
			this.parent(field);
			this.setOptions(options);
			
			$(global).addEvent('unload', function(){
				this.node.set('autocomplete', 'on'); // if autocomplete is off when you reload the page the input value gets erased
			}.bind(this));
		},
		
		setNode: function(element){
			this.parent(element);
			this.node.set('autocomplete', 'off');
		},
		
		// this let me get the value of the input on keydown and keypress
		keyrepeat: function(e){
			$clear(this.keyrepeatTimer);
			this.keyrepeatTimer = this._keyrepeat.delay(1, this, e);
		},
		
		_keyrepeat: function(e){
			this.fireEvent('delayedKeyrepeat', e);
		},
		
		destroy: function(){
			this.detach();
			this.node.removeAttribute('autocomplete');
		},
		
		addLoadingClass: function(){
			this.node.addClass(this.options.classes.loading);
		},
		
		removeLoadingClass: function(){
			this.node.removeClass(this.options.classes.loading);
		},
		
		addSelectedClass: function(){
			this.node.addClass(this.options.classes.selected);
		},
		
		removeSelectedClass: function(){
			this.node.removeClass(this.options.classes.selected);
		},
		
		// ie6 only, uglyness
		// this fix the form being submited on the press of the enter key
		keypress: function(e){
			if(e.key == 'enter') this.bound.keyrepeat(e);
		}
		
	});

	Meio.Element.List = new Class({
		
		Extends: Meio.Element,
		
		Implements: [Options],
		
		options: {
			width: 'auto', // 'input' for the same width as the input
			classes: {
				container: 'ma-container',
				hover: 'ma-hover',
				odd: 'ma-odd',
				even: 'ma-even'
			}
		},
		
		initialize: function(options){
			this.boundEvents = ['mousedown', 'mouseover'];
			this.parent();
			this.setOptions(options);
			this.focusedItem = null;
		},
		
		applyMaxHeight: function(maxVisibleItems){
			var listChildren = this.list.childNodes;
			var node = listChildren[maxVisibleItems - 1] || (listChildren.length ? listChildren[listChildren.length - 1] : null);
			if(!node) return;
			node = $(node);
			// uggly hack to fix the height of the autocomplete list
			// TODO rethink about it
			this.node.setStyle('height', node.getCoordinates(this.list).bottom);
			this.node.setStyle('height', node.getCoordinates(this.list).bottom);
		},
		
		mouseover: function(e){
			var item = this.getItemFromEvent(e), hoverClass = this.options.classes.hover;
			if(!item) return true;
			if(this.focusedItem) this.focusedItem.removeClass(hoverClass);
			item.addClass(hoverClass);
			this.focusedItem = item;
			this.fireEvent('focusItem', [this.focusedItem]);
		},
		
		mousedown: function(e){
			e.preventDefault();
			this.shouldNotBlur = true;
			if(!(this.focusedItem = this.getItemFromEvent(e))){
				e.dontHide = true;
				return true;
			} 
			this.focusedItem.removeClass(this.options.classes.hover);
		},
		
		focusItem: function(direction){
			var hoverClass = this.options.classes.hover, newFocusedItem;
			if(this.focusedItem){
				if((newFocusedItem = this.focusedItem[direction == 'up' ? 'getPrevious' : 'getNext']())){
					this.focusedItem.removeClass(hoverClass);
					newFocusedItem.addClass(hoverClass);
					this.focusedItem = newFocusedItem;
					this.scrollFocusedItem(direction);
				}
			}
			else{
				if((newFocusedItem = this.list.getFirst())){
					newFocusedItem.addClass(hoverClass);
					this.focusedItem = newFocusedItem;
				}
			}
		},
		
		scrollFocusedItem: function(direction){
			var focusedItemCoordinates = this.focusedItem.getCoordinates(this.list),
				scrollTop = this.node.scrollTop;
			if(direction == 'down'){
				var delta = focusedItemCoordinates.bottom - this.node.getStyle('height').toInt();
				if((delta - scrollTop) > 0){
					this.node.scrollTop = delta;
				}
			}else{
				var top = focusedItemCoordinates.top;
				if(scrollTop && scrollTop > top){
					this.node.scrollTop = top;
				}
			}
		},
		
		getItemFromEvent: function(e){
			var target = e.target;
			while(target && target.tagName != 'LI'){
				if(target === this.node) return null;
				target = target.parentNode;
			}
			return $(target);
		},
		
		render: function(){
			var node = new Element('div', {'class': this.options.classes.container});
			if(node.bgiframe) node.bgiframe({top: 0, left: 0});
			this.list = new Element('ul').inject(node);
			$(document.body).grab(node);
			return node;
		},
		
		positionNextTo: function(fieldNode){
			var width = this.options.width;
			var elPosition = fieldNode.getCoordinates();
			this.node.setStyle('width', width == 'input' ? fieldNode.getWidth().toInt() - this.node.getStyle('border-left-width').toInt() - this.node.getStyle('border-right-width').toInt() : width);
			this.node.setPosition({x: elPosition.left, y: elPosition.bottom});
		},
		
		show: function(){
			this.node.scrollTop = 0;
			this.node.setStyle('visibility', 'visible');
			this.showing = true;
		},
		
		hide: function(){
			this.showing = false;
			this.node.setStyle('visibility', 'hidden');
		}
		
	});
	
	Meio.Autocomplete.Filters = {
		filters: {
			contains: function(text, data){
				return text ? data.contains(text) : true;
			},
			startswith: function(text, data){
				return text ? data.test(new RegExp('^' + text.escapeRegExp())) : true;
			}
		},
		add: function(name, fn){
			this.filters[name] = fn;
			return this;
		},
		get: function(name){
			return this.filters[name] || name || $empty;
		}
	};
	
	Meio.Autocomplete.Data = new Class({
		
		Implements: [Options, Events],
		
		initialize: function(data, cache){
			this.data = data;
			this._cache = cache;
		},
		
		get: function(){
			return this.data;
		},
		
		getKey: function(){
			return this.cachedKey;
		},
		
		prepare: function(text){
			this.cachedKey = text;
			this.fireEvent('ready');
		},
		
		cache: function(key, data){
			this._cache.set(key, data);
		},
		
		refreshKey: $empty
		
	});
	
	Meio.Autocomplete.Data.Request = new Class({
		
		Extends: Meio.Autocomplete.Data,
		
		options: {
			noCache: true
		},
		
		initialize: function(url, cache, element, options, urlOptions){
			this.setOptions(options);
			this.rawUrl = url;
			this._cache = cache;
			this.element = element;
			this.urlOptions = urlOptions;
			this.refreshKey();
			this.createRequest();
		},
		
		prepare: function(text){
			this.cachedKey = this.url.evaluate(text);
			if(this._cache.has(this.cachedKey)){
				this.fireEvent('ready');
			}else{
				this.request.send({url: this.cachedKey});
			}
		},
		
		createRequest: function(){
			var self = this;
			this.request = new Request.JSON(this.options);
			this.request.addEvents({
				request: function(){
					self.element.addLoadingClass();
				},
				complete: function(){
					self.element.removeLoadingClass();
				},
				success: function(jsonResponse){
					self.data = jsonResponse;
					self.fireEvent('ready');
				}
			});
		},
		
		refreshKey: function(urlOptions){
			urlOptions = $merge(this.urlOptions, {url: this.rawUrl}, urlOptions || {});
			this.url = new Meio.Autocomplete.Data.Request.URL(urlOptions.url, urlOptions);
		}
		
	});
	
	Meio.Autocomplete.Data.Request.URL = new Class({
		
		Implements: [Options],
		
		options: {
			extraParams: null,
			max: 20
		},
		
		initialize: function(url, options){
			this.setOptions(options);
			this.rawUrl = url;
			this.url = url;
			this.url += this.url.contains('?') ? '&' : '?';
			this.dynamicExtraParams = [];
			var params = $splat(this.options.extraParams);
			for(var i = params.length; i--;){
				this.addParameter(params[i]);
			}
			if(this.options.max) this.addParameter('limit=' + this.options.max);
		},
		
		evaluate: function(text){
			text = text || '';
			var params = this.dynamicExtraParams, url = [];
			url.push('q=' + encodeURIComponent(text));
			for(var i = params.length; i--;){
				url.push(encodeURIComponent(params[i].name) + '=' + encodeURIComponent($lambda(params[i].value)()));
			}
			return this.url + url.join('&');
		},
		
		addParameter: function(param){
			if(isFinite(param.nodeType) || $type(param.value) == 'function'){
				this.dynamicExtraParams.push(param);
			}else{
				this.url += (($type(param) == 'string') ? param : encodeURIComponent(param.name) + '=' + encodeURIComponent(param.value)) + '&';
			}
		},
		
		// TODO remove non dynamic parameters
		removeParameter: function(param){
			this.dynamicExtraParams.erase(param);
		}
		
	});
	
	Meio.Autocomplete.Cache = new Class({
		
		initialize: function(maxLength){
			this.refresh();
			this.setMaxLength(maxLength);
		},
		
		set: function(key, value){
			if(!this.cache[key]){
				if(this.getLength() >= this.maxLength){
					var keyToRemove = this.pos.shift();
					this.cache[keyToRemove] = null;
					delete this.cache[keyToRemove];
				}
				this.cache[key] = value;
				this.pos.push(key);
			}
			return this;
		},
		
		get: function(key){
			return this.cache[key || ''] || null;
		},
		
		has: function(key){
			return !!this.get(key);
		},
		
		getLength: function(){
			return this.pos.length;
		},
		
		refresh: function(){
			this.cache = {};
			this.pos = [];
		},
		
		setMaxLength: function(maxLength){
			this.maxLength = Math.max(maxLength, 1);
		}
		
	});
	
	globalCache = new Meio.Autocomplete.Cache();
	
	if(typeof global.Meio == 'undefined') global.Meio = Meio;
	else $extend(global.Meio, Meio);
	
})(this);