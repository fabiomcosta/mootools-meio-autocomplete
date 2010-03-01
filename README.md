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

	#JAVASCRIPT
	<script type="text/javascript">
		var data = [
			{"value": 0, "text": "Brazil"},
			{"value": 1, "text": "Ajax"},
		];

		var autocomplete = new Meio.Autocomplete($('text_input_id'), data, {
			selectOnTab: false,
			onNoItemsToList: function(elements){
				elements.field.node.highlight('#ff0000');
			},
			filter: {
				type: 'contains',
				path: 'text'
			}
		});
		
	</script>

Demos
-----


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
