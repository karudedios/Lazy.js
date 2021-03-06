Array.prototype.toLazy = function() { return new Lazy(this); }

Array.prototype.where     = function(condition) { return this.toLazy().where(condition); }
Array.prototype.select    = function(condition) { return this.toLazy().select(condition); }
Array.prototype.selectMany= function(condition) { return this.toLazy().selectMany(condition); }
Array.prototype.first     = function(condition) { return this.toLazy().first(condition); }
Array.prototype.last      = function(condition) { return this.toLazy().last(condition); }
Array.prototype.min       = function(condition) { return this.toLazy().min(condition); }
Array.prototype.max       = function(condition) { return this.toLazy().max(condition); }
Array.prototype.sum       = function(condition) { return this.toLazy().sum(condition); }
Array.prototype.avg       = function(condition) { return this.toLazy().avg(condition); }

Array.prototype.take      = function(quantity)  { return this.toLazy().take(quantity); }
Array.prototype.skip      = function(quantity)  { return this.toLazy().skip(quantity); }

Array.prototype.union     = function(collection){ return this.toLazy().union(collection); }

Array.prototype.orderBy   = function(fn, order) { return this.toLazy().orderBy(fn, order); }
Array.prototype.distinct  = function(fn)        { return this.toLazy().distinct(fn); }
Array.prototype.groupBy   = function(fn)        { return this.toLazy().groupBy(fn); }

Array.prototype.append    = function(item)      { return this.concat([item]); }

/**
 * Enables lazy evaluation of a collection
 * @param {Array} arg         The initial array for the initialization
 * @param {Bool} debugMode    Flag to enable loggin
 * @param {Function}          currentStack The stack that is going to be called when invoked
 * @return {Lazy} A Lazy object
 */
