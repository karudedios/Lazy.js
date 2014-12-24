describe("Lazy", function() {
	var lazy;
	
  beforeEach(function() {
    lazy = new Lazy([1, 2, 3, 4, 5, 6, 7]);
  });

	it("Should return the same collection if invoked without any specification", function(){
		expect([1, 2, 3, 4, 5, 6, 7]).toEqual(lazy.Invoke());
	});
});