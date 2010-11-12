/*
---

description: Port of bgiframe plugin for mootools

authors:
 - Fábio Miranda Costa

requires:
 - Core/Class.Extras

license: MIT-style license Original plugin copyright Copyright (c) 2006 Brandon Aaron (http://brandonaaron.net) Dual licensed under the MIT (http://www.opensource.org/licenses/mit-license.php) and GPL (http://www.opensource.org/licenses/gpl-license.php) licenses. Version 2.1.1

provides: [BGIFrame]

...
*/

(function(global, $){
	
	var isIE6 = Browser.ie6; // better compression and faster

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
			if (!isIE6) return;
			this.setOptions(options);
			this.element = $(element);
			var firstChild = this.element.getFirst();
			if (!(firstChild && firstChild.hasClass('bgiframe'))){
				this.element.grab(document.createElement(this.render()), 'top');
			}
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
		if (isIE6) new BgIframe(this, options);
		return this;
	});
	
})(this, document.id || $);