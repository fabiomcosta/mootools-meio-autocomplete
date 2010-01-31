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
	
	Meio.Autocomplete = new Class({
		
		Implements: [Options, Events, Chain],
		
		options: {
			
			delay: 200,
			minChars: 0,
			cacheLength: 20,
			selectOnTab: true,
			
			filter: 'contains',
			formatMatch: function(text, data){
				return data;
			},
			formatItem: function(text, data, i){
				return text ? data.replace(new RegExp('(' + text.escapeRegExp() + ')', 'g'), '<strong>$1</strong>') : data;
			},
			
			listClass: null,
			requestOptions: {}, // see request options
			listOptions: {} // see List options
			
		},
		
		initialize: function(element, data, options){
			this.element = $(element) || $$(element)[0];
			if(!this.element) return false;
			this.setOptions(options);
			
			this.element.set('autocomplete', 'off');
			this.options.listClass = this.options.listClass || Meio.Autocomplete.List;
			
			this.list = new this.options.listClass(this.element, this.options.listOptions);
			
			this.refreshCache();
			this.handleData(data);
			this.attach();
			
			this.addEvent('dataReady', this.dataReady.bind(this));
			
			$(global).addEvent('unload', function(){
				this.element.set('autocomplete', 'on'); // if autocomplete is off when you reload the page the input value gets erased
			}.bind(this));
		},
		
		handleData: function(data){
			var url;
			this.data = ($type(data) == 'string') ?
				new Meio.Autocomplete.Data.Request(data, this.element, this.options.requestOptions) :
				new Meio.Autocomplete.Data(data);
			this.data.addEvent('ready', this.dataReady.bind(this));
		},
		
		keyrepeat: function(e){
			this.list.active = 1;
			var e_key = e.key;
			if(e_key == 'up' || e_key == 'down' || (e_key == 'enter' && this.list.showing)) e.preventDefault();
			// this let me get the value of the input on keydown and keypress
			$clear(this.keyrepeatTimer);
			this.keyrepeatTimer = this._keyrepeat.delay(1, this, [e, true]);
			return true;
		},
		
		_keyrepeat: function(e, delay){
			var e_key = e.key;
			keyPressControl[e_key] = true;
			switch(e_key){
			case 'up': case 'down':
				this.focusItem(e_key);
				break;
			case 'enter':
				this.list.setInputValue();
				break;
			case 'tab':
				if(this.options.selectOnTab) this.list.setInputValue();
				keyPressControl[e_key] = false; // tab blurs the input so the keyup event wont happen at the same input you made a keydown
				break;
			case 'esc':
				this.list.hide();
				break;
			default:
				this.setupList();
			}
			return true;
		},
		
		keyup: function(e){
			if(!keysThatDontChangeValueOnKeyUp[e.code]){
				if(!keyPressControl[e.key]){
					this.setupList();
				}
				keyPressControl[e.key] = false;
			}
			return true;
		},

		focus: function(){
			this.list.active++;
		},
		
		click: function(){
			if(this.list.active++ > 1 && !this.list.showing){
				this.setupList();
			}
		},
		
		blur: function(e){
			this.list.active = 0;
			if(this.list.shouldNotBlur){
				this.element.setCaretPosition('end');
				this.list.shouldNotBlur = false;
				if(this.list.focusedItem) this.list.hide();
			}else{
				this.list.hide();
			}
			return true;
		},
		
		paste: function(){
			return this.setupList();
		},
		
		setupList: function(){
			this.inputedText = this.element.get('value');
			if(this.inputedText.length >= this.options.minChars && this.inputedText !== this.list.oldInputedText){
				$clear(this.prepareTimer);
				this.prepareTimer = this.data.prepare.delay(this.options.delay, this.data, this.inputedText);
			}else{
				this.list.hide();
			}
			return true;
		},
		
		dataReady: function(){
			this.list.update(this);
			if(this.onUpdate){
				this.onUpdate();
				this.onUpdate = null;
			}
			this.list.toggleVisibility();
		},
		
		focusItem: function(direction){
			if(!this.list.showing){
				this.setupList();
				this.onUpdate = function(){ this.list.focusItem(direction); };
			}else{
				this.list.focusItem(direction);
			}
		},
		
		attach: function(){
			this.bound = {};
			['paste', 'focus', 'blur', 'click', 'keyup', 'keyrepeat'].each(function(e){
				this.bound[e] = this[e].bindWithEvent(this);
				this.element.addEvent(e, this.bound[e]);
			}, this);
		},
		
		detach: function(){
			for(e in this.bound){
				this.element.removeEvent(e, this.bound[e]);
			}
		},
		
		destroy: function(){
			this.detach();
			this.element.removeAttribute('autocomplete');
		},
		
		refreshCache: function(cacheLength){
			cache = Meio.Autocomplete.Cache.initialize(cacheLength || this.options.cacheLength);
		},
		
		refreshAll: function(cacheLength, urlOptions){
			this.refreshCache(cacheLength);
			this.data.refreshKey(urlOptions);
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
		},
		get: function(name){
			return this.filters[name] || name || $empty;
		}
	};
	
	Meio.Autocomplete.List = new Class({
		
		Implements: [Options, Events],
		
		options: {
			
			onNoItemToList: function(){
				this.element.highlight('#ff0000');
			},
			onSelectItem: function(){
				this.element.addClass(this.options.classes.hasItemSelected);
			},
			onUnselectItem: function(){
				this.element.removeClass(this.options.classes.hasItemSelected);
			},
			
			width: 'auto', // 'input' for the same width as the input
			scrollItem: 10,
			classes: {
				container: 'ma-container',
				hover: 'ma-hover',
				odd: 'ma-odd',
				even: 'ma-even',
				hasItemSelected: 'ma-selected'
			}
			
		},
		
		initialize: function(element, options){
			this.element = element;
			this.focusedItem = null;
			this.active = 0;
			this.setOptions(options);
			this.render();
		},
		
		update: function(ac){
			var text = ac.inputedText, data = ac.data, options = ac.options;
			var filter = Meio.Autocomplete.Filters.get(options.filter), formatMatch = options.formatMatch, formatItem = options.formatItem; 
			var cacheKey = data.getKey(), cached = cache.get(cacheKey), html;
			if(cached){
				html = cached.html;
				this.itemsData = cached.data;
			}else{
				data = data.get();
				var itemsHtml = [], itemsData = [], classes = this.options.classes;
				for(var row, i = 0, n = 0, formattedMatch; row = data[i++];){
					if(filter.call(ac, text, row)){
						itemsHtml.push(
							'<li title="', this.encode(formatMatch.call(ac, text, row)),
							'" data-index="', n,
							'" class="', (n%2 ? classes.even : classes.odd), '">',
							formatItem.call(ac, text, row, n),
							'</li>'
						);
						itemsData.push(row);
						n++;
					}
				}
				len = n;
				html = itemsHtml.join('');
				this.itemsData = itemsData;
				cache.set(cacheKey, {html: html, data: itemsData});
			}
			this.focusedItem = null;
			this.fireEvent('unselectItem');
			this.list.set('html', html);
			if(this.options.scrollItem) this.applyMaxHeight();
		},
		
		applyMaxHeight: function(){
			var listChildren = this.list.childNodes;
			var node = listChildren[this.options.scrollItem - 1] || (listChildren.length ? listChildren[listChildren.length - 1] : null);
			if(!node) return;
			this.container.setStyle('height', $(node).getCoordinates(this.list).bottom);
		},
		
		render: function(){
			this.container = new Element('div', {
				'class': this.options.classes.container,
				'events': {
					'mousedown': this.mousedown.bindWithEvent(this)
				}
			});
			this.list = new Element('ul', {
				'events': {
					'mouseover': this.mouseover.bindWithEvent(this)
				}
			}).inject(this.container);
			$(document.body).adopt(this.container);
			this.setContainerWidth();
			this.positionateNextToElement();
		},
		
		setContainerWidth: function(){
			var width = this.options.width;
			this.container.setStyle('width', width == 'input' ? this.element.getWidth().toInt() - this.container.getStyle('border-left-width').toInt() - this.container.getStyle('border-right-width').toInt() : width);
		},
		
		mouseover: function(e){
			var item = this.getItemFromEvent(e), hoverClass = this.options.classes.hover;
			if(!item) return true;
			if(this.focusedItem) this.focusedItem.removeClass(hoverClass);
			item.addClass(hoverClass);
			this.focusedItem = item;
			this.fireEvent('focusItem');
		},
		
		mousedown: function(e){
			e.preventDefault();
			this.shouldNotBlur = true;
			if(!(this.focusedItem = this.getItemFromEvent(e))) return true;
			this.setInputValue();
			this.focusedItem.removeClass(this.options.classes.hover);
		},
		
		setInputValue: function(){
			if(this.focusedItem){
				var text = this.focusedItem.get('title');
				this.element.set('value', text);
				this.oldInputedText = text;
				this.fireEvent('selectItem', [this.itemsData[this.focusedItem.get('data-index')], text]);
			}
			this.hide();
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
				scrollTop = this.container.scrollTop;
			if(direction == 'down'){
				var delta = focusedItemCoordinates.bottom - this.container.getStyle('height').toInt();
				if((delta - scrollTop) > 0){
					this.container.scrollTop = delta;
				}
			}else{
				var top = focusedItemCoordinates.top;
				if(scrollTop && scrollTop > top){
					this.container.scrollTop = top;
				}
			}
		},
		
		getItemFromEvent: function(e){
			var target = e.target;
			while(target && target.tagName != 'LI'){
				if(target === this.container) return null;
				target = target.parentNode;
			}
			return $(target);
		},
		
		positionateNextToElement: function(){
			var elPosition = this.element.getCoordinates();
			this.container.setPosition({x: elPosition.left, y: elPosition.bottom});
		},
		
		toggleVisibility: function(){
			if(this.list.get('html')){
				this.show();
			}else{
				this.fireEvent('noItemToList');
				this.hide();
			}
		},
		
		encode: function(str){
			return str.replace(/"/g, '&quot;').replace(/'/g, '&#39;');
		},
		
		show: function(){
			if(!this.active) return;
			this.container.scrollTop = 0;
			this.container.setStyle('visibility', 'visible');
			this.showing = true;
		},
		
		hide: function(){
			this.showing = false;
			this.container.setStyle('visibility', 'hidden');
		},
		
		toElement: function(){
			return this.container;
		}
		
	});
	
	
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
			extraParams: {},
			max: 20,
			className: 'ma-loading',
			noCache: true
		},
		
		initialize: function(url, element, options){
			this.setOptions(options);
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
					self.element.addClass(self.options.className);
				},
				complete: function(){
					self.element.removeClass(self.options.className);
				},
				success: function(jsonResponse){
					self.data = jsonResponse;
					self.fireEvent('ready');
				}
			});
		},
		
		refreshKey: function(urlOptions){
			urlOptions = $merge(this.options, {url: this.rawUrl}, urlOptions || {});
			this.url = new Meio.Autocomplete.Data.Request.URL(urlOptions.url, urlOptions.extraParams, urlOptions.max);
		}
		
	});
	
	
	Meio.Autocomplete.Data.Request.URL = new Class({
		
		initialize: function(url, params, max){
			var urlParams = [];
			this.dynamicExtraParams = [];
			for(var i = params.length; i--;){
				(isFinite(params[i].nodeType) || $type(params[i].value) == 'function') ?
					this.dynamicExtraParams.push(params[i]) : urlParams.push(params[i].name + '=' + params[i].value);
			}
			if(max) urlParams.push('limit=' + max);
			url += (url.contains('&')) ? '&' : '?';	
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