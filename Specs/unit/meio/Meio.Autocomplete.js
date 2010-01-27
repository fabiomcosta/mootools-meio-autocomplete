
var form, inputText, iframe;

describe('Event.Changed', function(){
	
	beforeEach(function(){
		iframe = document.getElementById('iframe');
		form = $(iframe.contentDocument.getElementById('form'));
		inputText = $(iframe.contentDocument.getElementById('input_text'));
	});
	
	it('should fire the changed event before the form is submited', function(){
		inputText.addEvent('changed', function(){
			inputText.set('value', 'changed');
		});
		iframe.addEvent('load', function(){
			var window = this.contentWindow;
			if(window.location.search){
				console.log(window.location.search.match(/^\?input_text=(.*)$/)[1] == 'changed');
			}
		});
		
		inputText.focus();
		inputText.set('value', 'test');
		form.fireEvent('submit').submit();
	});

});
	