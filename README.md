Meio.Autocomplete - Copyright (c) 2010 [Fábio Miranda Costa](http://meiocodigo.com/)
====================================================================================

Meio.Autocomplete - a mootools plugin for creating autocomplete fields.

![Screenshot](http://github.com/fabiomcosta/mootools-meio-autocomplete/raw/master/Assets/image_forge.png)


Introduction
------------

This plugin creates an autocomplete list of options at the bottom of an input text or textarea element.
The list can be any other container that you like too. See the demos to understand it better.
Please don't hesitated to ask anything. Feel free.


Dependencies
------------

Meio.Autocomplete depends on Mootools-more Element.Forms.
It's included into the "/Assets" folder.
There's also a "BGIFrame.js" port into the "/Source" folder for solving the z-index issues with select and object elements on IE6.
You just need to include it into your page for it to work together with Meio.Autocomplete. It's completely optional.


Note
----

1.x and below are the versions made to be used with Mootools 1.2.x.
2.x and greater are the versions made to be used with Mootools 1.3.x or greater.


How to use
----------

This example shows most of its this plugin's options. All the values are the default ones.

    #JS
    var data = [
        {"value": 0, "text": "Brazil"},
        {"value": 1, "text": "Ajax"},
    ];

    var autocomplete = new Meio.Autocomplete(
        document.id('text_input_id'),
        data // can be an array
             // or an url (a JSON request will be created
             // or a function that should provide the data (see examples inside the documentation)
    );


API Docs
--------

### Class: Meio.Autocomplete

#### Implements:

Options, Events.

#### Syntax:

    var myAutocomplete = new Meio.Autocomplete(element, data [, options, listInstance]);

#### Arguments:

* **element** - (mixed) A string ID of the Element or an Element to apply the Meio.Autocomplete List to.
* **data** - (mixed) An array of objects or a url to a page that will respond with a json object that will be converted to an array of objects.
* **options** - (object, optional) The Meio.Autocomplete options object

#### Options:

* **delay** - (number: defaults to 200) The delay before rendering the list of options. Usefull when you are using the autocomplete with ajax
* **minChars** - (number: defaults to 0) The minimum number of characters the user has to input before the list of options to select is shown.
* **cacheLength** - (number: defaults to 20) The cache length. Cache will decrease the number of ajax calls. Each time you make a different query it will be cached locally.
* **cacheType** - (string: defaults to 'shared') Can be 'shared' or 'own'.
 * **shared** - The cache instance will be shared with other Meio.Autocomplete instances in the same page.
 * **own** - The Meio.Autocomplete instance will have its own cache.
* **selectOnTab** - (boolean: defaults to true) If the user press the 'tab' key, the current focused option will be selected.
* **autoFocus** - (boolean: defaults to true) Auto focus if there is only one option. Also selects this one option if element is not active (user moved to other field while request running).
* **maxVisibleItems** - (number: defaults to 10) Defines the height of the list. If its 10, for example, the list will have its height adjusted to show 10 options, but you can still scroll to the others.
* **filter** - (object) The filter options. Its posible to pass the filter functions directly or by passing a type and optionaly a path.
 * **type** - (string: defaults to 'contains') If 'contains' is used, the items that contains the inputted text will be listed. If 'startswith' is used, only the items that starts with the inputted text will be listed. You can still define your own filter using the Meio.Autocomplete.Filter.define method, see the code to understand how it works.
 * **path** - (string: default to '') Should define the path to the text key into the objects that are in the data array. Ex: 'a.b.c' will get the 'c' key from the object {a: {b: {c: 'some-text'}}}.
 * or
 * **filter** - (function(text, data))	Filters the data array. It should return true if the 'data' should be listed while the passed 'text' is inputted in the field.
 * **formatMatch** - (function(text, data, i)) This function should return the text that will be matched with the current inputted text into the field.
 * **formatItem** - (function(text, data)) The return of this function will be applied to the 'html' of the li's into the list.
* **fieldOptions** - (object) The options that are gonna be applied to the field element.
 * **classes** - (object) Defines the classes that are applied to the field element you pass as first parameter to the Meio.Autocomplete constructor.
  * **loading** - (string: defaults to 'ma-loading') Applied to the field when there is an Ajax call being made
  * **selected** - (string: defaults to 'ma-selected') Applied to the field when there is a selected value
* **listOptions** - (object) The options that are gonna be applied to the list element.
 * **width** - (mixed: defaults to 'field') Defines the width of the list. If 'field', the list will have the same width as the field. It's possible to pass any other value settable by set('width', value).
 * **container** - (string: defaults to 'body') CSS selector representing the element that the list is going to be inserted into.
 * **classes** - (object) Defines the classes that are applied to the list element.
  * **container** - (string: defaults to 'ma-container') Applied to the container of the list.
  * **hover** - (string: defaults to 'ma-hover') Applied to the focused 'li'.
  * **odd** - (string: defaults to 'ma-odd') Applied to the odd "li's".
  * **even** - (string: defaults to 'ma-even') Applied to the even "li's".
* **requestOptions** - (object) The options that are gonna be applied to the Request.JSON instance (when using the Autocomplete with Ajax).
 * **formatResponse** - (function: defaults function(jsonResponse){return jsonResponse;}) This function should return the array of autocomplete data from your jsonResponse.
 * **noCache** - (boolean: defaults to true) The noCache option is setted by default to avoid cache problem on ie
 * You can also pass any of the Request.JSON options. http://mootools.net/docs/core/Request/Request.JSON
* **urlOptions** - (object) The options that are gonna be applied to the URL instance.
 * **queryVarName** - (string: defaults to 'q') The name of the variable that's going to the server with the query value inputed by the user.
 * **extraParams** - (mixed: defaults to null) Can be an array of elements or objects with 'name' and 'value' keys. 'value' can be a function. Ex: if you pass [{'name': 'x', 'value': function(){ return 2; }}] the url generated to get the list of options will have the 'x' parameter with value '2'. If it is an element or an object which its 'value' is a function, the value passed to the URL will be retrieved at the time the plugin makes the Ajax request.
 * **max** - (number: defaults to 20) The max number of options that should be listed. This will be sent to the Ajax request as the 'limit' parameter.

#### Events:

##### onNoItemToList

Fires onkeypress while there are no options to list.

###### Arguments:

* **elements** - (object) An object with the 'field' and 'list' instances.

##### onSelect

Fires when you select an autocomplete option.

###### Arguments:

* **elements** - (object) An object with the 'field' and 'list' instances.
* **value** - (mixed) The object that represents the option that has been selected.

##### onDeselect

###### Arguments:

* **elements** - (object) An object with the 'field' and 'list' instances.

### Class: Meio.Autocomplete.Select

This class does exactly what Meio.Autocomplete does plus it can easy act as a DOM select element,
putting the 'value' attribute of it's options into a form field (which will be called valueField).
It can synchronize its value with the valueField ondomready of the page, working perfectly when
the field comes pre-filled with a text value (like on an edit form).

#### Extends:

Meio.Autocomplete

#### Syntax:

    var mySelectAutocomplete = new Meio.Autocomplete.Select(element, data [, options]);

#### Arguments:

* **element** - (mixed) A string ID of the Element or an Element to apply the Meio.Autocomplete.Select List to.
* **data** - (mixed) An array of objects or a url to a page that will respond with a json object that will be converted to an array of objects.
* **options** - (object, optional) The Meio.Autocomplete.Select options object

#### Options:
* **syncName** - (mixed: defaults to 'id') Defines the parameter that will contain the unique identifier of the option that is selected at that moment (ondomready). If falsy it wont synchronize the value.
* **valueField** - (mixed: defaults to null) A string ID of the Element or an Element that will receive the unique identifier of the selected option. This is the field that will be used on your server-side so be sure it has the correct name attribute.
* **valueFilter** - (function: defaults to function(data){ return data.id; }) This function should return the unique identifier of the 'data' object.


Demos
-----

### Meio.Autocomplete.Select with a local Array

http://jsfiddle.net/fabiomcosta/eZpuL/1229/embedded/result,js,html,css/

### Meio.Autocomplete.Select with a URL (It will make Ajax requests to the passed URL)

http://jsfiddle.net/fabiomcosta/rrBnB/31/embedded/result,js,html,css

### Meio.Autocomplete.Select with a local Array and using [accent folding](http://www.alistapart.com/articles/accent-folding-for-auto-complete/)

http://jsfiddle.net/fabiomcosta/FP9FA/10/embedded/result,js,html,css/

### Meio.Autocomplete.Select.One

http://jsfiddle.net/fabiomcosta/EC5D2/13/embedded/result,js,html,css/

### Meio.Autocomplete.Select with the same Meio.Element.List instance

http://jsfiddle.net/fabiomcosta/wz84W/7/embedded/result,js,html,css/


Credits
-------

Inspiration and some ideas came from:

* Digitarald's Autocompleter (http://digitarald.de/project/autocompleter/);
* jQuery's Autocomplete (http://docs.jquery.com/Plugins/Autocomplete).


Changelog
---------

##### 2.0
* This is basically the same as 1.0 but with full support for Mootools 1.3 and greater.

##### 1.0
* This is basically the same as 0.8.5 (with some code cleanups). The 1.x and before series support Mootools 1.2.x version. Meio.Autocomplete 2.x and greater support Mootools 1.3.

##### 0.8.5
* FIX: Fixed the select bug while synchronizing the value from the input that has the id with the text input on the Meio.Autocomplete.Select class;
* Small code improvements.

##### 0.84
* NEW: Adding the queryVarName option for the urlOptions, now it's possible to choose the name of the variable that stores the inputed query.
* NEW: Adding formatResponse option as a requestOptions. Redefine it if the array of autocomplete data is inside a key from your response. It receives as first parameter the jsonResponse and should return the array of autocomplete data.
* FIX: the value doesn't become empty while synchronizing the values at start anymore on Meio.Autocomplete.Select (and the Classes that inherit from it).

##### 0.83
* CHANGED: listInstance is not an option anymore, it's now the last parameter (after the options). See the new demo.
* FIX: the global cache uses safer keys now.
* FIX: rare error on page unload.

##### 0.82
* NEW: now there's the Meio.Autocomplete.Select.One Class that will replace a select element with an autocomplete field that will have the same options as the select, just removing the ones that have empty values.
* FIX: The list classes are now being correctly applied.
* FIX: The valueField option was not accepting an ID, just an element. Now it accepts both.
* Created this documentation.

##### 0.81
* Initial release


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
