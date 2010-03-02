Meio.Autocomplete - Copyright (c) 2010 [Fábio Miranda Costa](http://meiocodigo.com/)
========================================================================

Meio.Autocomplete - a mootools plugin for creating autocomplete fields.

![Screenshot](http://github.com/fabiomcosta/mootools-meio-autocomplete/raw/master/Assets/image_forge.png)

Introduction
------------

Thats not just another autocomplete plugin.
I made it because i needed it to work like a dom select element and because i wanted it to be flexible in a way that i could use anything as the autocomplete list.
This plugin can also share the same list element, in a way that it will inject just one dom element on the document if you create more than one autocomplete instance in the same page.

How to use
----------

This example shows most of its this plugin's options. All the values are the default ones.

	#JS
	var data = [
		{"value": 0, "text": "Brazil"},
		{"value": 1, "text": "Ajax"},
	];

	var autocomplete = new Meio.Autocomplete($('text_input_id'), data, {
		delay: 200, 			// the delay before rendering the list of options. Usefull when you are using the autocomplete with ajax
		minChars: 0,			// the minimum number of characters before it shows the list of options.
		cacheLength: 20,		// the cache length. Cache will decrease the number of ajax calls. Each time you make a different query it will be cached locally.
		cacheType: 'shared',	// 'shared' or 'own'. The cache instance can be shared with other Meio.Autocomplete instances or this instance can have its own cache.
		selectOnTab: true,		// if you press tab the current focused options will be selected.
		maxVisibleItems: 10,	// this defines the height of the list. If its 10 the list will have its height adjusted to show 10 options, but you can scroll to the other of course.
		listInstance: null,		// the instance of the list. With this options you can create a Meio.Autocomplete.List and share it with other instances of Meio.Autocomplete.
		
		onNoItemsToList: function(elements){ // this event is fired when theres no options to list
			elements.field.node.highlight('#ff0000');
		},
		onSelect: function(elements, value){},	// this event is fired when you select an options
		onDeselect: function(elements){},		// this event is fired when you deselect an option
		
		filter: {
			/*
				its posible to pass the filters directly or by passing a type and optionaly a path.
				
				filter: function(text, data){}			// filters the data array
				formatMatch: function(text, data, i){}	// this function should return the text value of the data element
				formatItem: function(text, data){}		// the return of this function will be applied to the 'html' of the li's
				
				or
				
				type: 'startswith' or 'contains' // can be any defined on the Meio.Autocomplete.Filter object
				path: 'a.b.c' // path to the text value on each object thats contained on the data array
			*/
		},
		
		fieldOptions: {
			classes: {
				loading: 'ma-loading',	// applied to the field when theres an ajax call being made
				selected: 'ma-selected'	// applied to the field when theres a selected value
			}
		},
		listOptions: {
			width: 'field',	// you can pass any other value settable by set('width') to the list container
			classes: {
				container: 'ma-container',
				hover: 'ma-hover',		// applied to the focused options
				odd: 'ma-odd',			// applied to the odd li's
				even: 'ma-even'			// applied to the even li's
			}
		},
		requestOptions: {
			noCache: true	// nocache is setted by default to avoid cache problem on ie
			// you can pass any of the Request.JSON options here -> http://mootools.net/docs/core/Request/Request.JSON
		},
		urlOptions: {
			extraParams: null,	// you can pass an array of elements or objects with 'value' and 'name' keys. the value key can 'value' can be a function.
								// ex: if you pass [{'name': 'x', 'value': function(){ return 2; }}] the url generated to get the list of options will have the 'x' parameter with value '2'.
			max: 20				// the max number of options that should be listed. This will be sent to the ajax request as the 'limit' parameter.
		}
	});

Demos
-----

Checkout the Demos folder. Ill create some public ones as soon as i can.

Credits
-------

Inspiration and some ideas came from:

* Digitarald's Autocompleter (http://digitarald.de/project/autocompleter/);
* jQuery's Autocomplete (http://docs.jquery.com/Plugins/Autocomplete).

License
-------

The MIT License (http://www.opensource.org/licenses/mit-license.php)

Permission is hereby granted, free of charge, to any person
obtaining a copy of this software and associated documentation
files (the "Software"), to deal in the Software without
restriction, including without limitation the rights to use,
copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the
Software is furnished to do so, subject to the following
conditions:

The above copyright notice and this permission notice shall be
included in all copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND,
EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES
OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND
NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT
HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY,
WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING
FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR
OTHER DEALINGS IN THE SOFTWARE.