function Lazy(arg, debugMode, stack) {
  if (!(this instanceof Lazy)) throw "Sorry bro, you gotta 'instantiate' this, and I won't do it for you";
  if (!(arg instanceof Array)) throw "Argument must be a collection";
  arg = arg.slice();
  var defaultFn = function(x) { return x; };

  /**
   * Transform lambda string into a function's body
   * @param {String}     lambda  The Lamda String / Function
   * @return {Function}          The generated function or NULL if not string nor function
   * @example
   * GetLambdaOrFunction("x => x + 10") ==> function(x) { return x + 10; }
   */
  function GetLambdaOrFunction(lambda) {
    if (lambda instanceof Function) return lambda;
    if (typeof lambda != "string") return defaultFn;

    var combinations = lambda.match(/\(?([^\)=]*)\)? ?=> ?(.*)/);
    if (combinations && combinations[1]) {
      var vars = combinations[1].split(",");
      var action = combinations[2].replace(vars[0] && (new RegExp(vars[0].trim(), "g")) || null, "$value").replace(vars[1] && (new RegExp(vars[1], "g")) || null, "$index");

      return function($value, $index) {
        return eval("(".concat(action).concat(")"));
      }
    } else {
      throw "Invalid lambda";
    }
  }

  /**
   * Function created to stack from first to last function
   * in order to have a single call and save some memory
   * @param  {Function} fn    The function that's going to be added to the queue
   * @param  {Function} stack The current function queue
   * @return {Function}       The new function queue
   * @example // With ES6 to write less code
   * var extended = extendFunction(x => x + 2)
   * var reExtended = extendFunction(x => x - 2, extended)
   * var reReExtended = extendFunction(x => x + 4, reExtended)
   * extended(0) ==> 2 // Because 0 + 2 == 2
   * reExtended(2) ==> 0 // Because (0 + 2) - 2 == 0
   * reReExtended(2) ==> 4 // Because ((0 + 2) - 2) + 4 == 4
   */
  function extendFunction (fn, stack) {
    return function() {
      try {
        return stack && fn.call(this, stack.apply(this, [].slice.call(arguments, 0)))
            || fn.apply(this, [].slice.call(arguments, 0));        
      } catch(e) {
        throw ("Error while executing: " + fn.name + "\nError: " + e + "\nData:" + [].slice.call(arguments, 0));
      }
    }
  }

  /**
   * Clause used to filter collection
   * @param  {Function} condition Function from which the filter will be applied
   * @return {Lazy}               New instance of Lazy with the new stack
   */
  this.where = function Where(condition) {
    var whereFn = function Where(collection) { return collection.filter(GetLambdaOrFunction(condition)); };
    return new Lazy(arg, debugMode, extendFunction(whereFn, stack))
  };

  /**
   * Clause to transform the collection
   * @param  {Function} condition Function from which the transformation will be applied
   * @return {Lazy}               New instance of Lazy with the new stack
   */
  this.select = function Select(condition) {
    var selectFn = function Select(collection) { return collection.map(GetLambdaOrFunction(condition)); };
    return new Lazy(arg, debugMode, extendFunction(selectFn, stack));
  };

  /**
   * Clause to select collections out of a collection
   * @param  {Function} condition  Function from which the selection will be applied
   * @return {Lazy}               New instance of lazy with the new stack
   */
  this.selectMany = function SelectMany(condition) {
    var selectManyFn = function SelectMany(collection) { return [].concat.apply([], collection.map(GetLambdaOrFunction(condition))); };
    return new Lazy(arg, debugMode, extendFunction(selectManyFn, stack));
  }

  /**
   * Clause to pick n records
   * @param  {Integer} quantity Number of records to take
   * @return {Lazy}              New instance of Lazy with new stack
   */
  this.take = function Take(quantity) {
    var takeFn = function Take(collection) { return collection.slice(0, quantity); };
    return new Lazy(arg, debugMode, extendFunction(takeFn, stack));
  };

  /**
   * Clause to skip n records
   * @param  {Integer} quantity Number of records to skip
   * @return {Lazy}              New instance of Lazy with new stack
   */
  this.skip = function Skip(quantity) {
    var skipFn = function Skip(collection) { return collection.slice(quantity); };
    return new Lazy(arg, debugMode, extendFunction(skipFn, stack));
  };

  /**
   * Clause to pick first element that matches the specified criteria**
   * @param  {Function} condition Criteria to match
   * @return {Object}             First result of evaluating every clause
   * 
   * ** If null, will return first element in collection
   */
  this.first = function First(condition) {
    condition = condition || (function (_, i) { return i == 0; });

    var firstFn = function First(collection) { return collection.filter(GetLambdaOrFunction(condition)).shift(); };
    return new Lazy(arg, debugMode, extendFunction(firstFn, stack)).invoke();
  };

  /**
   * Clause to pick last element that matches the specified criteria**
   * @param  {Function} condition Criteria to match
   * @return {Object}              Last result of evaluating every clause
   *
   * ** If null, will return last element in collection
   */
  this.last = function Last(condition) {
    var condition = condition || (function (_, i, arr) { return i == arr.length - 1; });

    var lastFn = function Last(collection) { return collection.filter(GetLambdaOrFunction(condition)).pop(); };
    return new Lazy(arg, debugMode, extendFunction(lastFn, stack)).invoke();
  };

  /**
   * Clause to merge 2 Lazy collections
   * @param  {Lazy} lazyObject The Lazy object that will be concatenated
   * @return {Lazy}            New instance of Lazy with new stack
   */
  this.concat = function Concat(lazyObject) {
    if (!(lazyObject instanceof Lazy)) throw "Argument must be a Lazy object, for concatenating a non-Lazy object see 'union' or 'push'";
    var concatFn = function Concat(collection) { return collection.concat(lazyObject.invoke()); }
    return new Lazy(arg, debugMode, extendFunction(concatFn, stack));
  };

  /**
   * Clause to push item into collection
   * @param  {Object} item The item to be pushed
   * @return {Lazy}         New instance of Lazy with new stack
   */
  this.push = function Push(item) {
    var pushFn = function Push(collection) { return collection.append(item); };
    return new Lazy(arg, debugMode, extendFunction(pushFn, stack));
  };

  /**
   * Clause to merge a Lazy-collection with a collection
   * @param  {Array} items  The collection that will be merged to current collection
   * @return {Lazy}          New instance of Lazy with new stack
   */
  this.union = function Union(items) {
    if (!(items instanceof Array)) throw "Argument must be a collection";
    var unionFn = function Union(collection) { return collection.concat(items); };
    return new Lazy(arg, debugMode, extendFunction(unionFn, stack));
  };

  /**
   * Clause to order collection based on the specified criteria
   * @param  {Function} fn    Criteria to match
   * @param  {String}          Type Type of sorting 'asc' or 'desc'
   * @return {Lazy}            New instance of Lazy with new stack and ThenBy function**
   *
   * ** Edited a new lazy instance to add thenBy function, so you can
   * ** Order by a then by b. thenBy is non-existent in any other context.
   */
  this.orderBy = function OrderBy(fn, type) {
    var lfn = GetLambdaOrFunction(fn);

    var orderBySortFn = function(a, b) { var fa=lfn(a),fb=lfn(b); return (fa < fb ? -1 : fb < fa ? 1 : 0) * (type == "desc" ? -1 : 1); }
    var orderByFn = function OrderBy(collection) { return collection.sort(orderBySortFn); };

    var r = new Lazy(arg, debugMode, extendFunction(orderByFn, stack));

    /**
     * Clause to order collection based on primary criteria
     * and the secondary criteria specified on this method
     * @param  {Function} func  Second criteria to match
     * @param  {String} order    Type of sorting. 'asc' or 'desc'
     * @return {Lazy}            New instance of Lazy with new stack
     */
    r.thenBy = function ThenBy (func, order) {
      var lfunc = GetLambdaOrFunction(func);

      var thenBySortFn = function(a, b) { var fua=lfunc(a),fub=lfunc(b); return fn(a) == fn(b) ? (fua < fub ? -1 : (fub < fua ? 1 : 0)) * (order == "desc" ? -1 : 1) : orderBySortFn(a, b) }
      var thenByFn = function ThenBy(collection) { return collection.sort(thenBySortFn); };

      return new Lazy(arg, debugMode, extendFunction(thenByFn, stack));
    }

    return r;
  };

  /**
   * Clause to give unique values in a collection
   * @param  {Function} fn  Property from which the distinction will be made
   * @return {Lazy}          New instance of Lazy with new stack
   */
  this.distinct = function Distinct(fn) {
    fn = GetLambdaOrFunction(fn);
    
    var func = function(obj, idx, self) { return self.map(fn).indexOf(fn(obj)) == idx; };
    var distinctFn = function Distinct(collection) { var o = {}, i, l = collection.length, r = []; for(i=0; i<l;i+=1) o[collection[i]] = collection[i]; for(i in o) r.push(o[i]); return r; };
    return new Lazy(arg, debugMode, extendFunction(distinctFn, stack));
  };

  //if (arg && arg.length && arg.every(function(x) { return x === Object(x)}))
  {    
    /**
     * Clause to group collection by a property **
     * @param  {Function} fn  Property from which the grouping will be executed
     * @return {Lazy}          New instance of Lazy with new stack
     *
     * ** Valid for Object-only arrays
     */
    this.groupBy = function GroupBy(fn) {
      fn = GetLambdaOrFunction(fn);
      var groupByFn = function GroupBy(collection) { return r=collection.reduce(function(obj, x) { return obj[fn(x)] = (obj[fn(x)] || []).concat(x), obj; }, {}), Object.keys(r).reduce(function(arr, x) { return arr.concat([r[x]]); }, []); };
      return new Lazy(arg, debugMode, extendFunction(groupByFn, stack));
    }
  };

  /**
   * Clause to get Sum based on the specified criteria
   * @param  {Function} condition Criteria to match
   * @return {Object}              Sum of evaluating every clause by the specified criteria
   */
  this.sum = function Sum(condition) {
    condition = GetLambdaOrFunction(condition);

    var sumFn = function Sum(collection) { return collection.reduce(function (acc, x) { return acc + condition(x); }, 0); }
    return new Lazy(arg, debugMode, extendFunction(sumFn, stack)).invoke();
  };

  /**
   * Clause to get Min based on the specified criteria
   * @param  {Function} condition Criteria to match
   * @return {Object}              Smallest result of evaluating every clause
   */
  this.min = function Min(condition) {
    condition = GetLambdaOrFunction(condition);

    var minFn = function Min(collection) { return condition(collection.first(condition)); };
    return new Lazy(arg, debugMode, extendFunction(minFn, stack)).invoke();
  };

  /**
   * Clause to get Max based on the specified criteria
   * @param  {Function} condition Criteria to match
   * @return {Object}              Biggest result of evaluating every clause
   */
  this.max = function Max(condition) {
    condition = GetLambdaOrFunction(condition);

    var maxFn = function Max(collection) { return condition(collection.last(condition)) };
    return new Lazy(arg, debugMode, extendFunction(maxFn, stack)).invoke();
  };

  /**
   * Clause to get Avg based on the specified criteria
   * @param  {Function} condition  Criteria to match
   * @return {Object}              Average result of evaluating every clause
   */
  this.avg = function Avg(condition) {
    condition = GetLambdaOrFunction(condition);

    var avgFn = function Avg(collection) { return collection.sum(condition) / collection.length; };
    return new Lazy(arg, debugMode, extendFunction(avgFn, stack)).invoke();
  };

  /**
   * Function that calls the stack with the clean array
   * @return {Object} The result of applying every function on the stack
   */
  this.invoke = function Invoke() {
    return (stack || defaultFn)(arg);
  };
};

Lazy.prototype.toString = function () {
  return this.invoke().toString();
}

Lazy.prototype.valueOf = function () {
  return this.toString();
}

/**
 * Function that generates a Lazy array
 * @param {Integer} from  Start of the array
 * @param {Integer} to    End of the array
 * @param {Integer} step  Steps
 * @return {Lazy}         New instance of Lazy with the array generator function as stack
 */
Lazy.Range = function(from, to, step) {
  if (arguments.length == 1) { to = from; from = 0; step=1; }
  if (arguments.length == 2 || step < 1) { step = 1; }

  var rangeFn = function Range(collection) { var r = []; if (from>to) for(;r.push(from -= step), from > to;); else for(;r.push(from += step), from < to;); return r; };
  return new Lazy([], false, rangeFn);
}

module.exports = Lazy;