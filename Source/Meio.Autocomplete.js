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

	// Custom Events
	
	// thanks Jan Kassens
	$extend(Element.NativeEvents, {
		'paste': 2, 'input': 2
	});
	Element.Events.paste = {
		base : (Browser.Engine.presto || (Browser.Engine.gecko && Browser.Engine.version < 19)) ? 'input' : 'paste',
		condition: function(e){
			this.fireEvent('paste', e, 1);
			return false;
		}
	};
	
	// the key event that repeats
	Element.Events.keyrepeat = {
		base : (Browser.Engine.gecko || Browser.Engine.presto) ? 'keypress' : 'keydown',
		condition: $lambda(true)
	};
	
	// Autocomplete itself

	var Meio = {};
	
	var keyPressControl = {};
	
	var cache;
	
	var $ = global.document.id || global.$;
	
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
	Meio.Autocomplete = {};
	
	Meio.Autocomplete.Widget = new Class({
		
		Implements: [Options, Events, Chain],
		
		options: {
			
			delay: 200,
			minChars: 0,
			cacheLength: 20,
			selectOnTab: true,
			maxVisibleItems: 10,
			
			filter: 'contains',
			formatMatch: function(text, data){
				return data;
			},
			formatItem: function(text, data, i){
				return text ? data.replace(new RegExp('(' + text.escapeRegExp() + ')', 'g'), '<strong>$1</strong>') : data;
			},
			
			listClass: null,
			
			elementOptions: {}, // see Element options
			listOptions: {}, // see List options
			
			requestOptions: {}, // see DataRequest options
			urlOptions: {} // see URL options
			
		},
		
		initialize: function(input, data, options){
			var widget = this;
			this.setOptions(options);

			this.elements = {
				field: new Meio.Autocomplete.Element.Field(input, this.options.elementOptions),
				list: new (this.options.listClass || Meio.Autocomplete.Element.List)(this.element, this.options.listOptions)
			};
			
			this.elements.field.addEvents({
				'beforeKeyrepeat': function(e){
					widget.elements.list.active = 1;
					var e_key = e.key;
					if(e_key == 'up' || e_key == 'down' || (e_key == 'enter' && widget.elements.list.showing)) e.preventDefault();
				},
				'delayedKeyrepeat': function(e){
					var e_key = e.key;
					keyPressControl[e_key] = true;
					switch(e_key){
					case 'up': case 'down':
						widget.focusItem(e_key);
						break;
					case 'enter':
						widget.setInputValue();
						break;
					case 'tab':
						if(widget.options.selectOnTab) this.list.setInputValue();
						keyPressControl[e_key] = false; // tab blurs the input so the keyup event wont happen at the same input you made a keydown
						break;
					case 'esc':
						widget.elements.list.hide();
						break;
					default:
						widget.setupList();
					}
					widget.oldInputedText = widget.elements.field.node.get('value');
				},
				'keyup': function(e){
					if(!keysThatDontChangeValueOnKeyUp[e.code]){
						if(!keyPressControl[e.key]){
							widget.setupList();
						}
						keyPressControl[e.key] = false;
					}
				},
				'focus': function(){
					widget.elements.list.active = 1;
					widget.elements.list.setNodeWidth(widget.elements.field.node);
					widget.elements.list.positionNextTo(widget.elements.field.node);
				},
				'click': function(){
					if(widget.elements.list.active++ > 1 && !widget.elements.list.showing){
						widget.forceSetupList();
					}
				},
				'blur': function(e){
					widget.elements.list.active = 0;
					if(widget.elements.list.shouldNotBlur){
						widget.elements.field.node.setCaretPosition('end');
						widget.elements.list.shouldNotBlur = false;
						if(widget.elements.list.focusedItem) widget.elements.list.hide();
					}else{
						widget.elements.list.hide();
					}
				},
				'paste': function(){
					return widget.setupList();
				}
			});
			
			this.elements.list.addEvents({
				'mousedown': function(e){
					widget.setInputValue();
				}
			});
			
			this.refreshCache();
			this.attach();
			this.handleData(data);
			//this.addEvent('dataReady', this.dataReady.bind(this));
		},
		
		update: function(){
			var text = this.inputedText, data = this.data, options = this.options;
			var filter = Meio.Autocomplete.Filters.get(options.filter), formatMatch = options.formatMatch, formatItem = options.formatItem; 
			var cacheKey = data.getKey(), cached = cache.get(cacheKey), html;
			if(cached){
				html = cached.html;
				this.itemsData = cached.data;
			}else{
				data = data.get();
				var itemsHtml = [], itemsData = [], classes = this.elements.list.options.classes;
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
				cache.set(cacheKey, {html: html, data: itemsData});
				this.itemsData = itemsData;
			}
			this.elements.list.focusedItem = null;
			this.fireEvent('deselectItem');
			this.elements.list.list.set('html', html);
			if(this.options.maxVisibleItems) this.elements.list.applyMaxHeight(this.options.maxVisibleItems);
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
			if(this.inputedText.length >= this.options.minChars){
				$clear(this.prepareTimer);
				this.prepareTimer = this.data.prepare.delay(this.options.delay, this.data, this.inputedText);	
			}
		},
		
		handleData: function(data){
			this.data = ($type(data) == 'string') ?
				new Meio.Autocomplete.Data.Request(data, this.elements.field, this.options.requestOptions, this.options.urlOptions) :
				new Meio.Autocomplete.Data(data);
			this.data.addEvent('ready', this.dataReady.bind(this));
		},
		
		dataReady: function(){
			this.update(this);
			if(this.onUpdate){
				this.onUpdate();
				this.onUpdate = null;
			}
			this.elements.list.toggleVisibility();
		},
		
		setInputValue: function(){
			if(this.elements.list.focusedItem){
				var text = this.elements.list.focusedItem.get('title');
				this.elements.field.node.set('value', text);
				this.fireEvent('selectItem', [this.itemsData[this.elements.list.focusedItem.get('data-index')], text]);
			}
			this.elements.list.hide();
		},
		
		focusItem: function(direction){
			if(this.elements.list.showing){
				this.elements.list.focusItem(direction);
			}else{
				this.forceSetupList();
				this.onUpdate = function(){ this.elements.list.focusItem(direction); };
			}
		},
		
		attach: function(){
			this.elements.list.attach();
			this.elements.field.attach();
		},
		
		detach: function(){
			this.elements.list.detach();
			this.elements.field.detach();
		},
		
		destroy: function(){
			// TODO destroy list DOM element and other events
			this.element.destroy();
		},
		
		refreshCache: function(cacheLength){
			cache = Meio.Autocomplete.Cache.initialize(cacheLength || this.options.cacheLength);
		},
		
		refreshAll: function(cacheLength, urlOptions){
			// TODO, do you really need to refresh the url? see a better way of doing this
			this.refreshCache(cacheLength);
			this.data.refreshKey(urlOptions);
		}
		
	});
	
	Meio.Autocomplete.Element = new Class({
		
		Implements: [Events],
		
		initialize: function(node){
			this.setNode(node);
			this.createBoundEvents();
			this.attach();
		},
		
		setNode: function(node){
			this.node = node ? $(node) || $$(node)[0] : this.render();
		},
		
		setWidget: function(widget){
			this.widget = widget;
		},
		
		createBoundEvents: function(){
			this.bound ={};
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

	Meio.Autocomplete.Element.Field = new Class({
		
		Extends: Meio.Autocomplete.Element,
		
		Implements: [Options],
		
		options: {
			loadingClass: 'ma-loading'
		},
		
		initialize: function(field, widget, options){
			this.boundEvents = ['paste', 'focus', 'blur', 'click', 'keyup', 'keyrepeat'];
			this.parent(field);
			this.setOptions(options);
			this.setWidget(widget);
			
			$(global).addEvent('unload', function(){
				this.node.set('autocomplete', 'on'); // if autocomplete is off when you reload the page the input value gets erased
			}.bind(this));
		},
		
		setElement: function(element){
			this.parent(element);
			this.node.set('autocomplete', 'off');
		},
		
		// this let me get the value of the input on keydown and keypress
		keyrepeat: function(e){
			$clear(this.keyrepeatTimer);
			this.keyrepeatTimer = this._keyrepeat.delay(1, this, [e]);
		},
		
		_keyrepeat: function(e){
			this.fireEvent('delayedKeyrepeat', [e]);
		},
		
		destroy: function(){
			this.detach();
			this.node.removeAttribute('autocomplete');
		},
		
		addLoadingClass: function(){
			this.node.addClass(this.options.loadingClass);
		},
		
		removeLoadingClass: function(){
			this.node.removeClass(this.options.loadingClass);
		}
		
	});

	Meio.Autocomplete.Element.List = new Class({
		
		Extends: Meio.Autocomplete.Element,
		
		Implements: [Options],
		
		options: {
			
			onNoItemToList: function(){
				this.node.highlight('#ff0000');
			},
			onSelectItem: function(){
				this.node.addClass(this.options.classes.selected);
			},
			onDeselectItem: function(){
				this.node.removeClass(this.options.classes.selected);
			},
			
			width: 'auto', // 'input' for the same width as the input
			classes: {
				container: 'ma-container',
				hover: 'ma-hover',
				odd: 'ma-odd',
				even: 'ma-even',
				selected: 'ma-selected'
			}
			
		},
		
		initialize: function(options){
			this.boundEvents = ['mousedown', 'mouseover'];
			this.parent();
			this.setOptions(options);
			this.focusedItem = null;
			this.active = 0;
		},
		
		applyMaxHeight: function(maxVisibleItems){
			var listChildren = this.list.childNodes;
			var node = listChildren[maxVisibleItems - 1] || (listChildren.length ? listChildren[listChildren.length - 1] : null);
			if(!node) return;
			this.node.setStyle('height', $(node).getCoordinates(this.list).bottom);
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
			// TODO adapt to the new structure
			e.preventDefault();
			this.shouldNotBlur = true;
			if(!(this.focusedItem = this.getItemFromEvent(e))) return true;
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
			this.list = new Element('ul').inject(node);
			$(document.body).adopt(node);
			return node;
		},
		
		setNodeWidth: function(fieldNode){
			var width = this.options.width;
			this.node.setStyle('width', width == 'input' ? fieldNode.getWidth().toInt() - this.node.getStyle('border-left-width').toInt() - this.node.getStyle('border-right-width').toInt() : width);
		},
		
		positionNextTo: function(fieldNode){
			var elPosition = fieldNode.getCoordinates();
			this.node.setPosition({x: elPosition.left, y: elPosition.bottom});
		},
		
		toggleVisibility: function(){
			if(this.list.get('html')){
				this.show();
			}else{
				this.fireEvent('noItemToList');
				this.hide();
			}
		},
		
		show: function(){
			if(!this.active) return;
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
		
		initialize: function(data){
			this.data = data;
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
			cache.set(key, data);
		},
		
		refreshKey: function(){}
		
	});
	
	Meio.Autocomplete.Data.Request = new Class({
		
		Extends: Meio.Autocomplete.Data,
		
		options: {
			noCache: true
		},
		
		initialize: function(url, element, options, urlOptions){
			this.setOptions(options);
			this.urlOptions = urlOptions;
			this.element = element;
			this.rawUrl = url;
			this.refreshKey();
			this.createRequest();
		},
		
		prepare: function(text){
			this.cachedKey = this.url.evaluate(text);
			if(cache.has(this.cachedKey)){
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
			extraParams: {},
			max: 20
		},
		
		initialize: function(url, options){
			this.setOptions(options);
			var params = this.options.extraParams;
			var urlParams = [];
			this.dynamicExtraParams = [];
			for(var i = params.length; i--;){
				(isFinite(params[i].nodeType) || $type(params[i].value) == 'function') ?
					this.dynamicExtraParams.push(params[i]) : urlParams.push(params[i].name + '=' + params[i].value);
			}
			if(this.options.max) urlParams.push('limit=' + this.options.max);
			url += (url.contains('?')) ? '&' : '?';	
			url += urlParams.join('&');
			this.url = url;
		},
		
		evaluate: function(text){
			text = text || '';
			var params = this.dynamicExtraParams, url = [];
			url.push('q=' + text);
			for(var i = params.length; i--;){
				url.push(params[i].name + '=' + $lambda(params[i].value)());
			}
			return this.url + url.join('&');
		}
		
	});
	
	Meio.Autocomplete.Cache = {
		
		initialize: function(maxLength){
			this.maxLength = maxLength;
			this.cache = {};
			this.pos = [];
			return this;
		},
		
		set: function(key, value){
			if(!this.cache[key]){
				if(this.getLength() >= this.maxLength){
					var keyToRemove = this.pos.pop();
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
		}
		
	};
	
	if(typeof global.Meio == 'undefined') global.Meio = Meio;
	else $extend(global.Meio, Meio);
	
})(this);