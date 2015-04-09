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
Array.prototype.distinct = function(fn) {
	return this.toLazy().distinct(fn);
}
Array.prototype.orderBy = function(fn, order) {
	return this.toLazy().orderBy(fn, order);
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

		if (typeof condition == "string") {
			var fn = function Where(collection) { return collection.filter(function(x, i, self) { return eval(condition); }) }
		} else {
			var fn = function Where(collection) { return collection.filter(condition); };
		}

		currStack.push(fn)
		return new Lazy(arg, debugMode, currStack);
	};

	this.select = function Select(condition) {
		var currStack = stack.slice();

		if (typeof condition == "string") {
			var fn = function Select(collection) { return collection.map(function(x, i, self) { return eval(condition); }) }
		} else {
			var fn = function Select(collection) { return collection.map(condition); };
		}

		currStack.push(fn);
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
		var firstCondition = condition || (function (_, i) { return i == 0; });

		if (typeof condition == "string") {
			firstCondition = function(x, i) { return eval(condition); };
		} else if(condition) {
			firstCondition = condition;
		}

		currStack.push(function First(collection) { return collection.filter(firstCondition).shift() })
		return new Lazy(arg, debugMode, currStack).invoke();
	};

	this.last = function Last(condition) {
		var currStack = stack.slice();
		var lastCondition = condition || (function (_, i, arr) { return i == arr.length - 1; });

		if (typeof condition == "string") {
			lastCondition = function(x, i) { return eval(condition); };
		} else if(condition) {
			lastCondition = condition;
		}

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

	this.orderBy = function OrderBy(fn, type) {
		var currStack = stack.slice();
		var orderByFn = function(a, b) { var fa=fn(a),fb=fn(b); return (fa < fb ? -1 : fb < fa ? 1 : 0) * (type == "desc" ? -1 : 1); }

		currStack.push(function OrderBy(collection) { return collection.sort(orderByFn); });

		var r = new Lazy(arg, debugMode, currStack);
		r.thenBy = function ThenBy (func, order) {
			var currStack = stack.slice();

			var thenByFn = function(a, b) {
				var fa=fn(a),fb=fn(b),fua=func(a),fub=func(b);
				return fa == fb
				 	? (fua < fub ? -1 : (fub < fua ? 1 : 0)) * (order == "desc" ? -1 : 1)
				 	: (fa < fb ? -1 : (fb < fa ? 1 : 0)) * (type == "desc" ? -1 : 1)
			  }

			currStack.push(function ThenBy(collection) { return collection.sort(thenByFn); });
			return new Lazy(arg, debugMode, currStack);	
		}

		return r;
	}

	this.distinct = function Distinct(fn) {
		fn = fn || function(x) { return x; }
		var currStack = stack.slice();

		if (typeof fn == "string") {
			var func = function (x, i, self) {
				return self.map(function(y) {
					return eval("y" + (fn && "." + fn))
				}).indexOf(eval("x" + (fn && "." + fn))) == i;
			};
		} else {
			var func = function(obj, idx, self) { return self.map(fn).indexOf(fn(obj)) == idx; };
		}

		currStack.push(function Distinct(collection) { return collection.filter(func); });
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