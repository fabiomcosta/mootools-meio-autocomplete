describe('Meio.Autocomplete.Cache', function() {
    describe('initialized with default options', function() {
        beforeEach(function() {
            this.cache = new Meio.Autocomplete.Cache();
        });

        it('should initialize empty', function(){
            expect(this.cache.getLength()).toEqual(0);
        });
    });

    describe('initialized with maxLength 2', function() {
        beforeEach(function() {
            this.cache = new Meio.Autocomplete.Cache(2);
        });

        it('should remove the last item if included more than the defined maxlength', function() {
            this.cache.set('a', 1);
            expect(this.cache.getLength()).toEqual(1);
            this.cache.set('b', 2);
            this.cache.set('c', 3);
            expect(this.cache.getLength()).toEqual(2);
            expect(this.cache.get('a')).toBeNull();
            expect(this.cache.has('a')).toEqual(false);
            expect(this.cache.has('b')).toEqual(true);
            expect(this.cache.get('c')).toEqual(3);
        });

        describe('the refresh method', function() {
            beforeEach(function() {
                this.cache.get('a', 3);
                this.cache.refresh();
            });
            it('should clean both the cache object and the pos array', function() {
                expect(this.cache.pos).toEqual([]);
                expect(this.cache.cache).toEqual({});
            });
        });

        describe('the setMaxLength method', function() {
            beforeEach(function() {
                this.cache.setMaxLength(1);
                this.cache.set('a', 3);
                this.cache.set('b', 3);
            });
            it('should obey its maxLength restriction', function() {
                expect(this.cache.getLength()).toBe(1);
            });
        });

    });
});

describe('Meio.Autocomplete.FakeCache', function() {
    beforeEach(function() {
        this.cache = new Meio.Autocomplete.FakeCache();
    });

    it('should initialize empty', function(){
        expect(this.cache.getLength()).toEqual(0);
    });

    it('should never cache anything', function(){
        this.cache.set('c', 3);
        expect('c' in this.cache.cache).toBeFalsy();
    });

    it('should always return itself on set', function() {
        expect(this.cache.set('a')).toBe(this.cache);
    });

    it('should always return null on get', function() {
        this.cache.set('a', 3);
        expect(this.cache.get('a')).toBe(null);
    });
});
