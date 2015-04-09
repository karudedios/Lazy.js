Array.prototype.toLazy = function() {
	return new Lazy(this);
}
Array.prototype.where = function(condition) {
	return this.toLazy().where(condition);
}
Array.prototype.select = function(condition) {
	return this.toLazy().select(condition);
}
Array.prototype.first = function(condition) {
	return this.toLazy().first(condition);
}
Array.prototype.last = function(condition) {
	return this.toLazy().last(condition);
}
Array.prototype.take = function(quantity) {
	return this.toLazy().take(quantity);
}
Array.prototype.skip = function(quantity) {
	return this.toLazy().skip(quantity);
}
Array.prototype.union = function(collection) {
	return this.toLazy().union(collection);
}

function Lazy(arg, debugMode, currentStack) {
	if (!(arg instanceof Array)) throw "Argument must be a collection";

	var stack = currentStack && currentStack.slice() || [];

	var add = function(Function) {
		Print("Stacking clause: " + Function.name);
		stack.push(Function);
		return;
	}

	var Print = function (x) {
		if (debugMode) {
			console.log(x);
		}

		return;
	}

	this.where = function Where(condition) {
		var currStack = stack.slice();

		currStack.push(function Where(collection) { return collection.filter(condition); })
		return new Lazy(arg, debugMode, currStack);
	};

	this.select = function Select(condition) {
		var currStack = stack.slice();

		currStack.push(function Select(collection) { return collection.map(condition); })
		return new Lazy(arg, debugMode, currStack);
	};

	this.take = function Take(quantity) {
		var currStack = stack.slice();

		currStack.push(function Take(collection) { return collection.slice(0, quantity); })
		return new Lazy(arg, debugMode, currStack);
	}

	this.skip = function Skip(quantity) {
		var currStack = stack.slice();

		currStack.push(function Skip(collection) { return collection.slice(quantity); })
		return new Lazy(arg, debugMode, currStack);
	}

	this.first = function First(condition) {
		var currStack = stack.slice();		
		var firstCondition = condition || (function (x, i) { return i == 0; });

		currStack.push(function First(collection) { return collection.filter(firstCondition).shift() })
		return new Lazy(arg, debugMode, currStack).invoke();
	};

	this.last = function Last(condition) {
		var currStack = stack.slice();
		var lastCondition = condition || (function (x, i, arr) { return i == arr.length - 1; });

		currStack.push(function Last(collection) { return collection.filter(lastCondition).pop() })
		return new Lazy(arg, debugMode, currStack).invoke();
	};

	this.push = function Push(item) {
		var currStack = stack.slice();

		currStack.push(function Push(collection) { return collection.concat([item]); });
		return new Lazy(arg, debugMode, currStack);
	}

	this.union = function Union(items) {
		var currStack = stack.slice();

		currStack.push(function Union(collection) { return collection.concat(items); });
		return new Lazy(arg, debugMode, currStack);
	}

	this.invoke = function Invoke() {
		var result = arg && arg.slice();

		Print("Initial value:");
		Print(result);

		while (operation = stack.shift()) {

			if (!result || !result.length) {
				throw ("Ignoring clause: " + operation.name + "\nArgument must be a collection.")
				return null;
			}

			Print("Calling clause: " + operation.name)
			result = operation.call(null, result);
			Print(result);
		}

		return result;
	};
};

Lazy.prototype.toString = function () {
	return this.invoke().toString();
}

Lazy.prototype.valueOf = function () {
	return this.invoke().toString();
}

module.exports = Lazy;
