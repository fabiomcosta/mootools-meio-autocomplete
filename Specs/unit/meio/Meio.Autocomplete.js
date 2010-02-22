
var cache;

describe('Meio.Autocomplete.Cache', function(){
	
	it('should initialize empty', function(){
		cache = new Meio.Autocomplete.Cache();
		expect(cache.getLength()).toEqual(0);
	});
	
	it('should remove the last item if included more than the defined maxlength', function(){
		cache = new Meio.Autocomplete.Cache(2);
		cache.set('a', 1);
		expect(cache.getLength()).toEqual(1);
		cache.set('b', 2);
		cache.set('c', 3);
		expect(cache.getLength()).toEqual(2);
		expect(cache.get('a')).toBeNull();
		expect(cache.has('a')).toEqual(false);
		expect(cache.has('b')).toEqual(true);
		expect(cache.get('c')).toEqual(3);
	});

});


var url;

describe('Meio.Autocomplete.Data.Request.URL', function(){
	
	it('should initialize a crude url', function(){
		url = new Meio.Autocomplete.Data.Request.URL('/url/', {max: 10, extraParams: {name: 'a', value: 1}});
		expect(url.url).toContain('limit=1');
		expect(url.url).toContain('a=1');
	});
	
	it('should change the value of the url accoring to the dinamic extra params passed', function(){
		var input = new Element('input', {'name': 'input', 'value': 5});
		var i = 0;
		url = new Meio.Autocomplete.Data.Request.URL('/url/', {max: 16, extraParams: [
				{name: 'a', value: 1},
				{name: 'i', value: function(){ return ++i; }},
				input
			]
		});
		expect(url.url).toNotContain('i=1');
		expect(url.url).toNotContain('input=5');
		expect(url.evaluate()).toContain('i=1');
		expect(url.evaluate()).toContain('i=2');
		expect(url.evaluate()).toContain('input=5');
		input.set('value', 20);
		expect(url.evaluate()).toContain('input=20');
		expect(url.evaluate()).toContain('limit=16');
	});
	
	it('should just include the q parameter', function(){
		url = new Meio.Autocomplete.Data.Request.URL('/url/', {max: null});
		expect(url.url).toNotContain('undefined');
		expect(url.evaluate()).toContain('q=');
		expect(url.evaluate()).toNotContain('&');
	});

});

