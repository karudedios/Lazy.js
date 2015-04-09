var Lazy = require('./../src/Lazy.js').Lazy

function exactEquality(arr1, arr2) {
	return (arr1 + '') == (arr2 + '');
};

describe("Lazy", function() {
	var lazy, strLazy;
	var DefaultData = [1, 2, 3, 4, 5, 6, 7]
		, DefaultStr = "This is a String";
	
	beforeEach(function() {
		lazy = new Lazy(DefaultData);
		strLazy = new Lazy(DefaultStr);
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
		expect(+result.length).toBeFalsy();
		expect(+result.invoke().length).toBeTruthy();
	});

	it("should have an 'invoker' on return if object is not 'single'", function() {
		expect(lazy.invoke().invoker()).toBeTruthy();
	});

	it("should allow to Lazyfy a collection", function () {
		var data = lazy.first();
		var lazyd = DefaultData.toLazy().first();
		expect(data.invoke()).toEqual(lazyd.invoke());
	});

	it("should work with strings", function (){
		var result = strLazy.add(function (x) { return x.toUpperCase() }).invoke();
		expect(DefaultStr.toUpperCase() == result).toBeTruthy();
	});

	it("should take as specified", function () {
		var data = DefaultData.filter(function (x) { return x <= 5 });
		var result = lazy.take(5).invoke();
		var takeFive = exactEquality(data, result);
		expect(takeFive).toBeTruthy();
	});

	it("should skip as specified", function () {
		var data = DefaultData.filter(function (x) { return x > 5 });
		var result = lazy.skip(5).invoke();
		var equals = exactEquality(data, result);
		expect(equals).toBeTruthy();
	});

	it("should be able to mix skip and take", function () {
		var data = DefaultData.splice(4, 3).splice(0, 2);
		var result = lazy.skip(4).take(2).invoke();
		var equals = exactEquality(data, result);
		expect(equals).toBeTruthy();
	});

	it("should not have reference to the collection, but a deep copy", function(){
		var data = DefaultData.splice(7, 0);
		var result = lazy.skip(7).invoke();
		var equals = exactEquality(data, result);
		expect(equals).toBeTruthy();
	});

	it("should not allow anything but collections and strings", function() {
		var invalid1 = 1;
		var invalidObject = {0:0, 1:1};
		var validCollection = [{ 0:0 }, { 1:1 }];
		
		expect(new Lazy(invalid1).invoke()).toBeFalsy();
		expect(new Lazy(invalidObject).invoke()).toBeFalsy();
		expect(new Lazy(validCollection).invoke()).toBeTruthy();
	});
});