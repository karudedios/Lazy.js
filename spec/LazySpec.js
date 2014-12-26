try {
	var fs = require('fs');
	eval(fs.readFileSync('../src/Lazy.js') + '');
} catch (e) {
	console.error(e);
};

function exactEquality(arr1, arr2) {
	return (arr1 + '') == (arr2 + '');
};

describe("Lazy", function() {
	var lazy;
	var DefaultData = [1, 2, 3, 4, 5, 6, 7];
	
	beforeEach(function() {
		lazy = new Lazy(DefaultData);
	});

	it("should return the same collection if invoked without any specification", function(){
		var list = DefaultData;
		var resultList = lazy.invoke();
		var allExist = exactEquality(list, resultList);

		expect(allExist).toBeTruthy();
	});

	it("should get the data transformed the way it's specified", function() {
		var list = DefaultData.map(function(x) { return x * 2 });
		var resultList = lazy.get(function (x) { return x * 2 }).invoke();
		var allExist = exactEquality(list, resultList);

		expect(allExist).toBeTruthy();
	});

	it("should filter as specified", function(){
		var list = DefaultData.filter(function (x) { return x == 5 || x == 7 });
		var resultList = lazy.where(function (x) { return x == 5 || x == 7 }).invoke();
		var allExist = exactEquality(list, resultList);

		expect(allExist).toBeTruthy();
	});

	it("should return first item if .first has no specified matching criteria", function() {
		var result = lazy.first().invoke();
		expect(result).toEqual(1);
	});

	it("should return first item matching the specified criteria", function () {
		var result = lazy.first(function (x) { return x > 3 && x < 5 }).invoke();
		expect(result).toEqual(4);
	});

	it("should have no difference between one stack and several add", function() {
		var result =
		lazy
			.add(function (x) { return x + 1 })
			.add(function (x) { return x + 2 })
			.invoke();
		var result2 =
		lazy
			.stack(
				[function (x) { return x + 1},
				 function (x) { return x + 2 }])
			.invoke();

		var equals = (result == result2);
		expect(equals).toBeTruthy();
	});

	it("should invoke itself if requested without explicit invoke when comparing", function() {
		var number = 6;
		var result = lazy.first(function (x) { return x == 6; });
		var equals = (number == result);

		expect(equals).toBeTruthy();
		expect(result - number).toEqual(0);
		expect(result + number).toEqual(12);
	});

	it("should require explicit invoke when working with collections", function() {
		var result = lazy;
		expect(result.length + 1).toBeFalsy();
		expect(result.invoke().length + 	1).toBeTruthy();
	});

	it("should have an 'invoker' on return if object is not 'single'", function() {
		expect(lazy.invoke().invoker()).toBeTruthy();
	});

	it("should allow to Lazyfy a collection", function () {
		var data = lazy.first();
		var lazyd = DefaultData.toLazy().first();
		expect(data.invoke()).toEqual(lazyd.invoke());
	});
});