/*! arraylist.js v2.0.0-beta.3 | @license MIT | ygoe.de */
/* build-dir(build) */

// Copyright (c) 2021-2023, Yves Goergen, https://ygoe.de
// All rights reserved.
//
// Redistribution and use in source and binary forms, with or without modification, are permitted
// provided that the following conditions are met:
//
// * Redistributions of source code must retain the above copyright notice, this list of conditions
//   and the following disclaimer.
// * Redistributions in binary form must reproduce the above copyright notice, this list of
//   conditions and the following disclaimer in the documentation and/or other materials provided
//   with the distribution.
//
// THIS SOFTWARE IS PROVIDED BY THE COPYRIGHT HOLDERS AND CONTRIBUTORS "AS IS" AND ANY EXPRESS OR
// IMPLIED WARRANTIES, INCLUDING, BUT NOT LIMITED TO, THE IMPLIED WARRANTIES OF MERCHANTABILITY AND
// FITNESS FOR A PARTICULAR PURPOSE ARE DISCLAIMED. IN NO EVENT SHALL THE COPYRIGHT HOLDER OR
// CONTRIBUTORS BE LIABLE FOR ANY DIRECT, INDIRECT, INCIDENTAL, SPECIAL, EXEMPLARY, OR
// CONSEQUENTIAL DAMAGES (INCLUDING, BUT NOT LIMITED TO, PROCUREMENT OF SUBSTITUTE GOODS OR
// SERVICES; LOSS OF USE, DATA, OR PROFITS; OR BUSINESS INTERRUPTION) HOWEVER CAUSED AND ON ANY
// THEORY OF LIABILITY, WHETHER IN CONTRACT, STRICT LIABILITY, OR TORT (INCLUDING NEGLIGENCE OR
// OTHERWISE) ARISING IN ANY WAY OUT OF THE USE OF THIS SOFTWARE, EVEN IF ADVISED OF THE
// POSSIBILITY OF SUCH DAMAGE.

