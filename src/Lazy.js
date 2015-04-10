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
Array.prototype.append = function(item) {
	return this.concat([item]);
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

	var GetLambdaOrFunction = function GetLambdaOrFunction(lambda) {
		if (lambda instanceof Function) return lambda;
		if (typeof lambda != "string") return;

		var combinations = lambda.match(/\(?([^\)]*)\)? ?=> ?(.*)/);
		if (combinations && combinations[1]) {
			var vars = combinations[1].split(",");
			var action = combinations[2].replace(vars[0] && (new RegExp(vars[0].trim(), "g")) || null, "$value").replace(vars[1] && (new RegExp(vars[1], "g")) || null, "$index");

			return function($value, $index) {
				return eval("(" + action + ")");
			}

		} else {
			throw "Invalid lambda";
		}
	}

	this.where = function Where(condition) {
		return new Lazy(arg, debugMode, stack.append(function Where(collection) { return collection.filter(GetLambdaOrFunction(condition)); }));
	};

	this.select = function Select(condition) {
		return new Lazy(arg, debugMode, stack.append(function Select(collection) { return collection.map(GetLambdaOrFunction(condition)); }));
	};

	this.take = function Take(quantity) {
		return new Lazy(arg, debugMode, stack.append(function Take(collection) { return collection.slice(0, quantity); }));
	}

	this.skip = function Skip(quantity) {
		return new Lazy(arg, debugMode, stack.append(function Skip(collection) { return collection.slice(quantity); }));
	}

	this.first = function First(condition) {
		condition = condition || (function (_, i) { return i == 0; });
		return new Lazy(arg, debugMode, stack.append(function First(collection) { return collection.filter(GetLambdaOrFunction(condition)).shift(); })).invoke();
	};

	this.last = function Last(condition) {
		var condition = condition || (function (_, i, arr) { return i == arr.length - 1; });
		return new Lazy(arg, debugMode, stack.append(function Last(collection) { return collection.filter(GetLambdaOrFunction(condition)).pop(); })).invoke();
	};

	this.push = function Push(item) {
		return new Lazy(arg, debugMode, stack.append(function Push(collection) { return collection.concat([item]); }));
	}

	this.union = function Union(items) {
		return new Lazy(arg, debugMode, stack.append(function Union(collection) { return collection.concat(items); }));
	}

	this.orderBy = function OrderBy(fn, type) {
		var lfn = GetLambdaOrFunction(fn);
		var orderByFn = function(a, b) { var fa=lfn(a),fb=lfn(b); return (fa < fb ? -1 : fb < fa ? 1 : 0) * (type == "desc" ? -1 : 1); }
		var r = new Lazy(arg, debugMode, stack.append(function OrderBy(collection) { return collection.sort(orderByFn); }));

		r.thenBy = function ThenBy (func, order) {
			var lfunc = GetLambdaOrFunction(func);
			var thenByFn = function(a, b) {
				var fa=lfn(a),fb=lfn(b),fua=lfunc(a),fub=lfunc(b);
				return fa == fb
				 	? (fua < fub ? -1 : (fub < fua ? 1 : 0)) * (order == "desc" ? -1 : 1)
				 	: (fa < fb ? -1 : (fb < fa ? 1 : 0)) * (type == "desc" ? -1 : 1)
			  }

			return new Lazy(arg, debugMode, stack.append(function ThenBy(collection) { return collection.sort(thenByFn); }));
		}

		return r;
	}

	this.distinct = function Distinct(fn) {
		fn = GetLambdaOrFunction(fn) || function(x) { return x; }
		
		var func = function(obj, idx, self) { return self.map(fn).indexOf(fn(obj)) == idx; };
		return new Lazy(arg, debugMode, stack.append(function Distinct(collection) { return collection.filter(func); }));
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