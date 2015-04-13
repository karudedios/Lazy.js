var Lazy = require('./Lazy.js')

function exactEquality(arr1, arr2) {
	return (arr1 + '') == (arr2 + '');
};

describe("Lazy", function() {
	var lazy;
	var DefaultData = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10];
	
	beforeEach(function() {
		lazy = new Lazy(DefaultData);
	});

	it("should return the same collection if invoked without any specification", function(){
		var list = DefaultData;
		var resultList = lazy.invoke();
		var allExist = exactEquality(list, resultList);

		expect(allExist).toBeTruthy();
	});

	it("should select the data transformed the way it's specified", function() {
		var list = DefaultData.map(function(x) { return x * 2 });
		var resultList = lazy.select(function (x) { return x * 2 }).invoke();
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
		var result = lazy.first();
		expect(result).toEqual(1);
	});

	it("should return first item matching the specified criteria", function () {
		var result = lazy.first(function (x) { return x > 3 && x < 5 });
		expect(result).toEqual(4);
	});

	it("should have chain methods", function() {
		var result =
		lazy
			.select(function (x) { return x + 1 })
			.select(function (x) { return x + 2 })
			.where(function(x) { return x < 9; })
			.invoke();

		expect(result + '').toEqual('4,5,6,7,8');
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

	it("should allow to Lazyfy a collection", function () {
		var data = lazy.first();
		var lazyd = DefaultData.toLazy().first();
		expect(data).toEqual(lazyd);
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
		var data = DefaultData.splice(4).splice(0, 2);
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

	it("should not allow anything but collections", function() {
		var invalidNumber = 1;
		var invalidObject = {0:0, 1:1};
		var validCollection = [{ 0:0 }, { 1:1 }];
		var exception = "Argument must be a collection";
		
		expect(function() { return new Lazy(invalidNumber); }).toThrow(exception);
		expect(function() { return new Lazy(invalidObject); }).toThrow(exception);
		expect(new Lazy(validCollection)).toBeTruthy();
	});

	it("should be present in Array.prototype", function() {
		expect(Array.prototype.where).toBeTruthy();		
		expect(Array.prototype.select).toBeTruthy();
		expect(Array.prototype.first).toBeTruthy();
		expect(Array.prototype.last).toBeTruthy();
		expect(Array.prototype.take).toBeTruthy();
		expect(Array.prototype.skip).toBeTruthy();
		expect(Array.prototype.union).toBeTruthy();
		expect(Array.prototype.distinct).toBeTruthy();
		expect(Array.prototype.orderBy).toBeTruthy();
		expect(Array.prototype.groupBy).toBeTruthy();
		expect(Array.prototype.append).toBeTruthy();
	});
});