
describe('Meio.Autocomplete.Data.Request.URL', function(){
    beforeEach(function() {
        this.url = new Meio.Autocomplete.Data.Request.URL('/url/', {
            max: 10, extraParams: {name: 'a', value: 1}});
    });

    it('should initialize a crude url', function(){
        expect(this.url.url).toContain('limit=1');
        expect(this.url.url).toContain('a=1');
    });

    it('should change the value of the url accoring to the dinamic extra params passed', function() {
        var input = new Element('input', {name: 'input', value: 5});
        var i = 0;
        this.url = new Meio.Autocomplete.Data.Request.URL('/url/', {
            max: 16,
            extraParams: [
                {name: 'a', value: 1},
                {name: 'i', value: function() { return ++i; }},
                input
            ]
        });
        expect(this.url.url).toNotContain('i=1');
        expect(this.url.url).toNotContain('input=5');
        expect(this.url.evaluate()).toContain('i=1');
        expect(this.url.evaluate()).toContain('i=2');
        expect(this.url.evaluate()).toContain('input=5');
        input.set('value', 20);
        expect(this.url.evaluate()).toContain('input=20');
        expect(this.url.evaluate()).toContain('limit=16');
    });

    it('should just include the q parameter', function(){
        this.url = new Meio.Autocomplete.Data.Request.URL('/url/', {max: null});
        expect(this.url.url).toNotContain('undefined');
        expect(this.url.evaluate()).toContain('q=');
        expect(this.url.evaluate()).toNotContain('&');
    });

});

