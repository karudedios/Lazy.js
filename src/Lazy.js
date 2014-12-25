function Lazy(arg, debugMode) {
	var $this = this;
	$this.__stack__ = { fn : [] };
	$this.__order__ = [];

	$this.__clear__ = function () {
		$this.__stack__ = { fn : [] };
		$this.__order__ = [];
		return this;
	};
	$this.__add__ = function(Function)
	{
		if (debugMode) $this.Print("Stacking clause");
		return $this.__stack__.fn.push(Function);
	}
	$this.Print = function (x) {
		return console.log(x);
	}

	$this.__verify__ = function (collection) {
		if (!collection || !collection.length)
			return false;
		return true;
	};

	var object = {
		add: function Add(fn) {
			$this.__order__.push('ADD');
			$this.__add__(fn);
			return this;
		},
		stack: function Stack(functions) {
						for (var i = 0; i < functions.length; i++)
				$this.__add__(functions[i]);
			return this;
		},
		where: function Where(condition) {
			$this.__order__.push('WHERE');
			$this.__add__(function Filter(collection) { return collection.filter(condition); });
			return this;
		},
		get: function Get(condition) {
			$this.__order__.push('GET');
			$this.__add__(function Select(collection) { return collection.map(condition); });
			return this;
		},
		first: function First(condition) {
			$this.__order__.push('FIRST');
			var reduceCondition = condition || (function (x, i) { if (i == 0) return true; });
			$this.__add__(function SelectFirst(collection) { return collection.filter(reduceCondition).pop() });
			return this;
		},
		invoke: function Invoke() {
			var result = arg;
			var ellapsedTime = 0;
			if (debugMode) $this.Print(result);

			for (var i = 0; i < $this.__order__.length; i++) {
				if ($this.__verify__(result)) {
					if (!$this.__stack__.fn[i]){
						continue;
					}

					result = $this.__stack__.fn[i].call(null, result);
					if (debugMode) $this.Print(result);
				} else {
					var clause = $this.__order__[i];
					var method = $this.__stack__.fn[i];
					var message = "Argument must be a collection\n";
					message += "Exception ocurred at Invoke for value ";
					message += result;
					message += "\nWhile executing\n"
					message += clause;
					message += " at ";
					message += method;
					throw message;
				}
			}

			if (result) {
				var Invoker = this;
				result.Invoker = function Invoker() { return new Lazy(result, debugMode); };
			}
			return result;
		}
	}
};