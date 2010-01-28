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


// thanks Jan Kassens
$extend(Element.NativeEvents, {
	'paste': 2, 'input': 2
});
Element.Events.paste = {
	base : (Browser.Engine.presto || (Browser.Engine.gecko && Browser.Engine.version < 19))? 'input': 'paste',
	condition: function(e){
		this.fireEvent('paste', e, 1);
		return false;
	}
};

(function(global){

	var Meio = {};
	
	var keyPressControl = {};
	
	var cache;
	
	var $ = global.document.id || global.$;
	
	var keyEventThatRepeats = (Browser.Engine.gecko || Browser.Engine.presto) ? 'keypress' : 'keydown';
	
	var keysThatDontChangeValueOnKeyUp = {
		16: 1,  // shift
		17: 1,  // control
		18: 1,  // alt
		224: 1, // command (meta)
		37: 1,  // left
		38: 1,  // up
		39: 1,  // right
		40: 1   // down
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
			
			requestOptions: {}, // see request options
			listOptions: {} // see List options
			
		},
		
		initialize: function(element, data, options){
			this.element = $(element) || $$(element)[0];
			if(!this.element) return false;
			this.setOptions(options);
			
			this.element.set('autocomplete', 'off');
			
			this.list = new Meio.Autocomplete.List(this.element, this.options.listOptions);
			
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
		
		keydown: function(e, delay){
			var e_key = e.key;
			if(!delay){
				if(e_key == 'up' || e_key == 'down' || e_key == 'enter') e.preventDefault();
				// this let me get the value of the input on keydown and keypress
				$clear(this.keydownTimer);
				this.keydownTimer = this.keydown.delay(1, this, [e, true]);
				return true;
			}
			keyPressControl[e_key] = true;
			this.inputedText = this.element.get('value');
			switch(e_key){
			case 'left': case 'right':
				break; // do nothing cause they dont change the input's value
			case 'up': case 'down':
				this.focusItem(e_key);
				break;
			case 'enter':
				this.list.setInputValue();
				break;
			case 'tab':
				if(this.options.selectOnTab) this.list.setInputValue();
				keyPressControl[e_key] = false; // tab blurs the input so the keyup event wont happen
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
					this.inputedText = this.element.get('value');
					this.setupList();
				}
				keyPressControl[e.key] = false;
			}
			return true;
		},

		focus: function(){
			this.list.active = true;
			return this.paste();
		},
		
		blur: function(e){
			this.list.active = false;
			this.list.hide();
			return true;
		},
		
		paste: function(){
			this.inputedText = this.element.get('value');
			this.setupList();
			return true;
		},
		
		setupList: function(){
			if(this.inputedText.length >= this.options.minChars){
				$clear(this.prepareTimer);
				this.prepareTimer = this.data.prepare.delay(this.options.delay, this.data, this.inputedText);
			}else{
				this.list.hide();
			}
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
			this.bound = {'paste': 0, 'focus': 0, 'blur': 0, 'keyup': 0, 'keydown': keyEventThatRepeats};
			var e;
			for(fnName in this.bound){
				e = this.bound[fnName];
				if(!e) e = fnName;
				this.bound[e] = this[fnName].bindWithEvent(this);
				this.element.addEvent(e, this.bound[e]);
			}
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
			
			width: 'auto', // 'input' for the same width as the input's
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
							'<li title="', formatMatch.call(ac, text, row),
							'" data-index="', n,
							'" class="', (n%2 ? classes.even : classes.odd), '">',
							formatItem.call(ac, text, row, n),
							'</li>'
						);
						itemsData.push(row);
						n++;
					}
				}
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
			this.container.setStyles({
				'height': node.getCoordinates(this.list).bottom,
				'overflow-x': 'auto',
				'overflow-y': 'hidden'
			});
		},
		
		render: function(){
			var width = this.options.width;
			this.container = new Element('div', {
				'class': this.options.classes.container,
				'styles': {
					'width': width == 'input' ? this.element.getWidth() : width
				}
			});
			this.list = new Element('ul', {
				events: {
					'mouseover': this.mouseover.bindWithEvent(this),
					'mousedown': this.mousedown.bindWithEvent(this)
				}
			}).inject(this.container);
			$(document.body).adopt(this.container);
			this.positionateNextToElement();
		},
		
		mouseover: function(e){
			var item = this.getItemFromEvent(e), hoverClass = this.options.classes.hover;
			if(this.focusedItem) this.focusedItem.removeClass(hoverClass);
			item.addClass(hoverClass);
			this.focusedItem = item;
			this.fireEvent('focusItem');
		},
		
		mousedown: function(e){
			e.preventDefault();
			this.focusedItem = this.getItemFromEvent(e);
			this.setInputValue();
			this.focusedItem.removeClass(this.options.classes.hover);
		},
		
		setInputValue: function(){
			if(this.focusedItem){
				var text = this.focusedItem.get('title');
				this.element.set('value', text);
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
			while(target.tagName != 'LI') target = target.parentNode;
			return target;
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
		
		show: function(){
			if(!this.active) return;
			this.container.setStyle('visibility', 'visible');
			this.showing = true;
		},
		
		hide: function(delay){
			delay = delay || 0;
			$clear(this.hideTimer);
			if(delay){
				this.hideTimer = this.hide.delay(delay, this);
			}else{
				this.showing = false;
				this.container.setStyle('visibility', 'hidden');
			}
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