(function (undefined) {
	"use strict";

	// Shorter names for minified code
	const object_defineProperty = Object.defineProperty;


	// ==================== Constructor ====================

	// The ArrayList class implements a comfortable array collection. It uses a JavaScript Array as its
	// internal storage and provides a public interface inspired by .NET's List and Enumerable types
	// with a few more methods of JavaScript's Array and others.
	//
	// Most of these methods are implemented independently from each other so they can also be copied
	// into other applications and libraries individually.
	//
	// array:
	//   (Array) The base array to wrap. If unset, a new array is created.
	//   (Iterable) A new array is created from the iterable items.
	//   (Number) If an integer number, the new array length is set.
	function ArrayList(array) {
		// Shorter names for minified code
		const arguments_length = arguments.length;

		// Allow calling without "new" keyword
		// NOTE: new.target cannot be used, it does something else and breaks everything.
		if (!(this instanceof ArrayList)) {
			if (arguments_length === 0)
				return new ArrayList();
			else
				return new ArrayList(array);
		}

		if (arguments_length === 0) {
			// Create new array if none was passed
			array = [];
		}
		else if (Number.isInteger(array)) {
			// Set array capacity
			array = new Array(array);   // sets the length, not an item
		}
		else if (!Array.isArray(array)) {
			// Convert specified collection to a new array if it wasn't one
			// NOTE: This will silently create a copy and not wrap the original Array object!
			// That can be discovered by comparing this.array with the passed argument.
			array = Array.from(array);
		}

		// Make the internal array accessible for object methods and users in a reliable way
		object_defineProperty(this, "array", {
			value: array,
			enumerable: true
			// writable defaults to false
		});

		// Allow object identification in Firefox (Chrome already shows the object type in devtools)
		//this._L = true;
	}

	// Shorter names for minified code
	const ArrayList_prototype = ArrayList.prototype;
	const Array_prototype = Array.prototype;

	// Version identification
	ArrayList.version = "2.0.0-beta.3";


	// ==================== Array extensions and general methods ====================

	// Define the L property for Array to provide access to the additional features
	object_defineProperty(Array_prototype, "L", {
		get: function () {
			return new ArrayList(this);
		}
	});

	// Pass through toString (has no effect on the devtools console)
	ArrayList_prototype.toString = function () {
		return this.array.toString();
	};

	// Allow JSON serialisation like with a regular Array
	ArrayList_prototype.toJSON = function () {
		return this.array;
	};

	// Define iterator to support for/of loops over the array (for/in cannot be customised)
	ArrayList_prototype[Symbol.iterator] = function () {
		const array = this.array;
		let position = -1;
		let isDone = false;
		return {
			next: () => {
				position++;
				if (position >= array.length)
					isDone = true;
				return { done: isDone, value: array[position] };
			}
		};
	};


	// ==================== Static functions ====================

	// Creates an array that contains count numbers from start, with the specified step.
	ArrayList.range = function (start, count, step) {
		requireInteger(start, "start");
		requireInteger(count, 0, "count");
		if (step === undefined)
			step = 1;
		else if (step === 0)
			throw new RangeError("Value for step must not be 0.");
		else
			requireInteger(step, "step");
		const array = [];
		for (let i = 0; i < count; i++) {
			array.push(start);
			start += step;
		}
		return new ArrayList(array);
	};


	// ==================== Properties ====================

	// Gets the number of items in the array.
	// See also: Array.length
	object_defineProperty(ArrayList_prototype, "length", {
		get: function () {
			return this.array.length;
		}
	});

	// Gets the first item of the array.
	// This is an alternative to: ArrayList.array[0]
	object_defineProperty(ArrayList_prototype, "first", {
		get: function () {
			return this.array[0];
		},
		set: function (value) {
			this.array[0] = value;
		}
	});

	// Gets the second item of the array.
	// This is an alternative to: ArrayList.array[1]
	object_defineProperty(ArrayList_prototype, "second", {
		get: function () {
			return this.array[1];
		},
		set: function (value) {
			this.array[1] = value;
		}
	});

	// Gets the last item of the array.
	// This is an alternative to: ArrayList.array[ArrayList.length - 1] or ArrayList.get(-1)
	object_defineProperty(ArrayList_prototype, "last", {
		get: function () {
			return this.array[this.length - 1];
		},
		set: function (value) {
			if (!this.length)
				throw new Error("Array is empty.");
			this.array[this.length - 1] = value;
		}
	});


	// ==================== Item retrieval methods ====================

	// Applies an accumulator function over the array.
	// See also: Array.reduce()
	ArrayList_prototype.aggregate = function (initialValue, reducer) {
		if (arguments.length === 1) {
			if (this.length === 0)
				return undefined;
			return this.array.reduce(initialValue);   // arg is actually the reducer
		}
		return this.array.reduce(reducer, initialValue);
	};

	// Applies an accumulator function over the array in reversed order.
	// See also: Array.reduceRight()
	ArrayList_prototype.aggregateReversed = function (initialValue, reducer) {
		if (arguments.length === 1) {
			if (this.length === 0)
				return undefined;
			return this.array.reduceRight(initialValue);   // arg is actually the reducer
		}
		return this.array.reduceRight(reducer, initialValue);
	};

	// Determines whether all items in the array satisfy a condition.
	// See also: Array.every()
	ArrayList_prototype.all = function (predicate, thisArg) {
		return this.array.every(predicate, thisArg);
	};

	// Determines whether any item in the array satisfy a condition.
	// See also: Array.some()
	ArrayList_prototype.any = function (predicate, thisArg) {
		if (!predicate)
			return this.length > 0;
		return this.array.some(predicate, thisArg);
	};

	// Computes the average value of items in the array.
	ArrayList_prototype.average = function (selector) {
		const array = this.array;
		if (array.length > 0)
			return array.reduce((a, b) => a + (selector ? selector(b) : b), 0) / array.length;
	};

	// Searches the sorted array for an item using the comparer and returns the zero-based index of
	// the item. If the item is not found, the return value is a negative number that is the bitwise
	// complement (~) of the index of the next item that is larger than item or, if there is no
	// larger item, the bitwise complement of the length property.
	ArrayList_prototype.binarySearch = function (item, comparer) {
		if (!comparer)
			comparer = (a, b) => a === b ? 0 : a < b ? -1 : 1;
		const array = this.array;
		let start = 0;
		let end = array.length - 1;
		do {
			let mid = Math.floor((start + end) / 2);
			const cmp = comparer(array[mid], item);
			if (cmp === 0) {
				start = mid;
				end = mid;
			}
			else if (cmp < 0) {
				start = mid + 1;
			}
			else {
				end = mid - 1;
			}
		}
		while (start < end);
		const cmp = comparer(array[start], item);
		if (cmp === 0) {
			return start;
		}
		else if (cmp < 0) {
			return ~(start + 1);
		}
		else {
			return ~start;
		}
	};

	// Determines whether an item exists in the array.
	// See also: Array.includes()
	ArrayList_prototype.contains = function (item, startIndex) {
		return this.array.includes(item, startIndex);
	};

	// Counts the items in the array that satisfy a condition.
	ArrayList_prototype.count = function (predicate) {
		if (!predicate)
			return this.length;
		return this.array.reduce((a, b) => a + (predicate(b) ? 1 : 0), 0);
	};

	// Determines whether two arrays contain the same items in the same order.
	ArrayList_prototype.equals = function (other) {
		// Accept Array and ArrayList as input
		if (other && other.array)
			other = other.array;
		return other &&
			this.length === other.length &&
			this.array.every((item, index) => item === other[index]);
	};

	// Returns the first item in the array that satisfies a condition.
	// See also: Array.find()
	ArrayList_prototype.find = function (predicate, thisArg) {
		return this.array.find(predicate, thisArg);
	};

	// Returns the index of the first item in the array that satisfies a condition.
	// See also: Array.findIndex()
	ArrayList_prototype.findIndex = function (predicate, thisArg) {
		return this.array.findIndex(predicate, thisArg);
	};

	// Returns the last item in the array that satisfies a condition.
	ArrayList_prototype.findLast = function (predicate, thisArg) {
		const array = this.array;
		for (let i = array.length - 1; i >= 0; i--) {
			if (predicate.call(thisArg, array[i], i, array))
				return array[i];
		}
	};

	// Returns the index of the last item in the array that satisfies a condition.
	ArrayList_prototype.findLastIndex = function (predicate, thisArg) {
		const array = this.array;
		for (let i = array.length - 1; i >= 0; i--) {
			if (predicate.call(thisArg, array[i], i, array))
				return i;
		}
		return -1;
	};

	// Returns the item at the positive or negative index of the array.
	// See also: Array[index]
	ArrayList_prototype.get = function (index) {
		return this.array[index + (index < 0 ? this.length : 0)];
	};

	// Returns the first index of the item in the array.
	// See also: Array.indexOf()
	ArrayList_prototype.indexOf = function (item) {
		return this.array.indexOf(item);
	};

	// Returns a string by concatenating all of the elements of the array, separated by commas or
	// the specified separator string.
	// See also: Array.join()
	ArrayList_prototype.join = function (separator) {
		return this.array.join(separator);
	};

	// Returns the last index of the item in the array.
	// See also: Array.lastIndexOf()
	ArrayList_prototype.lastIndexOf = function (item) {
		return this.array.lastIndexOf(item);
	};

	// Computes the maximum value of items in the array.
	ArrayList_prototype.max = function (selector) {
		if (this.length > 0)
			return Math.max.apply(null, this.array.map(selector ? selector : x => x));
	};

	// Computes the minimum value of items in the array.
	ArrayList_prototype.min = function (selector) {
		if (this.length > 0)
			return Math.min.apply(null, this.array.map(selector ? selector : x => x));
	};

	// Computes the sum of items in the array.
	ArrayList_prototype.sum = function (selector) {
		return this.array.reduce((a, b) => a + (selector ? selector(b) : b), 0);
	};


	// ==================== Manipulation methods ====================

	// Adds an item to the end of the array.
	// Returns the instance to support chaining.
	// See also: Array.push()
	ArrayList_prototype.add = function (item) {
		this.array.push(item);
		return this;
	};

	// Adds many items to the end of the array.
	// Returns the instance to support chaining.
	ArrayList_prototype.addRange = function (items) {
		if (items.length > 0) {
			// Accept Array and ArrayList as input
			if (items.array)
				items = items.array;
			Array_prototype.splice.apply(this.array, [this.length, 0].concat(items));
		}
		return this;
	};

	// Removes all items from the array.
	// Returns the instance to support chaining.
	ArrayList_prototype.clear = function () {
		this.array.length = 0;
		return this;
	};

	// Changes all elements in the array to a static value.
	// Returns the instance to support chaining.
	// See also: Array.fill()
	ArrayList_prototype.fill = function (value, start, count) {
		let end = undefined;
		if (start !== undefined && count !== undefined) {
			if (count < 0)
				end = count;
			else if (start < 0)
				end = this.length + start + count;
			else
				end = start + count;
		}
		this.array.fill(value, start, end);
		return this;
	};

	// Inserts an item into the array at the specified index.
	// Returns the instance to support chaining.
	ArrayList_prototype.insert = function (index, item) {
		if (index === 0 || index === -this.length)
			this.array.unshift(item);   // much faster than splice
		else
			this.array.splice(index, 0, item);
		return this;
	};

	// Inserts many items into the array at the specified index.
	// Returns the instance to support chaining.
	ArrayList_prototype.insertRange = function (index, items) {
		if (items.length === 1 && (index === 0 || index === -this.length))
			this.array.unshift(items[0]);   // much faster than splice
		else if (items.length > 0)
			Array_prototype.splice.apply(this.array, [index, 0].concat(items));
		return this;
	};

	// Removes an item by value from the array.
	ArrayList_prototype.remove = function (item) {
		const index = this.array.indexOf(item);
		if (index !== -1) {
			this.array.splice(index, 1);
			return true;
		}
		return false;
	};

	// Removes and returns all items from the array that satisfy a condition.
	ArrayList_prototype.removeAll = function (predicate, thisArg) {
		const array = this.array;
		if (!predicate)
			return new ArrayList(array.splice(0));
		const removed = [];
		for (let i = 0; i < array.length; ) {
			if (predicate.call(thisArg, array[i], i, array)) {
				removed.push(array.splice(i, 1)[0]);
			}
			else {
				i++;
			}
		}
		return new ArrayList(removed);
	};

	// Removes and returns an item by index from the array.
	ArrayList_prototype.removeAt = function (index) {
		return this.array.splice(index, 1)[0];
	};

	// Removes and returns the first item from the array.
	// See also: Array.shift()
	ArrayList_prototype.removeFirst = function () {
		return this.array.shift();
	};

	// Removes and returns the last item from the array.
	// See also: Array.pop()
	ArrayList_prototype.removeLast = function () {
		return this.array.pop();
	};

	// Removes and returns many items from the array, either by index and count or the specified
	// items.
	ArrayList_prototype.removeRange = function (start, count) {
		if (typeof start === "object" && start.length !== undefined) {
			// Remove all the specified items, not an index range
			const removed = [];
			start.forEach(item => {
				const index = this.array.indexOf(item);
				if (index !== -1) {
					this.array.splice(index, 1);
					removed.push(item);
				}
			});
			return ArrayList(removed);
		}
		requireInteger(start, "start");
		if (count !== undefined) {
			if (count < 0) {
				if (start < 0)
					count = count - start;   // Both positions are counted from the end, just use the difference
				else
					count = this.length + count - start;
			}
			return new ArrayList(this.array.splice(start, count));
		}
		return new ArrayList(this.array.splice(start));
	};

	// Replaces the first item in the array.
	ArrayList_prototype.replace = function (oldItem, newItem) {
		const index = this.array.indexOf(oldItem);
		if (index !== -1) {
			this.array[index] = newItem;
			return true;
		}
		return false;
	};

	// Reverses the array.
	// Returns the instance to support chaining.
	// See also: Array.reverse()
	ArrayList_prototype.reverse = function () {
		this.array.reverse();
		return this;
	};

	// Sets the item at the positive or negative index of the array.
	// Returns the instance to support chaining.
	// See also: Array[index]
	ArrayList_prototype.set = function (index, value) {
		this.array[index + (index < 0 ? this.length : 0)] = value;
		return this;
	};

	// Shuffles the array using a Fisher-Yates algorithm.
	// Returns the instance to support chaining.
	ArrayList_prototype.shuffle = function () {
		const array = this.array;
		for (let i = array.length - 1; i > 0; i--) {
			// Pick the next item to swap to this position
			const j = Math.floor(Math.random() * (i + 1));
			// Swap items at i and j
			const tmp = array[i];
			array[i] = array[j];
			array[j] = tmp;
		}
		return this;
	};

	// Sorts the array using the comparer or string order.
	// Returns the instance to support chaining.
	// See also: Array.sort()
	ArrayList_prototype.sort = function (comparer) {
		this.array.sort(comparer);
		return this;
	};

	// Sorts the array in ascending order according to a key.
	// Secondary sorting is done by providing more key selector arguments. An argument of 1 or -1
	// sets the sort direction of the following keys ascending or descending, respectively.
	ArrayList_prototype.sortBy = function (keySelector) {
		sortArrayBy(this.array, arguments, 1);
		return this;
	};

	// Sorts the array in descending order according to a key.
	// Secondary sorting is done by providing more key selector arguments. An argument of 1 or -1
	// sets the sort direction of the following keys ascending or descending, respectively.
	ArrayList_prototype.sortByDescending = function (keySelector) {
		sortArrayBy(this.array, arguments, -1);
		return this;
	};

	// Sorts the array using numerical order.
	// Returns the instance to support chaining.
	ArrayList_prototype.sortNumeric = function () {
		this.array.sort((a, b) => a - b);
		return this;
	};


	// ==================== Copy methods ====================

	// Chunks the array into multiple arrays of a maximum length, with optional padding value of the
	// last shorter chunk.
	// Returns an ArrayList of ArrayLists.
	ArrayList_prototype.chunk = function (length, pad) {
		requireInteger(length, 1, "length");
		const chunks = [];
		const array = this.array;
		for (let i = 0; i < array.length; i += length) {
			const chunk = array.slice(i, i + length);
			if (pad !== undefined) {
				while (chunk.length < length) {
					chunk.push(pad);
				}
			}
			chunks.push(new ArrayList(chunk));
		}
		return new ArrayList(chunks);
	};

	// Concatenates the array with other arrays.
	// See also: Array.concat()
	ArrayList_prototype.concat = function () {
		// Accept Array and ArrayList as input
		const arrayArgs = Array_prototype.map.call(arguments, a => a && a.array ? a.array : a);
		return new ArrayList(this.array.concat.apply(this.array, arrayArgs));
	};

	// Returns a new array with the items from the array.
	// See also: Array.concat()
	ArrayList_prototype.clone = function () {
		return new ArrayList(this.array.concat());
	};

	// Returns a new array containing the items from the array, cycling until the target length has
	// been reached.
	ArrayList_prototype.cycle = function (count) {
		if (this.length === 0)
			return new ArrayList();
		const result = [];
		while (count > this.length) {
			Array_prototype.splice.apply(result, [result.length, 0].concat(this.array));
			count -= this.length;
		}
		if (count > 0) {
			Array_prototype.splice.apply(result, [result.length, 0].concat(this.array.slice(0, count)));
		}
		return new ArrayList(result);
	};

	// Returns a new array with all sub-array elements concatenated into it recursively up to the
	// specified depth.
	// See also: Array.flat()
	ArrayList_prototype.flat = function (depth) {
		return new ArrayList(this.array.flat(depth));
	};

	// Returns items from the array.
	// See also: Array.slice()
	ArrayList_prototype.getRange = function (start, count) {
		let end = undefined;
		if (start !== undefined && count !== undefined) {
			if (count < 0)
				end = count;
			else if (start < 0)
				end = this.length + start + count;
			else
				end = start + count;
		}
		return new ArrayList(this.array.slice(start, end));
	};

	// Groups the items of the array according to the key selector function and returns a new Map
	// from each group key and an ArrayList of the items in the group.
	// The order of the items in each returned group is the same as in the original array.
	ArrayList_prototype.groupBy = function (keySelector, elementSelector) {
		const groups = new Map();
		this.array.forEach(i => {
			const key = keySelector(i);
			const value = elementSelector ? elementSelector(i) : i;
			if (!groups.has(key)) {
				groups.set(key, new ArrayList([value]));
			}
			else {
				const arr = groups.get(key);
				arr.add(value);
			}
		});
		return groups;
	};

	// Correlates the elements of two arrays based on a join constraint.
	// The result contains items that match in both arrays.
	ArrayList_prototype.innerJoin = function (other, constraint, selector) {
		return join("inner", this.array, other, constraint, selector);
	};

	// Correlates the elements of two arrays based on a join constraint.
	// The result contains all items from this array, and the matched items from the other array.
	ArrayList_prototype.leftJoin = function (other, constraint, selector) {
		return join("left", this.array, other, constraint, selector);
	};

	// Returns a copy of the array in ascending order according to a key.
	// Secondary sorting is done by providing more key selector arguments. An argument of 1 or -1
	// sets the sort direction of the following keys ascending or descending, respectively.
	ArrayList_prototype.orderBy = function (keySelector) {
		const array = this.array.concat();
		sortArrayBy(array, arguments, 1);
		return new ArrayList(array);
	};

	// Returns a copy of the array in descending order according to a key.
	// Secondary sorting is done by providing more key selector arguments. An argument of 1 or -1
	// sets the sort direction of the following keys ascending or descending, respectively.
	ArrayList_prototype.orderByDescending = function (keySelector) {
		const array = this.array.concat();
		sortArrayBy(array, arguments, -1);
		return new ArrayList(array);
	};

	// Correlates the elements of two arrays based on a join constraint.
	// The result contains all items when there is a match in either this or the other array.
	ArrayList_prototype.outerJoin = function (other, constraint, selector) {
		return join("outer", this.array, other, constraint, selector);
	};

	// Returns a copy of the array with the items rearranged by a mapping function that maps the
	// source index to the target index.
	ArrayList_prototype.rearrange = function (mapper) {
		const array = [];
		for (let i = 0; i < this.length; i++) {
			array[mapper(i)] = this.array[i];
		}
		return new ArrayList(array);
	};

	// Returns a copy of the array repeated multiple times.
	ArrayList_prototype.repeat = function (count) {
		requireInteger(count, 0, "count");
		if (!count)
			return new ArrayList();
		const array = this.array;
		const result = array.concat();
		for (let i = 1; i < count; i++) {
			result.splice(result.length, 0, ...array);
		}
		return new ArrayList(result);
	};

	// Returns a reversed copy of the array.
	ArrayList_prototype.reversed = function () {
		return new ArrayList(this.array.concat().reverse());
	};

	// Projects each item in the array into a new form.
	// See also: Array.map()
	ArrayList_prototype.select = function (selector, thisArg) {
		return new ArrayList(this.array.map(selector, thisArg));
	};

	// Returns a copy of the array without the first items.
	// See also: Array.slice()
	ArrayList_prototype.skip = function (count) {
		requireInteger(count, 0, "count");
		return new ArrayList(this.array.slice(count));
	};

	// Returns a copy of the array without the last items.
	// See also: Array.slice()
	ArrayList_prototype.skipLast = function (count) {
		requireInteger(count, 0, "count");
		if (count > 0)
			return new ArrayList(this.array.slice(0, -count));
		return new ArrayList(this.array.concat());
	};

	// Returns a copy of the array without the first items that satisfy a condition.
	ArrayList_prototype.skipWhile = function (predicate) {
		const start = this.array.findIndex(i => !predicate(i));
		if (start === -1)
			return new ArrayList();
		return new ArrayList(this.array.slice(start));
	};

	// Returns the first items of the array.
	// See also: Array.slice()
	ArrayList_prototype.take = function (count) {
		requireInteger(count, 0, "count");
		return new ArrayList(this.array.slice(0, count));
	};

	// Returns all items in the array that occur after an item.
	ArrayList_prototype.takeAfter = function (item) {
		const index = this.array.indexOf(item);
		if (index === -1)
			return new ArrayList();
		return new ArrayList(this.array.slice(index + 1));
	};

	// Returns all items in the array that occur before an item.
	ArrayList_prototype.takeBefore = function (item) {
		const index = this.array.indexOf(item);
		if (index === -1)
			return new ArrayList();
		return new ArrayList(this.array.slice(0, index));
	};

	// Returns every nth item of the array.
	ArrayList_prototype.takeEvery = function (step, start, count) {
		requireInteger(step, 1, "step");
		const result = [];
		for (let i = start || 0; i < this.length && (count === undefined || result.length < count); i += step) {
			result.push(this.array[i]);
		}
		return new ArrayList(result);
	};

	// Returns the last items of the array.
	// See also: Array.slice()
	ArrayList_prototype.takeLast = function (count) {
		requireInteger(count, 0, "count");
		if (count > 0)
			return new ArrayList(this.array.slice(-count));
		return new ArrayList();
	};

	// Returns the first items of the array that satisfy a condition.
	ArrayList_prototype.takeWhile = function (predicate) {
		let end = this.array.findIndex(i => !predicate(i));
		if (end === -1)
			end = undefined;
		return new ArrayList(this.array.slice(0, end));
	};

	// Returns a plain Array of the items of the array, also converting all nested ArrayLists.
	ArrayList_prototype.toArray = function () {
		return this.array.map(i => i instanceof ArrayList ? i.toArray() : i);
	};

	// Returns a Map of the items of the array.
	ArrayList_prototype.toMap = function (keySelector, valueSelector) {
		const map = new Map();
		const array = this.array;
		if (typeof keySelector === "string") {
			const keyName = keySelector;
			keySelector = item => item[keyName];
		}
		if (typeof valueSelector === "string") {
			const valueName = valueSelector;
			valueSelector = item => item[valueName];
		}
		for (let i = 0; i < array.length; i++) {
			let item = array[i];
			if (keySelector && valueSelector)
				map.set(keySelector(item, i, array), valueSelector(item, i, array));
			else if (keySelector)
				map.set(keySelector(item, i, array), item);
			else if (item.length === 2)
				map.set(item[0], item[1]);
			else
				throw new TypeError("An item is not a key-value pair.");
		}
		return map;
	};

	// Returns an Object of the items of the array.
	ArrayList_prototype.toObject = function (keySelector, valueSelector) {
		const obj = {};
		const array = this.array;
		if (typeof keySelector === "string") {
			const keyName = keySelector;
			keySelector = item => item[keyName];
		}
		if (typeof valueSelector === "string") {
			const valueName = valueSelector;
			valueSelector = item => item[valueName];
		}
		for (let i = 0; i < array.length; i++) {
			let item = array[i];
			if (keySelector && valueSelector)
				obj[keySelector(item, i, array)] = valueSelector(item, i, array);
			else if (keySelector)
				obj[keySelector(item, i, array)] = item;
			else if (item.length === 2)
				obj[item[0]] = item[1];
			else
				throw new TypeError("An item is not a key-value pair.");
		}
		return obj;
	};

	// Returns an array of arrays where each array contains the first/second/etc. values from each
	// of the current arrays. It transposes a data table or matrix made of arrays of arrays of the
	// values, also called zip/unzip.
	// A single array can be converted for this method with the chunk method.
	// The result can be converted to a single array with the flat method.
	ArrayList_prototype.transpose = function (chunkSize) {
		if (this.length > 0 && this.array[0].length === undefined) {
			// Flat array, transpose directly by index column/row mapping
			requireInteger(chunkSize, 1, "chunkSize");
			const array = [];
			const chunkCount = Math.ceil(this.length / chunkSize);
			for (let i = 0; i < this.length; i++) {
				array[(i % chunkSize) * chunkCount + Math.floor(i / chunkSize)] = this.array[i];
			}
			return new ArrayList(array);
		}

		// Process array of arrays
		const result = [];
		const maxArrayLength = Math.max(...this.array.map(a => a.length));
		for (let a = 0; a < maxArrayLength; a++) {
			result.push(new ArrayList(this.array.map(innerArray => (innerArray.array ? innerArray.array : innerArray)[a])));
		}
		return ArrayList(result);
	};

	// Returns all items from the array that satisfy a condition.
	// See also: Array.filter()
	ArrayList_prototype.where = function (predicate, thisArg) {
		return new ArrayList(this.array.filter(predicate, thisArg));
	};


	// ==================== Set methods ====================

	// Returns a new array with the items from the array, without duplicates.
	// The order of the returned items is the same as the original array.
	ArrayList_prototype.distinct = function () {
		return new ArrayList(new Set(this.array));
	};

	// Returns a new array with the unique items from the array, without all items from the other
	// array, also called set difference.
	// The order of the returned items is the same as the original array.
	ArrayList_prototype.except = function (other) {
		const otherSet = new Set(other);
		return new ArrayList(Array.from(new Set(this.array)).filter(i => !otherSet.has(i)));
	};

	// Returns a new array with the unique items that exist in both the array and the other array.
	// The order of the returned items is the same as the original array.
	ArrayList_prototype.intersect = function (other) {
		const otherSet = new Set(other);
		return new ArrayList(Array.from(new Set(this.array)).filter(i => otherSet.has(i)));
	};

	// Determines whether the array is a subset of the other array.
	ArrayList_prototype.isSubsetOf = function (other) {
		const otherSet = new Set(other);
		return this.array.every(i => otherSet.has(i));
	};

	// Determines whether the array is a superset of the other array.
	ArrayList_prototype.isSupersetOf = function (other) {
		const thisSet = new Set(this.array);
		return Array.from(other).every(i => thisSet.has(i));
	};

	// Determines whether two arrays contain the same unique items but not necessarily in the same
	// order.
	ArrayList_prototype.setEquals = function (other) {
		// Accept Array and ArrayList as input
		if (other.array)
			other = other.array;
		const array = this.array;
		const thisSet = new Set(array);
		const otherSet = new Set(other);
		for (let i = 0; i < array.length; i++) {
			if (!otherSet.has(array[i]))
				return false;
		}
		for (let i = 0; i < other.length; i++) {
			if (!thisSet.has(other[i]))
				return false;
		}
		return true;
	};

	// Returns a new array with the unique items that exist in either the array or the other array
	// but not in both.
	// The order of the returned items is the same as the original array, followed by the new items
	// from the other array.
	ArrayList_prototype.symmetricDifference = function (other) {
		const thisSet = new Set(this.array);
		const otherSet = new Set(other);
		const thisUnique = Array.from(thisSet);
		const otherUnique = Array.from(otherSet);
		return new ArrayList(thisUnique
			.filter(i => !otherSet.has(i))
			.concat(otherUnique.filter(i => !thisSet.has(i))));
	};

	// Returns a new array with the unique items from the array and also from the other array.
	// The order of the returned items is the same as the original array, followed by the new items
	// from the other array.
	ArrayList_prototype.union = function (other) {
		// Accept Array and ArrayList as input
		if (other && other.array)
			other = other.array;
		return new ArrayList(Array.from(new Set(this.array.concat(other))));
	};


	// ==================== Void methods ====================

	// Calls a function for each item in the array.
	// See also: Array.forEach()
	ArrayList_prototype.forEach = function (action, thisArg) {
		this.array.forEach(action, thisArg);
		return this;
	};


	// ==================== Private functions ====================

	function requireInteger(value, min, name) {
		if (arguments.length < 3) {
			name = min;
			min = undefined;
		}
		if (!Number.isInteger(value))
			throw new TypeError("Integer value expected for " + name + ".");
		if (min !== undefined && value < min)
			throw new RangeError("Value for " + name + " must be " + min + " or greater.");
	}

	function sortArrayBy(array, keySelectors, initialDirection) {
		array.sort((a, b) => {
			let direction = initialDirection;
			for (let keySelector of keySelectors) {
				if (keySelector === 1 || keySelector === -1) {
					direction = keySelector;
				}
				else {
					const ka = keySelector(a);
					const kb = keySelector(b);
					if (ka < kb) return -1 * direction;
					if (ka > kb) return 1 * direction;
				}
			}
			return 0;
		});
	}

	function join(type, array, other, constraint, selector) {
		if (!constraint)
			constraint = (i, o) => true;
		if (!selector)
			selector = (i, o) => Object.assign({}, i, o);
		const result = [];
		array.forEach(i => {
			let foundOther = false;
			other.forEach(o => {
				if (constraint(i, o)) {
					foundOther = true;
					result.push(selector(i, o));
				}
			});
			if (!foundOther && type !== "inner")
				result.push(selector(i, null));
		});
		if (type === "outer") {
			// Full outer join, also look for singles on the other side
			other.forEach(o => {
				let foundThis = false;
				array.forEach(i => {
					if (constraint(i, o)) {
						foundThis = true;
					}
				});
				if (!foundThis)
					result.push(selector(null, o));
			});
		}
		return new ArrayList(result);
	}


	// ==================== Indexed interface ====================

	// This is an experiment. The static index (not updated, not writable) doesn't take much time.
	// But the live index with getters and setters takes much longer to create, so it's not practical.

	//function updateIndex() {
	//	let array = this.array;
	//	let length = array.length;
	//	if (this._indexLength === undefined)
	//		this._indexLength = 0;
	//	// Add missing properties
	//	for (let i = this._indexLength; i < length; i++) {
	//		// Create static index:
	//		//this[i] = this.array[i];
	//		// Create live index:
	//		object_defineProperty(this, i, {
	//			configurable: true,
	//			enumerable: true,
	//			get: () => array[i],
	//			set: value => array[i] = value
	//		});
	//	}
	//	// Remove old properties
	//	for (let i = this._indexLength; i >= length; i--) {
	//		delete this[i];
	//	}
	//	this._indexLength = length;
	//}
	//
	//ArrayList_prototype.updateIndex = updateIndex;


	// ==================== Exports ====================

	// Environment detection
	if (typeof module === "object" && typeof module.exports === "object") {
		// Node.js
		module.exports = ArrayList;
	}
	else {
		// Global object
		window.ArrayList = ArrayList;
	}
})();
