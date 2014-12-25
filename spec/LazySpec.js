try {
	var fs = require('fs');
	eval(fs.readFileSync('../src/Lazy.js') + '');
}
catch (e) {
	console.error(e); 
}

try {
	function exactEquality(arr1, arr2) {
		var list = arr1.sort();
		var resultList = arr2.sort();

		for (var i = 0; i < (list.length + resultList.length) / 2; i++) {
			if ((list[i] || -1 ) != (resultList[i] || -1))
				return false;
		}

		return true;
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

			expect(allExist).toEqual(true);
		});

		it("should get the data transformed the way it's specified", function() {
			var list = DefaultData.map(function(x) { return x * 2; });
			var resultList = lazy.get(function (x) { return x * 2; }).invoke();
			var allExist = exactEquality(list, resultList);

			expect(allExist).toEqual(true);
		});

		it("should filter as specified", function(){
			var list = DefaultData.filter(function (x) { return x == 5 || x == 7 });
			var resultList = lazy.where(function (x) { return x == 5 || x == 7 }).invoke();
			var allExist = exactEquality(list, resultList);

			expect(allExist).toEqual(true);
		});

		it("should return first item if .first has no specified matching criteria", function() {
			var result = lazy.first().invoke();
			expect(result).toEqual(1);
		});

		it("should return first item matching the specified criteria", function () {
			var result = lazy.first(function (x) { return x > 3 && x < 5; }).invoke();
			expect(result).toEqual(4);
		});

		it("should have no difference between stack and several add", function() {
			lazy = new Lazy("The lazy dog");
			var result =
			lazy
				.add(function (x) { return x.toLowerCase(); })
				.add(function (x) { return x.replace(/[ ]/g, '') })
				.invoke();
			var result2 =
			lazy
				.stack(
					[function (x) { return x.toLowerCase(); },
					 function (x) { return x.replace(/[ ]/g, '') }])
				.invoke();

			var equals = (result == result2);
			expect(equals).toEqual(true);
		});

		it("should invoke itself if requested without explicit invoke", function() {
			var number = 6;
			var result = lazy.first(function (x) { return x == 6; });
			var equals = (number == result);

			expect(equals).toEqual(true);
			expect(result - number).toEqual(0);
			expect(result + number).toEqual(12);
			expect(exactEquality(DefaultData, lazy)).toEqual(true);
		});
	});
}
catch (e) {
	console.error(e);
}