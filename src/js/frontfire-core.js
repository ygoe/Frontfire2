/*! frontfire-core.js v2.0.0-beta.2 | @license MIT | ygoe.de */
/* build-dir(build) */

// Copyright (c) 2021-2022, Yves Goergen, https://ygoe.de
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

(function (ArrayList, undefined) {
	"use strict";


	// ==================== Constructor ====================

	// The Frontfire class provides additional methods and properties to regular Nodes, NodeLists
	// and HTMLCollections. It inherits from the ArrayList class.
	//
	// node: See add method's parameter.
	function Frontfire(node) {
		// Allow calling without "new" keyword
		// NOTE: new.target cannot be used, it does something else and breaks everything.
		if (!(this instanceof Frontfire)) {
			return new Frontfire(node);
		}
		else {
			// Called as constructor with 'new'
			// Call base constructor to use a separate internal array for each Frontfire instance
			ArrayList.call(this);
		}

		// Allow object identification in Firefox (Chrome already shows the object type in devtools)
		//delete this._L;
		//this._F = true;

		// Collect or create the nodes
		if (node !== undefined)
			this.add(node);
	}

	// Make Frontfire inherit from ArrayList (a comfortable array collection, not inherited from Array)
	// Source: https://stackoverflow.com/a/12586622
	Frontfire.prototype = new ArrayList();
	Frontfire.constructor = Frontfire;

	// Shorter names for minified code
	const ArrayList_prototype = ArrayList.prototype;
	const Frontfire_prototype = Frontfire.prototype;
	const array_prototype = Array.prototype;
	const object_defineProperty = Object.defineProperty;
	const object_assign = Object.assign;
	const isString = x => typeof x === "string";
	const isNumber = x => typeof x === "number";
	const isBoolean = x => typeof x === "boolean";
	const isFunction = x => typeof x === "function";
	const distinctIfNeeded = (array, thisLength) => thisLength > 1 ? array.distinct() : array;

	// Version identification
	Frontfire.version = ArrayList.version;

	// Convert return value from ArrayList to Frontfire for inherited methods that return a
	// chainable nodes collection, but not for methods that are already overridden in Frontfire
	[
		"concat", "distinct", "except", "getRange", "intersect", "orderBy", "orderByDescending",
		"rearrange", "reversed", "skip", "skipLast", "skipWhile", "symmetricDifference", "take",
		"takeAfter", "takeBefore", "takeEvery", "takeLast", "takeWhile", "union"
	].forEach(name => {
		Frontfire_prototype[name] = function () {
			return new Frontfire(ArrayList_prototype[name].apply(this, arguments));
		};
	});

	// Chunks the array of selected Nodes into multiple arrays of a maximum length, with an optional
	// padding value for the last shorter chunk to bring it to the specified length.
	// Returns an ArrayList of Frontfire instances.
	Frontfire_prototype.chunk = function (length, pad) {
		let chunks = ArrayList_prototype.chunk.apply(this, arguments);
		return chunks.select(chunk => new Frontfire(chunk));
	};

	// Groups the selected Nodes according to the key selector function and returns a new Map
	// from each group key and a Frontfire instance of the Nodes in the group.
	// The order of the Nodes in each returned group is the same as in the original array.
	Frontfire_prototype.groupBy = function (keySelector, elementSelector) {
		let groups = ArrayList_prototype.groupBy.apply(this, arguments);
		groups.forEach((value, key) => groups.set(key, new Frontfire(value)));
		return groups;
	};

	// Overwrite unsupported inherited methods
	//
	// cycle: Repeating the same nodes doesn't make sense.
	// flat: A Frontfire instance doesn't contain arrays.
	// *Join: Node properties should not be merged.
	// repeat: Repeating the same nodes doesn't make sense.
	// sortNumeric: Nodes have no numeric order.
	[
		"cycle", "fill", "flat", "innerJoin", "leftJoin", "outerJoin", "repeat", "sortNumeric",
		"transpose"
	].forEach(name => {
		Frontfire_prototype[name] = throwNotSupportedError;
	});

	function throwNotSupportedError() {
		throw new Error("The operation is not supported.");
	}


	// ==================== Node, NodeList and HTMLCollection extensions ====================

	// Creates an Frontfire instance directly for a Node.
	// This is even a tiny bit faster than calling F().
	object_defineProperty(Node.prototype, "F", {
		get: function () {
			return new Frontfire(this);
		}
	});

	// Creates an Frontfire instance directly from a static copy of a NodeList collection.
	object_defineProperty(NodeList.prototype, "F", {
		get: function () {
			return new Frontfire(this);
		}
	});

	// Creates an Frontfire instance directly from a static copy of an HTMLCollection.
	object_defineProperty(HTMLCollection.prototype, "F", {
		get: function () {
			return new Frontfire(this);
		}
	});

	// NOTE: The F extension property cannot be added to Window in this way because that name
	//       already holds the alias for Frontfire, which can be globally called as F().

	// Also allow F on a Frontfire instance for simplicity and consistency.
	// It will just return the same instance so it's a very cheap operation.
	object_defineProperty(Frontfire_prototype, "F", {
		get: function () {
			return this;
		}
	});


	// ==================== Array and ArrayList conversions ====================

	// Creates an Frontfire instance directly from an Array of nodes.
	object_defineProperty(array_prototype, "F", {
		get: function () {
			return new Frontfire(this);
		}
	});

	// Creates an Frontfire instance directly from an ArrayList collection of nodes.
	object_defineProperty(ArrayList_prototype, "F", {
		get: function () {
			return new Frontfire(this);
		}
	});

	// Provides direct access to ArrayList methods for the current collection.
	object_defineProperty(Frontfire_prototype, "L", {
		get: function () {
			return new ArrayList(this.array);
		}
	});


	// ==================== Public properties ====================

	// ---------- Children access ----------

	// Gets the first child node (including non-elements) of each selected Node.
	// See also: Node.firstChild
	object_defineProperty(Frontfire_prototype, "firstChild", {
		get: function () {
			return new Frontfire(this.select(n => n.firstChild).where(s => s));
		}
	});

	// Gets the first child Element of each selected Node.
	// See also: Element.firstElementChild
	object_defineProperty(Frontfire_prototype, "firstElementChild", {
		get: function () {
			return new Frontfire(this.select(n => n.firstElementChild).where(s => s));
		}
	});

	// Gets the last child node (including non-elements) of each selected Node.
	// See also: Node.lastChild
	object_defineProperty(Frontfire_prototype, "lastChild", {
		get: function () {
			return new Frontfire(this.select(n => n.lastChild).where(s => s));
		}
	});

	// Gets the last child Element of each selected Node.
	// See also: Element.lastElementChild
	object_defineProperty(Frontfire_prototype, "lastElementChild", {
		get: function () {
			return new Frontfire(this.select(n => n.lastElementChild).where(s => s));
		}
	});

	// Gets the total number of child elements of all selected Nodes.
	// See also: Element.childElementCount
	object_defineProperty(Frontfire_prototype, "childElementCount", {
		get: function () {
			return this.sum(n => n.childElementCount);
		}
	});

	// Gets or sets all child elements of all selected Nodes.
	// See also: Element.children, jQuery.children(), Element.replaceChildren()
	object_defineProperty(Frontfire_prototype, "children", {
		get: function () {
			return new Frontfire(this.select(n => Array.from(n.children)).flat());
		},
		set: function (newChildren) {
			if (this.length > 0) {
				if (newChildren instanceof Node)
					newChildren = [newChildren];
				if (newChildren instanceof ArrayList)
					newChildren = newChildren.array;
				// Resolve Frontfire instances to their first node
				newChildren = newChildren.map(c => c instanceof ArrayList ? c.first : c);
				this.array[0].replaceChildren(...newChildren);
			}
		}
	});

	// Gets all child nodes of all selected Nodes.
	// See also: Node.childNodes
	object_defineProperty(Frontfire_prototype, "childNodes", {
		get: function () {
			return new Frontfire(this.select(n => Array.from(n.childNodes)).flat());
		}
	});

	// ---------- Parents access ----------

	// Gets the parent element of the first selected Node.
	// See also: Node.parentElement, jQuery.parent()
	object_defineProperty(Frontfire_prototype, "parentElement", {
		get: function () {
			return this.array[0] ? new Frontfire(this.array[0].parentElement) : null;
		}
	});

	// Gets the parent node of the first selected Node.
	// See also: Node.parentNode
	object_defineProperty(Frontfire_prototype, "parentNode", {
		get: function () {
			return this.array[0] ? new Frontfire(this.array[0].parentNode) : null;
		}
	});

	// Gets all distinct ancestor elements of all selected Nodes.
	// See also: jQuery.parents()
	object_defineProperty(Frontfire_prototype, "parents", {
		get: function () {
			return distinctIfNeeded(recurseAllByProperty(this, "parentElement"), this.length);
		}
	});

	// Gets the closest positioned parent element of the first selected Node.
	object_defineProperty(Frontfire_prototype, "closestPositionedParent", {
		get: function () {
			if (this.array[0]) {
				let element = this.array[0].parentElement;
				while (element) {
					if (getComputedStyle(element).position !== "static")
						return new Frontfire(element);
					element = element.parentElement;
				}
			}
			return null;
		}
	});

	// ---------- Siblings access ----------

	// Gets the next sibling node (including non-elements) of each selected Node.
	// See also: Node.nextSibling, jQuery.next()
	object_defineProperty(Frontfire_prototype, "nextSibling", {
		get: function () {
			return new Frontfire(this.select(n => n.nextSibling).where(s => s));
		}
	});

	// Gets the next sibling Element of each selected Node.
	// See also: Element.nextElementSibling, jQuery.next()
	object_defineProperty(Frontfire_prototype, "nextElementSibling", {
		get: function () {
			return new Frontfire(this.select(n => n.nextElementSibling).where(s => s));
		}
	});

	// Gets the preceding sibling node (including non-elements) of each selected Node.
	// See also: Node.previousSibling, jQuery.prev()
	object_defineProperty(Frontfire_prototype, "previousSibling", {
		get: function () {
			return new Frontfire(this.select(n => n.previousSibling).where(s => s));
		}
	});

	// Gets the preceding sibling Element of each selected Node.
	// See also: Node.previousElementSibling, jQuery.prev()
	object_defineProperty(Frontfire_prototype, "previousElementSibling", {
		get: function () {
			return new Frontfire(this.select(n => n.previousElementSibling).where(s => s));
		}
	});

	// Gets all distinct following sibling nodes (including non-elements) of all selected Nodes.
	// See also: jQuery.nextAll()
	object_defineProperty(Frontfire_prototype, "nextSiblings", {
		get: function () {
			return distinctIfNeeded(recurseAllByProperty(this, "nextSibling"), this.length);
		}
	});

	// Gets all distinct following sibling Elements of all selected Nodes.
	// See also: jQuery.nextAll()
	object_defineProperty(Frontfire_prototype, "nextElementSiblings", {
		get: function () {
			return distinctIfNeeded(recurseAllByProperty(this, "nextElementSibling"), this.length);
		}
	});

	// Gets all distinct preceding sibling nodes (including non-elements) of all selected Nodes.
	// See also: jQuery.prevAll()
	object_defineProperty(Frontfire_prototype, "previousSiblings", {
		get: function () {
			return distinctIfNeeded(recurseAllByProperty(this, "previousSibling"), this.length);
		}
	});

	// Gets all distinct preceding sibling Elements of all selected Nodes.
	// See also: jQuery.prevAll()
	object_defineProperty(Frontfire_prototype, "previousElementSiblings", {
		get: function () {
			return distinctIfNeeded(recurseAllByProperty(this, "previousElementSibling"), this.length);
		}
	});

	// Gets all distinct sibling elements of all selected Nodes, not including the selected Node
	// itself (unless it is a sibling of another selected Node).
	// See also: jQuery.siblings()
	object_defineProperty(Frontfire_prototype, "siblings", {
		get: function () {
			return distinctIfNeeded(
				new Frontfire(
					this.select(n => Array.from(n.parentElement.children).filter(c => c !== n))
						.flat()),
				this.length);
		}
	});

	// Gets the index of the first selected Node among its siblings.
	// See also: jQuery.index()
	object_defineProperty(Frontfire_prototype, "index", {
		get: function () {
			let el = this.array[0];
			if (!el) return -1;
			let i = 0;
			while (el = el.previousElementSibling) {
				i++;
			}
			return i;
		}
	});

	// ---------- Node information ----------

	// Gets the unchanged name of the first selected Node.
	// See also: Node.nodeName
	object_defineProperty(Frontfire_prototype, "nodeName", {
		get: function () {
			return this.array[0] ? this.array[0].nodeName : null;
		}
	});

	// Gets the lower-case name of the first selected Node.
	object_defineProperty(Frontfire_prototype, "nodeNameLower", {
		get: function () {
			return this.array[0] ? this.array[0].nodeName.toLowerCase() : null;
		}
	});

	// Gets the concatenated text content of all selected Nodes or sets the text content of each
	// selected Node.
	// See also: Node.textContent, jQuery.text()
	object_defineProperty(Frontfire_prototype, "textContent", {
		get: function () {
			return this.select(n => n.textContent).aggregate("", (a, b) => a + b);
		},
		set: function (text) {
			this.forEach(n => n.textContent = text);
		}
	});

	// Gets the concatenated HTML content of all selected Nodes or sets the HTML content of each
	// selected Node.
	// See also: Element.innerHTML, jQuery.html()
	object_defineProperty(Frontfire_prototype, "innerHTML", {
		get: function () {
			return this.select(n => n.innerHTML).aggregate("", (a, b) => a + b);
		},
		set: function (html) {
			this.forEach(n => n.innerHTML = html);
		}
	});

	// Gets the concatenated HTML of all selected Nodes or sets the HTML of each selected Node.
	// See also: Element.outerHTML
	object_defineProperty(Frontfire_prototype, "outerHTML", {
		get: function () {
			return this.select(n => n.outerHTML).aggregate("", (a, b) => a + b);
		},
		set: function (html) {
			this.forEach(n => n.outerHTML = html);
		}
	});

	// Gets a proxy that gets the dataset of the first selected Node and sets the dataset of all
	// nodes, or sets the keys and values of the object in the dataset of all selected Nodes.
	// See also: HTMLElement.dataset, jQuery.data()
	//
	// NOTE: This code is copied from the 'style' property. It may be combined and made reusable,
	// but GZip compression catches this and there are currently no other DOM/HTML properties where
	// this could be of use (except datasetJSON).
	object_defineProperty(Frontfire_prototype, "dataset", {
		get: function () {
			const self = this;

			// Sets a data item on the selected Nodes.
			//
			// key:
			//   (String) The data key.
			//   (Object) An object with keys and values to apply to the dataset. The value parameter is ignored.
			// value: (String) The dataset value. If null, the dataset entry is deleted.
			//   If not specified, the current value is returned (getter).
			const datasetFn = function (key, value) {
				if (isString(key)) {
					key = camelCase(key);
					if (arguments.length >= 2) {
						// Single setter
						self.forEach(node => value !== null ? node.dataset[key] = value : delete node.dataset[key]);
						return self;   // Support chaining
					}
					else {
						// Single getter
						if (self.array[0])
							return self.array[0].dataset[key];
						return undefined;
					}
				}
				else if (typeof key === "object") {
					// Multi setter
					self.forEach(node => {
						for (let k in key) {
							if (key[k] !== null)
								node.dataset[camelCase(k)] = key[k];
							else
								delete node.dataset[camelCase(k)];
						}
					});
					return self;   // Support chaining
				}
				else {
					argError(key);
				}
			}

			return new Proxy(datasetFn, {
				get: (target, property) => {
					if (self.array[0])
						return self.array[0].dataset[camelCase(property)];
					return undefined;
				},
				set: (target, property, value) => {
					property = camelCase(property);
					self.forEach(node => value !== null ? node.dataset[property] = value : delete node.dataset[property]);
					return true;
				}
			});
		},
		set: function (value) {
			if (typeof value === "object") {
				// Multi setter
				this.forEach(node => {
					for (let key in value) {
						if (value[key] !== null)
							node.dataset[camelCase(key)] = value[key];
						else
							delete node.dataset[camelCase(key)];
					}
				});
			}
			else {
				argError(value);
			}
		}
	});

	// Gets a proxy that gets the JSON-interpreted dataset of the first selected Node and sets the
	// JSON-interpreted dataset of all nodes, or sets the keys and values of the object in the
	// dataset of all selected Nodes.
	// See also: HTMLElement.dataset, jQuery.data()
	//
	// NOTE: This code is copied from the 'dataset' property. It may be combined and made reusable,
	// but GZip compression catches this and there are currently no other DOM/HTML properties where
	// this could be of use (except dataset and style).
	object_defineProperty(Frontfire_prototype, "datasetJSON", {
		get: function () {
			const self = this;

			// Sets a data item on the selected Nodes.
			//
			// key:
			//   (String) The data key.
			//   (Object) An object with keys and values to apply to the dataset. The value parameter is ignored.
			// value: The dataset value. This value is JSON-serialised before saving.
			//   If null, the dataset entry is deleted.
			//   If not specified, the current value is returned (getter).
			const datasetFn = function (key, value) {
				if (isString(key)) {
					key = camelCase(key);
					if (arguments.length >= 2) {
						// Single setter
						self.forEach(node => value !== null ? node.dataset[key] = JSON.stringify(value) : delete node.dataset[key]);
						return self;   // Support chaining
					}
					else {
						// Single getter
						if (self.array[0]) {
							value = self.array[0].dataset[key];
							if (value !== undefined && value !== "")
								return JSON.parse(value);
							return null;
						}
						return undefined;
					}
				}
				else if (typeof key === "object") {
					// Multi setter
					self.forEach(node => {
						for (let k in key) {
							if (key[k] !== null)
								node.dataset[camelCase(k)] = JSON.stringify(key[k]);
							else
								delete node.dataset[camelCase(k)];
						}
					});
					return self;   // Support chaining
				}
				else {
					argError(key);
				}
			}

			return new Proxy(datasetFn, {
				get: (target, property) => {
					if (self.array[0]) {
						value = self.array[0].dataset[camelCase(property)];
						if (value !== undefined && value !== "")
							return JSON.parse(value);
						return null;
					}
					return undefined;
				},
				set: (target, property, value) => {
					property = camelCase(property);
					self.forEach(node => value !== null ? node.dataset[property] = JSON.stringify(value) : delete node.dataset[property]);
					return true;
				}
			});
		},
		set: function (value) {
			if (typeof value === "object") {
				// Multi setter
				this.forEach(node => {
					for (let key in value) {
						if (value[key] !== null)
							node.dataset[camelCase(key)] = JSON.stringify(value[key]);
						else
							delete node.dataset[camelCase(key)];
					}
				});
			}
			else {
				argError(value);
			}
		}
	});

	// ---------- Style access ----------

	// Gets the computed style of the first selected Node.
	// See also: window.getComputedStyle()
	object_defineProperty(Frontfire_prototype, "computedStyle", {
		get: function () {
			return getComputedStyle(this.array[0], null);
		}
	});

	// Gets a proxy that gets the style of the first selected Node and sets the style of all
	// selected Nodes.
	// See also: HTMLElement.style, jQuery.css()
	object_defineProperty(Frontfire_prototype, "style", {
		get: function () {
			const self = this;

			// Sets a style on the selected Nodes.
			//
			// name:
			//   (String) The style name.
			//   (Object) An object with keys and values to apply to the style. The value parameter is ignored.
			// value: (String) The style value. If not specified, the current value is returned (getter).
			const styleFn = function (name, value) {
				if (isString(name)) {
					name = camelCase(name);
					if (arguments.length >= 2) {
						// Single setter
						self.forEach(node => node.style[name] = value);
						return self;   // Support chaining
					}
					else {
						// Single getter
						if (self.array[0])
							return self.array[0].style[name];
						return undefined;
					}
				}
				else if (typeof name === "object") {
					// Multi setter
					self.forEach(node => {
						for (let key in name) {
							node.style[camelCase(key)] = name[key];
						}
					});
					return self;   // Support chaining
				}
				else {
					argError(name);
				}
			}

			return new Proxy(styleFn, {
				get: (target, property) => {
					if (self.array[0])
						return self.array[0].style[camelCase(property)];
					return undefined;
				},
				set: (target, property, value) => {
					self.forEach(n => n.style[camelCase(property)] = value);
					return true;
				}
			});
		},
		set: function (value) {
			if (typeof value === "object") {
				// Multi setter
				this.forEach(node => {
					for (let key in value) {
						node.style[camelCase(key)] = value[key];
					}
				});
			}
			else {
				argError(value);
			}
		}
	});

	// Gets an object with methods to manage the CSS classes of the selected Nodes, or sets the CSS
	// classes of all selected Nodes.
	// See also: Element.classList
	object_defineProperty(Frontfire_prototype, "classList", {
		get: function () {
			const self = this;

			// Returns a Set of the class names of the selected Nodes.
			let getClassNames = () => {
				let classNames = new Set();
				self.forEach(n => n.classList.forEach(c => classNames.add(c)));
				return classNames;
			};

			let obj = {
				// Determines whether any of the selected Nodes has all of the specified class names.
				// The class names can be specified as space-separated string, array (iterable), or
				// any combination thereof.
				// See also: Element.classList.contains(), jQuery.hasClass()
				//
				// classNames:
				//   (String) A space-separated list of class names.
				//   (Array) The class names.
				contains: function (classNames) {
					classNames = splitBySpace(classNames);
					return self.any(n => classNames.every(c => n.classList.contains(c)));
				},

				// Adds class names to the selected Nodes.
				// The class names can be specified as space-separated string, array (iterable),
				// multiple arguments, or any combination thereof.
				// See also: Element.classList.add(), jQuery.addClass()
				//
				// classNames:
				//   (String) A space-separated list of class names.
				//   (Array) The class names.
				add: function () {
					let classNames = splitBySpace(arguments);
					self.forEach(n => n.classList.add(...classNames));
				},

				// Removes class names from the selected Nodes.
				// The class names can be specified as space-separated string, array (iterable),
				// multiple arguments, or any combination thereof.
				// See also: Element.classList.remove(), jQuery.removeClass()
				//
				// classNames:
				//   (String) A space-separated list of class names.
				//   (Array) The class names.
				remove: function () {
					let classNames = splitBySpace(arguments);
					self.forEach(n => n.classList.remove(...classNames));
				},

				// Replaces a class name with a new class name in the selected Nodes.
				// Returns a value indicating whether the oldClass was replaced in any of the selected Nodes.
				// See also: Element.classList.replace()
				//
				// oldClass: (String) The class name to replace.
				// newClass: (String) The new class name to add.
				replace: function (oldClass, newClass) {
					let result = false;
					self.forEach(n => {
						result |= n.classList.replace(oldClass, newClass);
					});
					return result;
				},

				// Toggles class names on the selected Nodes.
				// The class names can be specified as space-separated string, array (iterable), or
				// any combination thereof.
				// Returns a value indicating whether all classes are set in all selected Nodes
				// after the operation.
				// See also: Element.classList.toggle(), jQuery.toggleClass()
				//
				// classNames:
				//   (String) A space-separated list of class names.
				//   (Array) The class names.
				// force: (Boolean) If set, forces the classes to be added or removed instead of toggled.
				toggle: function (classNames, force) {
					let classes = splitBySpace(classNames);
					let ret;
					classes.forEach(c => {
						self.forEach(n => {
							let r = n.classList.toggle(c, force);
							if (ret === undefined)
								ret = r;
							else
								ret &= r;
						});
					});
					return ret;
				},

				// Calls a function once for each class name in the selected Nodes.
				// See also: Element.classList.forEach()
				forEach: function (action, thisArg) {
					getClassNames().forEach(action, thisArg);
				},

				// Returns an Array of the distinct class names in the selected Nodes.
				toArray: () => Array.from(getClassNames())
			};

			// Gets the number of distinct classes of the selected Nodes.
			object_defineProperty(obj, "length", {
				get: () => getClassNames().size
			});

			return obj;
		},
		set: function (value) {
			if (isString(value)) {
				// Replace all classes
				this.forEach(node => node.className = value);
			}
			else if (isIterable(value)) {
				// Replace all classes
				let className = Array.from(value).join(" ");
				this.forEach(node => node.className = className);
			}
			else {
				argError(value);
			}
		}
	});

	// Gets or sets a value indicating whether all selected Nodes are visible. A node is considered
	// invisible (to the layout) if it has the style "display: none", and visible in all other cases.
	// See also: jQuery.show(), jQuery.hide()
	object_defineProperty(Frontfire_prototype, "visible", {
		get: function () {
			// An item is invisible if it has 'display: none' directly or via stylesheet.
			// Check length to return false if there is no node.
			// So even though "everything" is visible, there really is nothing at all that could be visible.
			return this.length > 0 &&
				this.all(n => !(n.style.display === "none" ||
					n.style.display === "" && getComputedStyle(n).display === "none"));
		},
		set: function (state) {
			// Collect all current nodes or their replacements once
			let nodes = this.select(n => getNodeData(n, "visible.replacement", n));

			if (state) {
				// To show
				let newDisplays = [];
				nodes.forEach((n, i) => {
					if (n.style.display === "none") {
						// Currently hidden, change that
						newDisplays[i] = getNodeData(n, "visible.display", "");
						if (!newDisplays[i]) {
							// We didn't hide it.
							// Clear the inline style to see if it's hidden via a stylesheet.
							n.style.display = "";
						}
					}
					if (n.style.display === "" && getComputedStyle(n).display === "none") {
						// Nothing set but still hidden, must be a stylesheet.
						// Use the browser default for this element to override the stylesheet and
						// make the element visible anyway.
						newDisplays[i] = "revert";
					}
					deleteNodeData(n, "visible.display");
				});

				// Apply the styles in a second loop to avoid constant reflows
				nodes.forEach((n, i) => {
					if (newDisplays[i])
						n.style.display = newDisplays[i];
				});
			}
			else {
				// To hide
				nodes.forEach((n, i) => {
					let display = n.style.display;
					if (display !== "none") {
						// Currently not directly hidden, change that
						// Remember the overwritten value, if it's meaningful (non-default)
						if (display !== "")
							setNodeData(n, "visible.display", display);
						n.style.display = "none";
					}
				});
			}
		}
	});

	// Gets a value indicating whether all selected Nodes are effectively visible. A node is
	// considered visible if it has dimensions and its computed "visibility" style is "visible".
	object_defineProperty(Frontfire_prototype, "effectivelyVisible", {
		get: function () {
			// Check length to return false if there is no node.
			// So even though "everything" is visible, there really is nothing at all that could be visible.
			return this.length > 0 && this.all(n => hasLayoutSize(n) && isVisibilityVisible(n));
		}
	});

	// Defines an element state property that also triggers an event if the state was changed.
	function defineElementStateProperty(name) {
		object_defineProperty(Frontfire_prototype, name, {
			get: function () {
				// Check length to return false if there is no node.
				return this.length > 0 && this.all(node => {
					let supportsProp = name in node;
					if (supportsProp) {
						// The property is natively supported on the node
						return node[name];
					}
					else {
						// Read from attribute because there is no such property
						return node.hasAttribute(name);
					}
				});
			},
			set: function (state) {
				this.forEach(node => {
					let changed;
					let supportsProp = name in node;
					if (name === "readonly" && !supportsProp && "disabled" in node) {
						// Disable the element if it doesn't support readonly
						name = "disabled";
						supportsProp = true;
					}

					if (supportsProp) {
						// The property is natively supported on the node
						changed = state !== node[name];
						node[name] = state;
					}
					else {
						// Set through attribute because there is no such property
						changed = state !== node.hasAttribute(name);
						if (state)
							node.setAttribute(name, "");
						else
							node.removeAttribute(name);
					}
					if (changed) {
						// TODO: Remove this new feature again if all usage scenarios can use MutationObserver instead
						//let ancillaries = getNodeData(node, name + ".ancillaries");
						//if (ancillaries)
						//	ancillaries.forEach(a => a.F[name] = state);

						node.dispatchEvent(new Event(name + "change"));
					}

					if (name === "disabled") {
						if (node.matches("input, select, textarea") &&
							!node.matches("input[type=button], input[type=submit]")) {
							// Stop if this node is a .form-row .label (Frontfire UI form layout)
							if (node.classList.contains("label") &&
								node.parentElement &&
								node.parentElement.classList.contains("form-row"))
								return;

							// Also apply this state on parent or referenced label elements
							let parentLabel = node.closest("label");
							if (parentLabel && parentLabel !== node)
								new Frontfire(parentLabel).disabled = state;
							let id = node.id;
							if (id) {
								let label = document.querySelector('label[for="' + id + '"]');
								if (label && label !== node)
									new Frontfire(label).disabled = state;
							}

							// Find previous .label sibling up on the .form-row level (Frontfire UI form layout)
							let refNode = node;
							while (refNode.parentElement && !refNode.parentElement.classList.contains("form-row"))
								refNode = refNode.parentElement;
							let label = refNode.previousElementSibling;
							if (label && label.classList.contains("label"))
								new Frontfire(label).disabled = state;
						}
						else if (node.matches("a")) {
							// Disabling a link requires removing its href attribute. Backup and restore it.
							if (state && node.getAttribute("href")) {
								node.dataset.ffDisabledHref = node.getAttribute("href");
								node.removeAttribute("href");
							}
							else if (!state && node.dataset.ffDisabledHref) {
								node.setAttribute("href", node.dataset.ffDisabledHref);
								delete node.dataset.ffDisabledHref;
							}
						}
					}
				});
			}
		});
	}

	// Gets a value indicating whether all selected Nodes are disabled, or sets the disabled
	// property of all selected Nodes.
	// See also: Element.disabled
	defineElementStateProperty("disabled");

	// Gets a value indicating whether all selected Nodes are checked, or sets the checked
	// property of all selected Nodes.
	// See also: Element.checked
	defineElementStateProperty("checked");

	// Gets a value indicating whether all selected Nodes are selected, or sets the selected
	// property of all selected Nodes.
	// See also: Element.selected
	defineElementStateProperty("selected");

	// Gets a value indicating whether all selected Nodes are readonly, or sets the readonly
	// property of all selected Nodes.
	// See also: Element.readonly
	defineElementStateProperty("readonly");

	// ---------- Dimensions ----------

	// Gets the computed height of the first selected Node (as Number, in pixels), or sets the
	// height property of all selected Nodes (as Number, in pixels; or as string).
	// The value is affected by the element's box-sizing.
	// See also: jQuery.height()
	object_defineProperty(Frontfire_prototype, "height", {
		get: function () {
			if (this.length === 0)
				return 0;
			let height = getComputedStyle(this.array[0], null).height;
			if (height === "")
				return 0;
			return parseFloat(height);
			//return this.array[0].offsetHeight;   // rounds to integer
		},
		set: function (value) {
			if (isNumber(value))
				value += "px";
			this.forEach(n => n.style.height = value);
		}
	});

	// Gets the computed border box height of the first selected Node, or sets the border box height
	// of all selected Nodes, in pixels. The value is unaffected by the element's box-sizing and
	// will be compensated for as necessary.
	// See also: jQuery.outerHeight()
	object_defineProperty(Frontfire_prototype, "borderHeight", {
		get: function () {
			if (this.length === 0)
				return 0;
			let computedStyle = getComputedStyle(this.array[0], null);
			// TODO: computedStyle.height might be "" if unset (see above), then use another source (also for below cases)
			let height = parseFloat(computedStyle.height);
			if (computedStyle.boxSizing !== "border-box")
				height += getPaddingBorderAddHeight(computedStyle);
			return height;
		},
		set: function (value) {
			this.forEach(n => {
				let computedStyle = getComputedStyle(n, null);
				let height = value;
				if (computedStyle.boxSizing !== "border-box")
					height -= getPaddingBorderAddHeight(computedStyle);
				n.style.height = height + "px";
			});
		}
	});

	// Gets the computed padding box height of the first selected Node, or sets the padding box
	// height of all selected Nodes, in pixels. The value is unaffected by the element's box-sizing
	// and will be compensated for as necessary.
	// See also: jQuery.innerHeight()
	object_defineProperty(Frontfire_prototype, "paddingHeight", {
		get: function () {
			if (this.length === 0)
				return 0;
			let computedStyle = getComputedStyle(this.array[0], null);
			let height = parseFloat(computedStyle.height);
			if (computedStyle.boxSizing === "border-box")
				height -= parseFloat(computedStyle.borderTopWidth) + parseFloat(computedStyle.borderBottomWidth);
			else
				height += parseFloat(computedStyle.paddingTop) + parseFloat(computedStyle.paddingBottom);
			return height;
		},
		set: function (value) {
			this.forEach(n => {
				let computedStyle = getComputedStyle(n, null);
				let height = value;
				if (computedStyle.boxSizing === "border-box")
					height += parseFloat(computedStyle.borderTopWidth) + parseFloat(computedStyle.borderBottomWidth);
				else
					height -= parseFloat(computedStyle.paddingTop) + parseFloat(computedStyle.paddingBottom);
				n.style.height = height + "px";
			});
		}
	});

	// Gets the computed content box height of the first selected Node, or sets the content box
	// height of all selected Nodes, in pixels. The value is unaffected by the element's box-sizing
	// and will be compensated for as necessary.
	// See also: jQuery.height()
	object_defineProperty(Frontfire_prototype, "contentHeight", {
		get: function () {
			if (this.length === 0)
				return 0;
			let computedStyle = getComputedStyle(this.array[0], null);
			let height = parseFloat(computedStyle.height);
			if (computedStyle.boxSizing === "border-box")
				height -= getPaddingBorderAddHeight(computedStyle);
			return height;
		},
		set: function (value) {
			this.forEach(n => {
				let computedStyle = getComputedStyle(n, null);
				let height = value;
				if (computedStyle.boxSizing === "border-box")
					height += getPaddingBorderAddHeight(computedStyle);
				n.style.height = height + "px";
			});
		}
	});

	// Gets the computed width of the first selected Node (as Number, in pixels), or sets the
	// width property of all selected Nodes (as Number, in pixels; or as string).
	// The value is affected by the element's box-sizing.
	// See also: jQuery.width()
	object_defineProperty(Frontfire_prototype, "width", {
		get: function () {
			if (this.length === 0)
				return 0;
			let width = getComputedStyle(this.array[0], null).width;
			if (width === "")
				return 0;
			return parseFloat(width);
			//return this.array[0].offsetWidth;   // rounds to integer
		},
		set: function (value) {
			if (isNumber(value))
				value += "px";
			this.forEach(n => n.style.width = value);
		}
	});

	// Gets the computed border box width of the first selected Node, or sets the border box width
	// of all selected Nodes, in pixels. The value is unaffected by the element's box-sizing and
	// will be compensated for as necessary.
	// See also: HTMLElement.offsetWidth, jQuery.outerWidth()
	object_defineProperty(Frontfire_prototype, "borderWidth", {
		get: function () {
			if (this.length === 0)
				return 0;
			let computedStyle = getComputedStyle(this.array[0], null);
			let width = parseFloat(computedStyle.width);
			if (computedStyle.boxSizing !== "border-box")
				width += getPaddingBorderAddWidth(computedStyle);
			return width;
		},
		set: function (value) {
			this.forEach(n => {
				let computedStyle = getComputedStyle(n, null);
				let width = value;
				if (computedStyle.boxSizing !== "border-box")
					width -= getPaddingBorderAddWidth(computedStyle);
				n.style.width = width + "px";
			});
		}
	});

	// Gets the computed padding box width of the first selected Node, or sets the padding box width
	// of all selected Nodes, in pixels. The value is unaffected by the element's box-sizing and
	// will be compensated for as necessary.
	// See also: jQuery.innerWidth()
	object_defineProperty(Frontfire_prototype, "paddingWidth", {
		get: function () {
			if (this.length === 0)
				return 0;
			let computedStyle = getComputedStyle(this.array[0], null);
			let width = parseFloat(computedStyle.width);
			if (computedStyle.boxSizing === "border-box")
				width -= parseFloat(computedStyle.borderLeftWidth) + parseFloat(computedStyle.borderRightWidth);
			else
				width += parseFloat(computedStyle.paddingLeft) + parseFloat(computedStyle.paddingRight);
			return width;
		},
		set: function (value) {
			this.forEach(n => {
				let computedStyle = getComputedStyle(n, null);
				let width = value;
				if (computedStyle.boxSizing === "border-box")
					width += parseFloat(computedStyle.borderLeftWidth) + parseFloat(computedStyle.borderRightWidth);
				else
					width -= parseFloat(computedStyle.paddingLeft) + parseFloat(computedStyle.paddingRight);
				n.style.width = width + "px";
			});
		}
	});

	// Gets the computed content box width of the first selected Node, or sets the content box width
	// of all selected Nodes, in pixels. The value is unaffected by the element's box-sizing and
	// will be compensated for as necessary.
	// See also: jQuery.width()
	object_defineProperty(Frontfire_prototype, "contentWidth", {
		get: function () {
			if (this.length === 0)
				return 0;
			let computedStyle = getComputedStyle(this.array[0], null);
			let width = parseFloat(computedStyle.width);
			if (computedStyle.boxSizing === "border-box")
				width -= getPaddingBorderAddWidth(computedStyle);
			return width;
		},
		set: function (value) {
			this.forEach(n => {
				let computedStyle = getComputedStyle(n, null);
				let width = value;
				if (computedStyle.boxSizing === "border-box")
					width += getPaddingBorderAddWidth(computedStyle);
				n.style.width = width + "px";
			});
		}
	});

	// Returns the additional height of top and bottom padding and border of the element, in pixels.
	function getPaddingBorderAddHeight(computedStyle) {
		return parseFloat(computedStyle.paddingTop) + parseFloat(computedStyle.paddingBottom) +
			parseFloat(computedStyle.borderTopWidth) + parseFloat(computedStyle.borderBottomWidth);
	}

	// Returns the additional width of left and right padding and border of the element, in pixels.
	function getPaddingBorderAddWidth(computedStyle) {
		return parseFloat(computedStyle.paddingLeft) + parseFloat(computedStyle.paddingRight) +
			parseFloat(computedStyle.borderLeftWidth) + parseFloat(computedStyle.borderRightWidth);
	}

	// Gets the top location of the first selected Node in the document, or sets the top property of
	// all selected Nodes, in pixels.
	// Note that this is the rendered position that may be affected by CSS transforms.
	// See also: jQuery.offset()
	object_defineProperty(Frontfire_prototype, "top", {
		get: function () {
			if (this.length === 0)
				return 0;
			return this.array[0].getBoundingClientRect().top + window.scrollY;
		},
		set: function (value) {
			if (isNumber(value))
				value += "px";
			this.forEach(n => n.style.top = value);
		}
	});

	// Gets the left location of the first selected Node in the document, or sets the left property
	// of all selected Nodes, in pixels.
	// Note that this is the rendered position that may be affected by CSS transforms.
	// See also: jQuery.offset()
	object_defineProperty(Frontfire_prototype, "left", {
		get: function () {
			if (this.length === 0)
				return 0;
			return this.array[0].getBoundingClientRect().left + window.scrollX;
		},
		set: function (value) {
			if (isNumber(value))
				value += "px";
			this.forEach(n => n.style.left = value);
		}
	});

	// Gets the bottom location of the first selected Node in the document, considering its border
	// height, in pixels.
	// Note that this is the rendered position that may be affected by CSS transforms.
	// See also: jQuery.offset()
	object_defineProperty(Frontfire_prototype, "bottom", {
		get: function () {
			if (this.length === 0)
				return 0;
			return this.array[0].getBoundingClientRect().bottom + window.scrollY;
		}
	});

	// Gets the right location of the first selected Node in the document, considering its border
	// width, in pixels.
	// Note that this is the rendered position that may be affected by CSS transforms.
	// See also: jQuery.offset()
	object_defineProperty(Frontfire_prototype, "right", {
		get: function () {
			if (this.length === 0)
				return 0;
			return this.array[0].getBoundingClientRect().right + window.scrollX;
		}
	});

	// Gets the location and border size of the first selected Node in the document.
	// Note that this is the rendered position that may be affected by CSS transforms.
	// See also: jQuery.offset(), jQuery.outerWidth(), jQuery.outerHeight()
	object_defineProperty(Frontfire_prototype, "rect", {
		get: function () {
			if (this.length === 0)
				return null;
			let rect = {
				top: this.top,
				left: this.left,
				width: this.borderWidth,
				height: this.borderHeight
			};
			rect.right = rect.left + rect.width;
			rect.bottom = rect.top + rect.height;
			return rect;
		}
	});

	// ---------- jQuery interoperability ----------

	if (window.jQuery) {
		// Gets a jQuery instance that contains the selected Nodes.
		object_defineProperty(Frontfire_prototype, "$", {
			get: function () {
				return new jQuery(this.array);
			}
		});

		// Gets a Frontfire instance that contains the selected Nodes from jQuery.
		object_defineProperty(jQuery.fn, "F", {
			get: function () {
				return new Frontfire(this.toArray());
			}
		});
	}


	// ==================== Public methods ====================

	// Prints all selected Nodes to the console. (Undocumented method)
	Frontfire_prototype.log = function () {
		console.log("Nodes:", this.array);
		return this;   // Support chaining
	};


	// ==================== Collection management (overridden ArrayList methods) ====================

	// Quickly retrievable ID selectors
	const quickSelectorRegex = /^#[\w-]+$/;

	// Adds nodes to the end of the array or creates new nodes.
	// Returns the instance to support chaining.
	//
	// node:
	//   (String) A CSS selector that selects the nodes to add to this instance, or HTML code starting with "<".
	//   (Node) A Node to add to this instance.
	//   (NodeList|HTMLCollection) A collection of Nodes copied into this instance.
	//   (Array|ArrayList) A collection of which only the Nodes are copied into this instance.
	// single: (Boolean) Only adds a single element from a query. (Optional, default: false)
	Frontfire_prototype.add = function (node, single) {
		if (isString(node)) {
			if (node[0] === "<") {
				// HTML elements markup: create new nodes from markup
				let e = fromHTML(node, single);
				if (single)
					e && this.array.push(e);
				else
					e.forEach(n => this.array.push(n));
			}
			else {
				// CSS selector: find matching nodes
				if (!single && quickSelectorRegex.test(node)) {
					// ID selector
					// NOTE: This case isn't used for single selection because it would be slower with the regex test!
					let e = document.getElementById(node.substring(1));
					e && this.array.push(e);
				}
				else {
					// Unrecognised selector
					if (single) {
						let e = document.querySelector(node);
						e && this.array.push(e);
					}
					else {
						document.querySelectorAll(node).forEach(n => this.array.push(n));
					}
				}
			}
		}
		else if (node instanceof Node || node instanceof Window) {
			// Single node
			this.array.push(node);
		}
		else if (node instanceof NodeList) {
			// Nodes collection (static collection): make a copy
			if (single)
				node[0] && this.array.push(node[0]);
			else
				node.forEach(n => this.array.push(n));
		}
		else if (node instanceof HTMLCollection) {
			// HTML collection (live collection): make a static copy
			if (single) {
				node[0] && this.array.push(node[0]);
			}
			else {
				for (let i = 0; i < node.length; i++) {
					this.array.push(node[i]);
				}
			}
		}
		else if (node instanceof Array) {
			// Other array: copy only the nodes
			const nodes = node.filter(n => n instanceof Node || node instanceof Window);
			if (nodes.length > 0) {
				if (single)
					this.array.push(node[0]);
				else
					array_prototype.splice.apply(this.array, [this.array.length, 0].concat(nodes));
			}
		}
		else if (node instanceof ArrayList) {
			// Other array: copy only the nodes
			const nodes = node.where(n => n instanceof Node || node instanceof Window).array;
			if (nodes.length > 0) {
				if (single)
					this.array.push(node.get(0));
				else
					array_prototype.splice.apply(this.array, [this.array.length, 0].concat(nodes));
			}
		}
		else {
			argError(node, "node");
		}
		return this;   // Support chaining
	};

	// Adds nodes to the end of the array or creates new nodes. (Alias for add)
	Frontfire_prototype.addRange = Frontfire_prototype.add;

	// Inserts Nodes into the array at the specified index or creates new nodes.
	// Returns the instance to support chaining.
	Frontfire_prototype.insert = function (index, node) {
		if (isString(node)) {
			if (node[0] === "<") {
				// HTML elements markup: create new nodes from markup
				let nodes = fromHTML(node);
				array_prototype.splice.apply(this.array, [index, 0].concat(Array.from(nodes)));
			}
			else {
				// CSS selector: find matching nodes
				let nodes = document.querySelectorAll(node);
				array_prototype.splice.apply(this.array, [index, 0].concat(Array.from(nodes)));
			}
		}
		else if (node instanceof Node) {
			// Single node
			this.array.splice(index, 0, node);
		}
		else if (node instanceof NodeList || node instanceof HTMLCollection) {
			// Nodes collection (static collection): make a copy
			// HTML collection (live collection): make a static copy
			array_prototype.splice.apply(this.array, [index, 0].concat(Array.from(node)));
		}
		else if (node instanceof Array) {
			// Other array: copy only the nodes
			const nodes = node.filter(n => n instanceof Node);
			if (nodes.length > 0)
				array_prototype.splice.apply(this.array, [index, 0].concat(nodes));
		}
		else if (node instanceof ArrayList) {
			// Other array: copy only the nodes
			const nodes = node.where(n => n instanceof Node).array;
			if (nodes.length > 0)
				array_prototype.splice.apply(this.array, [index, 0].concat(nodes));
		}
		else {
			argError(node, "node");
		}
		return this;   // Support chaining
	};

	// Inserts Nodes into the array at the specified index or creates new nodes. (Alias for insert)
	Frontfire_prototype.insertRange = Frontfire_prototype.insert;

	// Replaces the first item in the array.
	Frontfire_prototype.replace = function (oldItem, newItem) {
		if (newItem instanceof Node) {
			return ArrayList_prototype.replace.apply(this, arguments);
		}
		else {
			argError(newItem, "newItem");
		}
	};

	// Sets the Node at the positive or negative index of the array.
	// Returns the instance to support chaining.
	Frontfire_prototype.set = function (index, node) {
		if (node instanceof Node) {
			ArrayList_prototype.set.apply(this, arguments);
		}
		else {
			argError(node, "node");
		}
		return this;   // Support chaining
	};


	// ==================== Node selection methods ====================

	// Returns the first element within the selected Nodes that match the specified CSS selector.
	// If the first selected Node has no match, the other selected Nodes are considered.
	// See also: Element.querySelector()
	Frontfire_prototype.querySelector = function (selector) {
		for (let i = 0; i < this.length; i++) {
			let match = this.array[i].querySelector(selector);
			if (match)
				return new Frontfire(match);
		}
		return null;
	};

	// Returns a list of the elements within the selected Nodes that match the specified CSS
	// selector.
	// See also: Element.querySelectorAll(), jQuery.find()
	Frontfire_prototype.querySelectorAll = function (selector) {
		return new Frontfire(this.select(n => Array.from(n.querySelectorAll(selector))).flat());
	};

	// Returns a list of the elements within the selected Nodes that are focusable (tabbable).
	// See also: jQuery UI :focusable selector
	Frontfire_prototype.queryFocusable = function () {
		const selector = "area[href],input,select,textarea,button,a,iframe,[tabindex],[contentEditable]";
		let selected = this.select(n => Array.from(n.querySelectorAll(selector))).flat();

		return new Frontfire(selected.where(element => {
			let focusableIfVisible;
			switch (element.nodeName.toLowerCase()) {
				case "area":
					let map = element.parentNode;
					let mapName = map.name;
					if (!mapName || map.nodeName.toLowerCase() !== "map")
						return false;
					img = document.querySelector("img[usemap='#" + mapName + "']");
					return img && hasLayoutSize(img);
				case "input":
				case "select":
				case "textarea":
				case "button":
					focusableIfVisible = !element.disabled;
					if (focusableIfVisible) {
						// Form controls within a disabled fieldset are disabled.
						// However, controls within the fieldset's legend do not get disabled.
						// Since controls generally aren't placed inside legends, we skip
						// this portion of the check.
						fieldset = element.closest("fieldset");
						if (fieldset)
							focusableIfVisible = !fieldset.disabled;
					}
					break;
				case "a":
					focusableIfVisible = element.href || element.tabindex !== undefined;
					break;
				default:
					focusableIfVisible = element.tabindex !== undefined;
					break;
			}
			return focusableIfVisible && hasLayoutSize(element) && isVisibilityVisible(element);
		}));
	};

	// Returns a list of the elements within the selected Nodes that satisfy a condition.
	Frontfire_prototype.findElements = function (predicate) {
		let allDescendants = new Set();
		this.forEach(n => n.querySelectorAll("*").forEach(e => allDescendants.add(e)));
		let result = new Frontfire();
		allDescendants.forEach(e => {
			if (predicate(e))
				result.add(e);
		});
		return result;
	};

	// Returns the selected Nodes that match the specified CSS selector, satisfy a condition or are
	// contained in the specified node collection.
	// See also: jQuery.filter()
	Frontfire_prototype.where = function (selector) {
		if (isString(selector)) {
			return new Frontfire(this.array.filter(n => n.matches(selector)));
		}
		else if (isFunction(selector)) {
			return new Frontfire(this.array.filter(n => selector(n)));
		}
		else if (selector instanceof NodeList ||
			selector instanceof HTMLCollection ||
			selector instanceof Array ||
			selector instanceof ArrayList) {
			// Nodes collection or other array or ArrayList (includes other Frontfire instance)
			return this.intersect(selector);
		}
		else {
			argError(selector, "selector");
		}
	};

	// TODO: Implement when needed. Slightly inefficient/uncomfortable alternative: .parents.takeWhile(!selector)
	//// Returns all distinct ancestor elements of all selected Nodes, up to but not including the
	//// element matched by the CSS selector or that satisfies a condition.
	//// See also: jQuery.parentsUntil()
	//Frontfire_prototype.parentsUntil = function (selector) {
	//	let parents = new Frontfire();
	//	this.forEach(n => {
	//		while (n = n.parentElement) {
	//			parents.add(n);
	//		}
	//	});
	//	return distinctIfNeeded(parents, this.length);
	//};

	// TODO: Implement when needed
	//// Returns the closest parent of each selected element that matches the predicate function.
	//// predicate: A function that is called with each parent as first argument and the starting element
	////   as second argument. If it returns true, the search is stopped and the parent element is added
	////   to the returned list.
	//Frontfire_prototype.parentWhere = function (predicate) {
	//	var ret = $();
	//	this.each(function (_, obj) {
	//		let parent = obj;
	//		do {
	//			if (predicate(parent, obj)) {
	//				ret = ret.add(parent);
	//				break;
	//			}
	//			parent = parent.parentElement;
	//		}
	//		while (parent);
	//	});
	//	return ret;
	//};

	// Traverses each selected Node and its parents (heading toward the document root) until it
	// finds a node that matches the CSS selector or satisfies a condition. Will return itself or
	// the matching ancestor, with duplicates removed. If no matching element is found for a
	// selected Node, it will not add to the returned collection.
	// See also: Element.closest(), jQuery.closest()
	Frontfire_prototype.closest = function (selector) {
		let result = new Frontfire();
		if (isString(selector)) {
			this.forEach(n => {
				let c = n.closest(selector);
				if (c)
					result.add(c);
			});
		}
		else if (isFunction(selector)) {
			this.forEach(n => {
				do {
					if (selector(n)) {
						result.add(n);
						break;
					}
				}
				while (n = n.parentElement);
			});
		}
		else {
			argError(selector, "selector");
		}
		return distinctIfNeeded(result, this.length);
	};

	// nextUntil/prevUntil
	// TODO: Implement when needed. Slightly inefficient/uncomfortable alternative: .nextElementSiblings.takeWhile(!selector)
	// See also: jQuery.nextUntil(), jQuery.prevUntil()

	// Reduces the selected Nodes to those that have a descendant that matches the CSS selector.
	// See also: jQuery.has()
	Frontfire_prototype.having = function (selector) {
		return this.where(n => n.querySelector(selector));
	};

	// Determines whether all selected Nodes would be selected by the CSS selector, in other words,
	// determines whether the element "is" the selector.
	// See also: Element.matches(), jQuery.is()
	Frontfire_prototype.matches = function (selector) {
		// Check length to return false if there is no node.
		return this.length > 0 && this.all(n => n.matches(selector));
	};


	// ==================== Style manipulation methods ====================

	// Displays the selected Nodes.
	Frontfire_prototype.show = function () {
		this.visible = true;
		return this;   // Support chaining
	};

	// Hides the selected Nodes.
	Frontfire_prototype.hide = function () {
		this.visible = false;
		return this;   // Support chaining
	};

	// Displays or hides the selected Nodes, each toggling their current state.
	// If the force parameter is set to true or false, it forces all nodes to always be displayed or
	// hidden instead of toggled.
	Frontfire_prototype.toggle = function (force) {
		this.forEach(n => {
			n = new Frontfire(n);
			if (isBoolean(force))
				n.visible = force;
			else
				n.visible = !n.visible;
		});
		return this;   // Support chaining
	};

	// Enables the selected Nodes.
	Frontfire_prototype.enable = function () {
		this.disabled = false;
		return this;   // Support chaining
	};

	// Disables the selected Nodes.
	Frontfire_prototype.disable = function () {
		this.disabled = true;
		return this;   // Support chaining
	};

	// Moves the selected Nodes to the specified position relative to the document.
	// If a Node's position style property is currently "static", it will be set to "relative" to
	// allow for this repositioning.
	Frontfire_prototype.moveTo = function (left, top) {
		this.forEach(n => {
			n = new Frontfire(n);
			if (n.computedStyle.position === "static")
				n.style.position = "relative";
			switch (n.computedStyle.position) {
				case "relative":
					// Update the relative position to match the requested absolute position
					let setLeft = parseFloat(n.style.left) || 0;
					let setTop = parseFloat(n.style.top) || 0;
					let absoluteLeft = n.left;
					let absoluteTop = n.top;
					n.left = setLeft + left - absoluteLeft;
					n.top = setTop + top - absoluteTop;
					break;
				case "absolute":
					// Update the position relative to its closest positioned ancestor
					let parent = n.closestPositionedParent;
					n.left = left - (parent?.left ?? 0);
					n.top = top - (parent?.top ?? 0);
					break;
				case "fixed":
					// Update the position relative to the viewport
				default:
					// Any other unsupported value, including "sticky"
					n.left = left;
					n.top = top;
					break;
			}
		});
		return this;   // Support chaining
	};

	// Starts an animation of two keyframes on the first selected Node and returns the new Animation
	// instance. The animation uses the fill-mode "forwards" so that its final frame remains active.
	// See also: Element.animate()
	//
	// data: (Object) An object that contains the CSS properties to animate and each an array of the
	//   start and end value of the animation.
	// duration: (Number) The duration of the animation, in milliseconds.
	// easing: (String) The easing function, defaults to the symmetric "ease-in-out".
	// keep: (Boolean) Indicates whether the final state should be persisted (true) or reverted
	//   (false). Defaults to true if unset.
	//
	// TODO: Keeping the final state keeps the animation alive, using memory and blocking further style updates. Find another solution. See MDN for Element.animate(). Note that offCanvas needs the animation to later reverse() it. - https://developer.mozilla.org/en-US/docs/Web/API/Animation#automatically_removing_filling_animations
	Frontfire_prototype.animateFromTo = function (data, duration, easing, keep) {
		let keyframes = [{}, {}];
		for (let key in data) {
			keyframes[0][camelCase(key)] = data[key][0];
			keyframes[1][camelCase(key)] = data[key][1];
		}
		if (this.length === 0)
			return null;
		let anim = this.first.animate(keyframes, {
			duration: duration,
			easing: easing || "ease-in-out",
			fill: keep === false ? "none" : "forwards"
		});
		//if (keep !== false) {
		//	anim.addEventListener("finish", () => {
		//		anim.commitStyles();
		//		anim.cancel();
		//	});
		//}
		return anim;
	};


	// ==================== DOM manipulation methods ====================

	// Assigns the first selected Node a unique ID if none is set, and returns the element's ID.
	//
	// prefix: A prefix for the new ID. If unset, "autoid" is used. The prefix is appended by the
	//   lowest numeric counter value that makes the ID unique, starting at 1.
	Frontfire_prototype.assignId = function (prefix) {
		if (!this.first.id) {
			if (!prefix)
				prefix = "autoid";
			let counter = 1;
			while (document.getElementById(prefix + counter)) {
				counter++;
			}
			this.first.id = prefix + counter;
		}
		return this.first.id;
	};

	// Removes all children from the selected Nodes.
	// See also: Element.replaceChildren(), jQuery.empty()
	Frontfire_prototype.empty = function () {
		this.forEach(node => {
			node.replaceChildren();
		});
		return this;   // Support chaining
	};

	// Gets or sets a value indicating whether all selected Nodes have the specified attribute.
	// See also: Element.hasAttribute()
	//
	// name:
	//   (String) The attribute name.
	Frontfire_prototype.hasAttribute = function (name) {
		// Check length to return false if there is no node.
		return this.length > 0 && this.all(n => splitBySpace(name).every(na => n.hasAttribute(na)));
	};

	// Gets an attribute value from the first selected Node.
	// See also: Element.getAttribute(), jQuery.attr()
	//
	// name:
	//   (String) The attribute name.
	Frontfire_prototype.getAttribute = function (name) {
		if (this.length === 0 || !this.array[0].hasAttribute(name))
			return null;
		return this.array[0].getAttribute(name);
	};

	// Sets an attribute on the selected Nodes.
	// See also: Element.setAttribute(), jQuery.attr()
	//
	// name:
	//   (String) A space-separated list of attribute names.
	//   (Array) The attribute names.
	// value: (String) The attribute value.
	Frontfire_prototype.setAttribute = function (name, value) {
		for (let na of splitBySpace(name)) {
			this.forEach(n => n.setAttribute(na, value));
		}
		return this;   // Support chaining
	};

	// Removes an attribute from the selected Nodes.
	// See also: Element.removeAttribute(), jQuery.attr()
	//
	// name:
	//   (String) A space-separated list of attribute names.
	//   (Array) The attribute names.
	Frontfire_prototype.removeAttribute = function (name) {
		for (let na of splitBySpace(name)) {
			this.forEach(n => n.removeAttribute(na));
		}
		return this;   // Support chaining
	};

	// Removes the selected Nodes from their parents.
	// See also: ChildNode.remove(), jQuery.remove()
	// NOTE: The effect of this method differs from the base class ArrayList.remove().
	//       To call the base class implementation, change the interface with the 'L' property.
	Frontfire_prototype.remove = function () {
		this.forEach(n => n.remove());
		return this;   // Support chaining
	};

	// Removes the selected Nodes that satisfy a condition from their parents.
	// NOTE: The effect of this method differs from the base class ArrayList.removeAll().
	//       To call the base class implementation, change the interface with the 'L' property.
	Frontfire_prototype.removeAll = function (predicate) {
		this.where(predicate).forEach(n => n.remove());
		return this;   // Support chaining
	};

	// Removes the selected Node by index from its parent.
	// NOTE: The effect of this method differs from the base class ArrayList.removeAt().
	//       To call the base class implementation, change the interface with the 'L' property.
	Frontfire_prototype.removeAt = function (index) {
		const node = this.get(index);
		if (node)
			node.remove();
		return this;   // Support chaining
	};

	// Removes the first selected Node from its parent.
	// NOTE: The effect of this method differs from the base class ArrayList.removeFirst().
	//       To call the base class implementation, change the interface with the 'L' property.
	Frontfire_prototype.removeFirst = function () {
		const node = this.get(0);
		if (node)
			node.remove();
		return this;   // Support chaining
	};

	// Removes the last selected Node from its parent.
	// NOTE: The effect of this method differs from the base class ArrayList.removeLast().
	//       To call the base class implementation, change the interface with the 'L' property.
	Frontfire_prototype.removeLast = function () {
		const node = this.get(-1);
		if (node)
			node.remove();
		return this;   // Support chaining
	};

	// Removes many of the selected Nodes from their parents.
	// NOTE: The effect of this method differs from the base class ArrayList.removeRange().
	//       To call the base class implementation, change the interface with the 'L' property.
	Frontfire_prototype.removeRange = function (start, count) {
		this.getRange(start, count).forEach(n => n.remove());
		return this;   // Support chaining
	};

	// Replaces the selected Nodes with other content. If existing Nodes are provided as new content
	// and multiple Nodes are to be replaced, the source Nodes will be moved to the first target and
	// then cloned from the second target on.
	// See also: Element.replaceWith(), jQuery.replaceWith()
	Frontfire_prototype.replaceWith = function (content) {
		if (isString(content)) {
			// HTML string
			this.forEach(n => n.outerHTML = content);
		}
		else if (isFunction(content)) {
			// Generator function
			this.forEach(n => {
				let c = content(n);
				if (isString(c))
					n.outerHTML = c;
				else if (isIterable(c))
					n.replaceWith(...c);
				else
					n.replaceWith(c);
			});
		}
		else if (content instanceof NodeList ||
			content instanceof HTMLCollection ||
			content instanceof Array ||
			content instanceof ArrayList) {
			// Nodes collection or other array or ArrayList (includes other Frontfire instance)
			this.forEach((n, i) => {
				if (i === 0) {
					n.replaceWith(...content);
				}
				else {
					let clone = Array.from(content).map(c => c.cloneNode(true));
					n.replaceWith(...clone);
				}
			});
		}
		else if (content instanceof Node) {
			// Single Node instance
			this.forEach((n, i) => {
				if (i === 0) {
					n.replaceWith(content);
				}
				else {
					let clone = content.cloneNode(true);
					n.replaceWith(clone);
				}
			});
		}
		else {
			argError(content, "content");
		}
		return this;   // Support chaining
	};

	// replaceAll
	// TODO: Implement when needed. Reverse notation of replaceWith()
	// See also: jQuery.replaceAll()

	function move(content, position, reverse) {
		if (reverse)
			content = new ArrayList(content).reversed();
		content.forEach(c => {
			if (isString(c)) {
				this.forEach(node => node.insertAdjacentHTML(position, c));
			}
			else {
				if (c.forEach || c instanceof HTMLCollection) {
					c = new ArrayList(c);
					if (reverse)
						c = c.reversed();
					c.forEach(c => {
						this.forEach((node, i) => node.insertAdjacentElement(position, i === 0 ? c : c.cloneNode(true)));
					});
				}
				else {
					this.forEach((node, i) => node.insertAdjacentElement(position, i === 0 ? c : c.cloneNode(true)));
				}
			}
		});
		return this;   // Support chaining
	}

	// Inserts the content before each selected Node.
	// See also: ChildNode.before(), Element.insertAdjacentElement("beforebegin"), jQuery.before()
	//
	// arguments:
	//   (String) An HTML string to insert.
	//   (NodeList|HTMLCollection|Array|ArrayList) The nodes to insert.
	//   (Node) A node to insert.
	Frontfire_prototype.before = function () {
		return move.call(this, [...arguments], "beforebegin", false);
	};

	// Inserts the content at the beginning of each selected Node.
	// See also: Element.prepend(), Element.insertAdjacentElement("afterbegin"), jQuery.prepend()
	//
	// arguments:
	//   (String) An HTML string to insert.
	//   (NodeList|HTMLCollection|Array|ArrayList) The nodes to insert.
	//   (Node) A node to insert.
	Frontfire_prototype.prepend = function () {
		return move.call(this, [...arguments], "afterbegin", true);
	};

	// Inserts the content at the end of each selected Node.
	// See also: Element.append(), Node.appendChild(), Element.insertAdjacentElement("beforeend"), jQuery.append()
	//
	// arguments:
	//   (String) An HTML string to insert.
	//   (NodeList|HTMLCollection|Array|ArrayList) The nodes to insert.
	//   (Node) A node to insert.
	Frontfire_prototype.append = function () {
		return move.call(this, [...arguments], "beforeend", false);
	};

	// Inserts the content after each selected Node.
	// See also: ChildNode.after(), Element.insertAdjacentElement("afterend"), jQuery.after()
	//
	// arguments:
	//   (String) An HTML string to insert.
	//   (NodeList|HTMLCollection|Array|ArrayList) The nodes to insert.
	//   (Node) A node to insert.
	Frontfire_prototype.after = function () {
		return move.call(this, [...arguments], "afterend", true);
	};

	function moveTo(target, position, reverse) {
		if (isString(target))
			target = new Frontfire(target);
		let self = this;
		if (reverse)
			self = self.reversed();
		if (target.forEach) {
			target.forEach((t, i) => {
				self.forEach(node => t.insertAdjacentElement(position, i === 0 ? node : node.cloneNode(true)));
			});
		}
		else {
			self.forEach(node => target.insertAdjacentElement(position, node));
		}
		return this;   // Support chaining
	}

	// Inserts the selected Nodes before the target.
	// See also: ChildNode.before(), Element.insertAdjacentElement("beforebegin") (reversed notation), jQuery.insertBefore()
	//
	// target:
	//   (NodeList|HTMLCollection|Array|ArrayList) The target nodes.
	//   (Node) A target node.
	Frontfire_prototype.insertBefore = function (target) {
		return moveTo.call(this, target, "beforebegin", false);
	};

	// Inserts the selected Nodes at the beginning of the target.
	// See also: Element.prepend(), Element.insertAdjacentElement("afterbegin") (reversed notation), jQuery.prependTo()
	//
	// target:
	//   (NodeList|HTMLCollection|Array|ArrayList) The target nodes.
	//   (Node) A target node.
	Frontfire_prototype.prependTo = function (target) {
		return moveTo.call(this, target, "afterbegin", true);
	};

	// Inserts the selected Nodes at the end of the target.
	// See also: Element.append(), Node.appendChild(), Element.insertAdjacentElement("beforeend") (reversed notation), jQuery.appendTo()
	//
	// target:
	//   (NodeList|HTMLCollection|Array|ArrayList) The target nodes.
	//   (Node) A target node.
	Frontfire_prototype.appendTo = function (target) {
		return moveTo.call(this, target, "beforeend", false);
	};

	// Inserts the selected Nodes after the target.
	// See also: ChildNode.after(), Element.insertAdjacentElement("afterend") (reversed notation), jQuery.insertAfter()
	//
	// target:
	//   (NodeList|HTMLCollection|Array|ArrayList) The target nodes.
	//   (Node) A target node.
	Frontfire_prototype.insertAfter = function (target) {
		return moveTo.call(this, target, "afterend", true);
	};

	// Wraps an HTML structure around each of the selected Nodes.
	// See also: jQuery.wrap()
	//
	// wrapper:
	//   (String) The HTML code to create a wrapper element from. The wrapped element will be
	//     appended to that wrapper element.
	//   (Function) A function that returns a wrapper element.
	//   (Node) A node that is used as the wrapper element. If multiple selected Nodes are wrapped,
	//     a clone of the node is used from the second on.
	//   (Frontfire) A Frontfire instance whose first selected Node is used as the wrapper element.
	Frontfire_prototype.wrap = function (wrapper) {
		let clone;
		if (wrapper instanceof Frontfire) {
			// Make an untouched backup of the first node
			clone = wrapper.first.cloneNode(true);
		}

		this.forEach((n, i) => {
			let w = wrapper;
			if (isFunction(w)) {
				w = w(n);
			}
			// Also support any type for the function return value
			if (isString(w)) {
				w = fromHTML(w, true);
			}
			else if (w instanceof Node) {
				if (i > 0)
					w = w.cloneNode(true);
			}
			else if (w instanceof Frontfire) {
				// Use the original element once and then clones of the backup
				w = i === 0 ? w.first : clone.cloneNode(true);
			}
			else {
				argError(wrapper, "wrapper");
			}
			n.replaceWith(w);
			w.append(n);
		});
		return this;   // Support chaining
	};

	// Replaces the parent of each selected Node with the selected Node itself, removing their parents.
	// See also: jQuery.unwrap()
	Frontfire_prototype.unwrap = function () {
		this.forEach(n => {
			let p = n.parentElement;
			if (p)
				p.replaceWith(n);
		});
		return this;   // Support chaining
	};

	// Returns a clone, or duplicate, of the selected Nodes, including their subtrees but not
	// including any event listeners.
	// See also: Node.cloneNode(), jQuery.clone()
	// NOTE: The effect of this method differs from the base class ArrayList.clone().
	//       To call the base class implementation, change the interface with the 'L' property.
	Frontfire_prototype.clone = function () {
		return new Frontfire(this.select(n => n.cloneNode(true)));
	};

	// Calls a function when the disabled state of any of the selected Nodes changes.
	// The action function is called with these parameters:
	// - disabled state (boolean)
	// - changed element
	Frontfire_prototype.observeDisabled = function (action) {
		let observers = [];
		this.forEach(source => {
			let observer = new MutationObserver((mutationsList, observer) => {
				mutationsList.forEach(mutation => action(new Frontfire(source).disabled, source));
			});
			observer.observe(source, { attributes: true, attributeFilter: ["disabled"] });
			// The observer will go away when the source node is removed, see comment:
			// https://stackoverflow.com/a/35253703
			observers.push(observer);
		});

		// Return object with methods to control the created MutationObserver instances
		return {
			// Stops the MutationObserver instances from receiving further notifications.
			undo: () => {
				observers.forEach(o => o.disconnect());
			}
		};
	};


	// ==================== Scroll methods ====================

	// Determines whether the first selected element is scrollable.
	Frontfire_prototype.isScrollable = function () {
		return isScrollable(this.first);
	};

	// Returns the closest scrolling parent element of the first selected element. If the element
	// itself can already scroll, it is returned.
	// Source: https://htmldom.dev/get-the-first-scrollable-parent-of-an-element/
	Frontfire_prototype.closestScrollable = function () {
		return new Frontfire(closestScrollable(this.first));
	};

	// Returns the vertical offset of the first selected element relative to the specified parent.
	// If the parent ist not an ancestor of the element, undefined is returned.
	Frontfire_prototype.getRelativeTop = function (parent) {
		let element = this.first;
		if (parent instanceof ArrayList)
			parent = parent.first;
		return getRelativeTop(element, parent);
	};

	// Determines whether the first selected element is fully visible in its scrolling parent.
	Frontfire_prototype.isScrollVisible = function () {
		let element = this.first;
		let scrollable = closestScrollable(element.parentElement ?? element);
		let top = getRelativeTop(element, scrollable);
		// getRelativeTop measures from top of the parent border, scrolling starts at bottom of border
		top -= parseFloat(scrollable.F.computedStyle.borderTopWidth);
		let bottom = top + element.offsetHeight;
		let viewTop = scrollable.scrollTop;
		let viewBottom = viewTop + scrollable.clientHeight;
		return viewTop <= top && viewBottom >= bottom;
	};

	// Scrolls the first selected element into view in its scrolling parent, if it is not already
	// fully visible. If the element does not fit in the view height, it is aligned at the top edge.
	// margin: Vertical margin to keep clear (top and bottom as single number or both values in an array), in pixels. (Optional)
	// smooth: Indicates whether the scrolling should animate smoothly. (Optional, default: false)
	// recursive: Indicates whether scrollable parents are also scrolled into view. (Optional, default: false)
	Frontfire_prototype.scrollIntoView = function (margin, smooth, recursive) {
		let element = this.first;
		if (element)
			scrollElement(element, margin, smooth, recursive, "");
		return this;   // Support chaining
	};

	// Scrolls the first selected element to the top of its scrolling parent.
	// topMargin: Top margin to keep clear, in pixels. (Optional)
	// smooth: Indicates whether the scrolling should animate smoothly. (Optional, default: false)
	// recursive: Indicates whether scrollable parents are also scrolled to the top. (Optional, default: false)
	Frontfire_prototype.scrollToTop = function (topMargin, smooth, recursive) {
		let element = this.first;
		if (element)
			scrollElement(element, topMargin, smooth, recursive, "top");
		return this;   // Support chaining
	};

	// Scrolls the first selected element to the bottom of its scrolling parent.
	// bottomMargin: Bottom margin to keep clear, in pixels. (Optional)
	// smooth: Indicates whether the scrolling should animate smoothly. (Optional, default: false)
	// recursive: Indicates whether scrollable parents are also scrolled to the bottom. (Optional, default: false)
	Frontfire_prototype.scrollToBottom = function (bottomMargin, smooth, recursive) {
		let element = this.first;
		if (element)
			scrollElement(element, bottomMargin, smooth, recursive, "bottom");
		return this;   // Support chaining
	};

	function scrollElement(element, margin, smooth, recursive, position) {
		let scrollable = closestScrollable(element.parentElement ?? element);
		let top = getRelativeTop(element, scrollable);
		// getRelativeTop measures from top of the parent border, scrolling starts at bottom of border
		top -= parseFloat(scrollable.F.computedStyle.borderTopWidth);
		let bottom = top + element.offsetHeight;
		let viewTop = scrollable.scrollTop;
		let viewBottom = viewTop + scrollable.clientHeight;

		// Keep margin by pretending the element is larger
		if (isNumber(margin)) {
			top -= margin;
			bottom += margin;
		}
		else if (Array.isArray(margin)) {
			top -= margin[0];
			bottom += margin[1];
		}

		let newScrollTop = scrollable.scrollTop;
		switch (position) {
			case "top":
				newScrollTop = top;
				break;
			case "bottom":
				newScrollTop = bottom - scrollable.clientHeight;
				break;
			default:
				if (viewBottom < bottom)
					newScrollTop = bottom - scrollable.clientHeight;
				if (viewTop > top)
					newScrollTop = top;
				break;
		}
		if (newScrollTop !== scrollable.scrollTop)
			scrollable.scrollTo({
				top: newScrollTop,
				behavior: smooth ? "smooth" : "auto"
			});

		if (recursive && scrollable !== document.documentElement) {
			//scrollable.F.scrollIntoView(margin, recursive);
			scrollElement(scrollable, margin, smooth, recursive, position);
		}
	}

	function isScrollable(element) {
		let hasScrollableContent = element.scrollHeight > element.clientHeight;
		let overflowY = getComputedStyle(element).overflowY;
		let isOverflowHidden = overflowY.indexOf("hidden") !== -1;
		let isOverflowVisible = overflowY === "visible";
		return hasScrollableContent && !isOverflowHidden && !isOverflowVisible;
	}

	function closestScrollable(element) {
		do {
			if (isScrollable(element))
				return element;
			element = element.parentElement;
		}
		while (element);
		return document.documentElement;
	}

	function getRelativeTop(element, parent) {
		let top = 0;
		while (true) {
			let elementParent = element.parentElement;
			if (!elementParent)
				return;   // The specified base parent was not found
			top += element.offsetTop;
			// Only subtract the parent's offsetTop if both have the same offsetParent. If they're
			// different, the parent is itself the element's offsetParent and will have its own
			// offsetTop to another offsetParent. Only sum up offsets in the steps we're traversing
			// the tree.
			if (elementParent !== element.offsetParent)
				top -= elementParent.offsetTop;
			// Traverse the tree to parentElement, not to offsetParent which would be too far if the
			// specified base parent is not positioned, i.e. is "position: static"
			element = elementParent;
			// Stop at the specified base parent
			if (element === parent)
				return top;
		}
	}


	// ==================== Event handler methods ====================

	// Adds an event handler to the selected Nodes for the specified event types. If the handler was
	// already added with once(), it is changed to a permanent handler. A handler will only be added
	// once for each event type (just like the DOM methods, and unlike jQuery).
	// See also: EventTarget.addEventListener(), jQuery.on()
	//
	// types:
	//   (String) A space-separated list of event types.
	//   (Array) The event types.
	// handler: (Function) The event handler to add.
	//
	// The type names can contain class names similar to a CSS selector to identify them and allow
	// them to be removed later.
	// If the type name starts with a greater-than sign (>), the handler is registered for the
	// capture phase.
	// If the type name (without class names, i.e. before any period character) is appended by an
	// exclamation mark (!), the handler is also called immediately, with a fake event object that
	// contains the most important members.
	//
	// NOTE: The event management methods on, off and once are related to the DOM methods
	// addEventListener and removeEventListener, but not strictly compatible. The Frontfire methods
	// have a different behaviour in that they maintain their own event handler registration that is
	// required for the enhanced comfort of removing a handler without specifying its function.
	// Also, while the DOM method provides the 'once' and 'signal' options, these will remove the
	// event handler without telling anybody so our registrations would not be updated correctly.
	// It's for this essential behavioural difference that the Frontfire methods deliberately use
	// different (and shorter) names.
	//
	// TODO: Add support for the passive option
	// - https://developer.mozilla.org/en-US/docs/Web/API/EventTarget/addEventListener#improving_scrolling_performance_with_passive_listeners
	Frontfire_prototype.on = function (types, handler) {
		splitBySpace(types).forEach(type => {
			// Split type and class names separated by a period (.)
			let classList = type.split(".");
			type = classList[0];
			classList.splice(0, 1);

			// Check if the handler should be immediately invoked
			let callImmediately = type.endsWith("!");
			if (callImmediately)
				type = type.substring(0, type.length - 1);

			// Check if the handler is registered for the capture phase
			let rawType = type;
			let options = {};
			let capture = type.startsWith(">");
			if (capture) {
				type = type.substring(1);
				options.capture = true;
			}

			this.forEach(node => {
				let handlers = getNodeData(node, "event." + rawType, [], true);
				let entry = handlers.find(x => x.userHandler === handler);
				if (entry) {
					// Handler is already known
					if (entry.once) {
						// Change once to permanent
						node.removeEventListener(type, entry.realHandler, options);
						entry.realHandler = handler;
						entry.once = false;
					}
					// Always update the class list
					entry.classList = classList;
					// DOM won't call it twice, but add it anyway in case the metadata got confused
					// (which can happen when mixing on/off with add/removeEventListener calls)
					node.addEventListener(type, handler, options);
				}
				else {
					// Handler is yet unknown
					node.addEventListener(type, handler, options);
					handlers.push({
						userHandler: handler,
						realHandler: handler,
						classList: classList
					});
				}

				// Call with a fake event object that should help in most cases
				if (callImmediately) {
					handler({
						currentTarget: node,
						target: node,
						type: type,
						preventDefault: () => {},
						stopPropagation: () => {}
					});
				}
			});
		});
		return this;   // Support chaining
	};

	// Adds an event handler to the selected Nodes for the specified event types. When the event is
	// triggered, the event handler is removed for future events, i.e. the handler is only called
	// once. If the handler was already added with on(), it is changed to a one-time handler. A
	// handler will only be added once for each event type.
	// See also: jQuery.one()
	//
	// types:
	//   (String) A space-separated list of event types.
	//   (Array) The event types.
	// handler: (Function) The event handler to add.
	//
	// The type names can contain class names similar to a CSS selector to identify them and allow
	// them to be removed later.
	// If the type name starts with a greater-than sign (>), the handler is registered for the
	// capture phase.
	Frontfire_prototype.once = function (types, handler) {
		splitBySpace(types).forEach(type => {
			// Split type and class names separated by a period (.)
			let classList = type.split(".");
			type = classList[0];
			classList.splice(0, 1);

			// Check if the handler is registered for the capture phase
			let rawType = type;
			let options = {};
			let capture = type.startsWith(">");
			if (capture) {
				type = type.substring(1);
				options.capture = true;
			}

			this.forEach(node => {
				// The wrapped handler removes the event on first invocation
				let wrappedHandler = event => {
					// Remove this handler
					let handlers = getNodeData(node, "event." + rawType);
					if (handlers) {
						removeEventHandler(node, rawType, type, handlers, handler, options);
					}
					// Call the handler once
					handler(event);
				};

				let handlers = getNodeData(node, "event." + rawType, [], true);
				let entry = handlers.find(x => x.userHandler === handler);
				if (entry) {
					// Handler is already known
					if (!entry.once) {
						// Change permanent to once
						node.removeEventListener(type, entry.realHandler, options);
						node.addEventListener(type, wrappedHandler, options);
						entry.realHandler = wrappedHandler;
						entry.once = true;
					}
					// Otherwise, don't add it a second time
					// Always update the class list
					entry.classList = classList;
				}
				else {
					// Handler is yet unknown
					node.addEventListener(type, wrappedHandler, options);
					handlers.push({
						userHandler: handler,
						realHandler: wrappedHandler,
						once: true,
						classList: classList
					});
				}
			});
		});
		return this;   // Support chaining
	};

	// Removes an event handler from the selected Nodes for the specified event types.
	// Removing without specifying a handler can only remove those handlers that were added with the
	// on() or once() methods.
	// See also: EventTarget.removeEventListener(), jQuery.off()
	//
	// types:
	//   (String) A space-separated list of event types.
	//   (Array) The event types.
	// handler: (Function) The event handler to remove. If unset, all handlers for the event types
	//   are removed.
	//
	// The type names can contain class names similar to a CSS selector to select the handlers to be
	// removed by their set classes. Only those handlers are removed that have all specified class
	// names set. If classes but no type was specified, all registered event types are considered
	// for removal. Event classes are ignored if a specific handler to remove is provided.
	// If the type name starts with a greater-than sign (>), the handler is removed for the capture
	// phase.
	Frontfire_prototype.off = function (types, handler) {
		splitBySpace(types).forEach(type => {
			// Split type and class names separated by a period (.)
			let classList = type.split(".");
			type = classList[0];
			classList.splice(0, 1);

			this.forEach(node => {
				let types;
				if (type !== "") {
					// Event type is specified
					types = [type];
				}
				else {
					// Find all registered event types
					types = getNodeDataKeys(node)
						.filter(k => k.startsWith("event."))
						.map(k => k.substring(6));
				}

				types.forEach(type => {
					// Check if the handler is registered for the capture phase
					let rawType = type;
					let options = {};
					let capture = type.startsWith(">");
					if (capture) {
						type = type.substring(1);
						options.capture = true;
					}

					let handlers = getNodeData(node, "event." + rawType);
					if (handlers) {
						if (handler !== undefined) {
							// Remove a specific handler (ignore event classes)
							removeEventHandler(node, rawType, type, handlers, handler, options);
						}
						else {
							// Remove all handlers with matching classes (if specified)
							handlers.forEach((entry, i) => {
								if (classList.every(c => entry.classList.includes(c))) {
									node.removeEventListener(type, entry.realHandler, options);
									handlers.splice(i, 1);
								}
							});
							if (handlers.length === 0)
								deleteNodeData(node, "event." + rawType);
						}
					}
				});
			});
		});
		return this;   // Support chaining
	};

	function removeEventHandler(node, rawType, type, handlers, handler, options) {
		let entryIndex = handlers.findIndex(x => x.userHandler === handler);
		if (entryIndex !== -1) {
			node.removeEventListener(type, handlers[entryIndex].realHandler, options);
			handlers.splice(entryIndex, 1);
			if (handlers.length === 0)
				deleteNodeData(node, "event." + rawType);
		}
		else {
			// Remove it anyway in case the metadata got confused
			// (which can happen when mixing on/off with add/removeEventListener calls)
			node.removeEventListener(type, handler, options);
		}
	}

	// Returns all event listeners currently registered with the on() and once() methods.
	//
	// filterTypes: (Optional)
	//   (String) A space-separated list of event types to filter the returned event listeners to.
	//   (Array) The event types to filter the returned event listeners to.
	//
	// The returned array contains objects with the following keys:
	// - node: The node to which the listener is attached.
	// - type: The plain event type (without Frontfire-specific extensions).
	// - capture: Indicates whether the event is handled in the capture phase.
	// - classList: An array containing the class names of the event listener.
	// - userHandler: The handler that was specified for the on() or once() method.
	// - realHandler: The handler that was added to the DOM object. This is a wrapper function for
	//     once() listeners.
	// - once: Indicates whether the listener is unregistered after the first triggered event.
	// The objects in the returned array are copies, so changes to them will not affect the actual
	// event listener registrations.
	//
	// The type names can contain class names similar to a CSS selector to select the handlers to be
	// returned by their set classes. Only those handlers are returned that have all specified class
	// names set. If classes but no type was specified, all registered event types are considered.
	// If the type name starts with a greater-than sign (>), only handlers for the capture phase are
	// returned.
	Frontfire_prototype.getEventListeners = function (filterTypes) {
		let filter = [];
		splitBySpace(filterTypes).forEach(filterType => {
			// Split type and class names separated by a period (.)
			let filterClassList = filterType.split(".");
			filterType = filterClassList[0];
			filterClassList.splice(0, 1);
			filter.push({
				type: filterType,
				classList: filterClassList
			});
		});

		let result = [];
		this.forEach(node => {
			let types = getNodeDataKeys(node)
				.filter(k => k.startsWith("event."))
				.map(k => k.substring(6));
			types.forEach(type => {
				let handlers = getNodeData(node, "event." + type, []);
				handlers.forEach(handler => {
					if (filter.length > 0) {
						for (let i = 0; i < filter.length; i++) {
							if (filter[i].type && type !== filter[i].type ||
								filter[i].classList.some(c => !handler.classList.includes(c))) {
								// Filter condition not met, don't add this one to the results
								return;
							}
						}
					}

					let plainType = type;
					let capture = plainType.startsWith(">");
					if (capture) {
						plainType = plainType.substring(1);
						options.capture = true;
					}

					result.push(Object.assign({ node, type: plainType, capture }, handler));
				});
			});
		});
		return result;
	};

	// Determines whether any event listener is currently registered with the on() or once() method.
	//
	// filterTypes: (Optional)
	//   (String) A space-separated list of event types to match.
	//   (Array) The event types to match.
	//
	// The type names can contain class names similar to a CSS selector to select the handlers to be
	// returned by their set classes. Only those handlers are returned that have all specified class
	// names set. If classes but no type was specified, all registered event types are considered.
	// If the type name starts with a greater-than sign (>), only handlers for the capture phase are
	// returned.
	Frontfire_prototype.hasEventListeners = function (filterTypes) {
		return this.getEventListeners(filterTypes).length > 0;
	};

	// Finds an element along the event capturing or bubbling path. This can be used to implement
	// delegated event handlers. While the handler is called for the registered element, it can
	// check if the event was actually triggered for one of its descendant elements.
	// In the event capturing phase, returns the first matched element (from currentTarget, where
	// the event handler has been attached, downwards to target, where the event occurred), or null
	// if none was found.
	// In the event bubbling phase, returns the first matched element (from target, where the event
	// occurred, upwards to currentTarget, where the event handler has been attached), or null if
	// none was found.
	// Along the search path, event.target is always included and event.currentTarget is always
	// excluded.
	//
	// event: The event object.
	// selector:
	//   (String) The CSS selector of elements to match.
	//   (Node) The element to find.
	Frontfire.findEventTarget = (event, selector) => {
		if (event.eventPhase === 1) {
			// Capturing, return the highest matching element between target and currentTarget
			let lastTarget = null;
			for (let target = event.target; target && target !== event.currentTarget; target = target.parentElement) {
				if (isString(selector) && target.matches(selector) || target === selector)
					lastTarget = target;
			}
			return lastTarget;
		}
		if (event.eventPhase === 3) {
			// Bubbling, return the deepest matching element between target and currentTarget
			for (let target = event.target; target && target !== event.currentTarget; target = target.parentElement) {
				if (isString(selector) && target.matches(selector) || target === selector)
					return target;
			}
		}
		return null;
	};

	// Triggers the specified event types on all selected Nodes, synchronously invoking all added
	// handlers in the order they were added.
	// Returns all dispatched events, for the caller to inspect their properties that may have been
	// set by the event handlers.
	// See also: EventTarget.dispatchEvent(), jQuery.trigger()
	//
	// types:
	//   (String) A space-separated list of event types.
	//   (Array) The event types.
	// options: (Object) The options passed to the Event constructor. (Optional)
	// eventInit: (Object) An object containing additional event properties to be set. (Optional)
	// eventClass: (Function) The event class to instantiate. If skipped, CustomEvent is used. (Optional)
	//
	// The type names can contain class names similar to a CSS selector to select the handlers to be
	// called by their set classes. Only those handlers are called directly that have all specified
	// class names set. The downside of using classes is that the argument passed to the handler
	// loses its type and is a full copy of the original event object. This is necessary to set its
	// currentTarget and target properties that are otherwise read-only.
	// If no class names are specified, the event is triggered natively.
	Frontfire_prototype.trigger = function (types, options, eventInit, eventClass) {
		let events = new ArrayList();
		splitBySpace(types).forEach(type => {
			// Split type and class names separated by a period (.)
			let classList = type.split(".");
			type = classList[0];
			classList.splice(0, 1);

			this.forEach(node => {
				let event;
				if (eventClass)
					event = new eventClass(type, options);
				else
					event = new CustomEvent(type, options);
				if (eventInit)
					Object.assign(event, eventInit);
				if (classList.length > 0) {
					// Directly call all handlers with matching classes
					let handlers = getNodeData(node, "event." + type);
					if (handlers) {
						let newEvent = {};
						for (let property in event) {
							newEvent[property] = event[property];
						}
						newEvent.currentTarget = node;
						newEvent.target = node;
						handlers.forEach(entry => {
							if (classList.every(c => entry.classList.includes(c))) {
								entry.realHandler(newEvent);
							}
						});
						events.add(newEvent);
					}
				}
				else {
					// Dispatch event natively to all handlers
					node.dispatchEvent(event);
					events.add(event);
				}
			});
		});
		return events;
	};

	// Adds an event handler for the DOMContentLoaded event and runs it if that event has already
	// been triggered.
	// See also: jQuery.ready()
	//
	// This event handler could only be removed again by directly calling
	// document.removeEventListener("DOMContentLoaded", handler).
	Frontfire.onReady = function (handler) {
		if (document.readyState !== "loading") {
			handler();
		}
		else {
			document.addEventListener("DOMContentLoaded", handler);
		}
	};

	// Forwards the most common user interaction events from the first selected element to the
	// specified target element. This can bridge the gap between an original element in the document
	// and a visual replacement element that was generated by Frontfire. The forwarded events are
	// cancelled on the target element to avoid double-invocation of events like "click".
	Frontfire_prototype.forwardUIEvents = function (target, excludeTypes) {
		let source = this.first;
		if (!source) return;   // Nothing to do
		if (target instanceof ArrayList)
			target = target.first;

		let types = "blur click contextmenu dblclick focus focusin focusout input keydown keyup " +
			"pointercancel pointerdown pointerenter pointerleave pointermove pointerout " +
			"pointerover pointerup wheel";

		if (excludeTypes)
			types = splitBySpace(types).L.except(splitBySpace(excludeTypes)).array;

		// Forward events from the selected element to another element
		let retrigger = event => {
			new Frontfire(target).trigger(event.type, event, undefined, event.constructor);
		};
		new Frontfire(source).on(types, retrigger);

		// Stop the forwarded events from doing too much
		let cancel = event => {
			if (event.cancelable)
				event.preventDefault();
		};
		new Frontfire(target).on(types, cancel);

		// Return object with methods to control the added event handlers
		return {
			// Removes the added event handlers.
			undo: () => {
				new Frontfire(source).off(types, retrigger);
				new Frontfire(target).off(types, cancel);
			}
		};
	};


	// ==================== Forms methods ====================

	// TODO: Form fields and data support functions, validation (use :valid/:invalid CSS pseudo-classes), incl. submit and conversions
	// - use HTMLFormElement.elements and verify that it hasn't been replaced by a form field named "elements", see MDN warning
	// - coati.form.getFieldElement, for use with value(newValue)
	//   consider type=radio fields that consist of separate HTML elements
	// - coati.form.getValue -> new FormData(formElement)
	// - select element: options management
	// - form submit handler (per form or field), for validation
	// - set validation state of fields (style, separate message element)
	//   see also:
	//   - https://jqueryvalidation.org/documentation/
	//   - https://www.smashingmagazine.com/2009/07/web-form-validation-best-practices-and-tutorials/
	//   - https://developer.mozilla.org/en-US/docs/Web/API/ValidityState

	// Gets or sets the current value of an HTML element that may occur in a form. For checkboxes
	// and radio fields, the boolean checked value is used. For time-typed fields, the value is
	// converted as Date. For number-typed fields, the value is converted as Number. For select
	// fields with the multiple attribute, the returned or new value is an Array containing the
	// string value of each selected option. If the set value is different from the current value, a
	// change event is triggered on the element.
	Frontfire_prototype.value = function (newValue) {
		for (let i = 0; i < this.length; i++) {
			let node = this.array[i];
			let changed;
			let nodeName = node.nodeName.toLowerCase();
			let type = node.type;
			if (nodeName === "input" && ["checkbox", "radio"].includes(type)) {
				if (newValue === undefined)
					return node.indeterminate ? null : node.checked;
				if (newValue === null) {
					changed = !node.indeterminate || node.checked;
					node.checked = false;
					node.indeterminate = true;
				}
				else {
					changed = !!newValue !== node.checked;
					node.checked = !!newValue;
				}
			}
			else if (nodeName === "input" && ["date", "datetime-local", "month", "time"].includes(type)) {
				// NOTE: The valueAsDate property is very incomplete and fails in many situations.
				// See: https://bugs.chromium.org/p/chromium/issues/detail?id=625316#c9
				// Ref: https://html.spec.whatwg.org/multipage/input.html#input-type-attr-summary
				// It works better in Firefox than in Chrome but it still interprets all UI-visible
				// times as UTC, even despite the input type "datetime-local".
				// The valueAsNumber property (which gives the numeric timestamp) isn't much better
				// and still unavailable for some input types even if specified.
				// So we won't touch that mess and do the string parsing and formatting manually!
				if (newValue === undefined) {
					// Getter
					let str = node.value;
					if (!str)
						return null;   // Empty or incomplete input
					if (!str.includes("T"))
						str += "T00:00";   // Have it interpreted as local time instead of UTC
					return new Date(str);
				}
				// Setter
				let newStr;
				if (newValue instanceof Date) {
					let num = (val, len) => (val + "").padStart(len, "0");
					let year = num(newValue.getFullYear(), 4);
					let month = num(newValue.getMonth() + 1, 2);
					let day = num(newValue.getDate(), 2);
					let hour = num(newValue.getHours(), 2);
					let min = num(newValue.getMinutes(), 2);
					let sec = num(newValue.getSeconds(), 2);
					let time = newValue.getSeconds() !== 0 ? `${hour}:${min}:${sec}` : `${hour}:${min}`;
					if (!newValue) {
						newStr = "";
					}
					else if (type === "month") {
						newStr = `${year}-${month}`;
					}
					else if (type === "date") {
						newStr = `${year}-${month}-${day}`;
					}
					else if (type === "time") {
						newStr = time;
					}
					else if (type === "datetime-local") {
						newStr = `${year}-${month}-${day}T${time}`;
					}
				}
				else {
					newStr = newValue;
				}
				changed = newStr !== node.value;
				node.value = newStr;
			}
			else if (nodeName === "input" && ["number", "range"].includes(type)) {
				if (newValue === undefined) {
					if (node.value === "")   // for empty or invalid input (including leading/trailing whitespace)
						return null;
					return node.valueAsNumber;
				}
				if (newValue === null)
					newValue = NaN;   // will set ""
				changed = newValue !== node.valueAsNumber;
				node.valueAsNumber = newValue;
			}
			else if (nodeName === "select" && node.multiple) {
				let currentSelection = Array.from(node.selectedOptions).map(option => option.value);
				if (newValue === undefined)
					return currentSelection;
				let newSelection;
				if (isString(newValue) || !isIterable(newValue)) {
					newSelection = new ArrayList();
					// Convert number values to string because that's what the select option values are
					if (isNumber(newValue))
						newValue = newValue + "";
					newSelection.add(newValue);
				}
				else {
					newSelection = new ArrayList(newValue)
						.select(v => isNumber(v) ? v + "" : v);
				}
				changed = !newSelection.setEquals(currentSelection);
				if (changed) {
					let newSelectionSet = new Set(newSelection);
					node.options.forEach(option => option.selected = newSelectionSet.has(option.value));
				}
			}
			else {
				if (newValue === undefined)
					return node.value;
				changed = newValue !== node.value;
				node.value = newValue;
			}

			if (changed)
				node.dispatchEvent(new Event("change"));
		}
		return this;
	};

	// Copies the plain text value of the first selected text input element into the system clipboard.
	// This method uses the DOM element and not the newer Clipboard API so it's always available.
	// Returns true if the copy was successful; otherwise, false.
	Frontfire_prototype.copyText = function () {
		let element = this.array[0];
		if (!element) return false;
		let selectionStart = element.selectionStart;
		let selectionEnd = element.selectionEnd;
		element.focus();
		element.select();
		let result = document.execCommand("copy");
		element.setSelectionRange(selectionStart, selectionEnd);   // Restore previous selection
		return result !== "unsuccessful";
	};


	// ==================== Static utility methods ====================

	// Creates a new Frontfire instance selecting a single element by its ID.
	//
	// id: The element ID to select.
	Frontfire.id = function (id) {
		return new Frontfire(document.getElementById(id) || undefined);
	};

	// Creates a new Frontfire instance selecting only a single element.
	//
	// node: See add method's parameter.
	Frontfire.single = function (node) {
		let f = new Frontfire();
		if (node)
			f.add(node, true);
		return f;
	};

	// Creates an HTML element. Shortcut for document.createElement. The return value is not a
	// Frontfire instance.
	Frontfire.c = name => document.createElement(name);

	// Converts a string with hyphens like "camel-case" to camelCase.
	Frontfire.camelCase = camelCase;

	// Forces a browser layout reflow. This can be used to start CSS transitions on new elements.
	Frontfire.forceReflow = () => {
		void(document.body.offsetHeight + document.body.scrollHeight);
	};

	// Asynchronously sleeps for the specified time in milliseconds.
	// Returns a Promise that resolves after the specified time.
	Frontfire.sleep = async ms => new Promise(resolve => setTimeout(resolve, ms));

	// Copies the specified plain text into the system clipboard. This method uses a temporary dummy
	// DOM element and not the newer Clipboard API so it's always available.
	// Returns true if the copy was successful; otherwise, false.
	//
	// text: The plain text to copy.
	Frontfire.copyText = text => {
		const textarea = document.createElement("textarea");
		textarea.value = text;
		textarea.readonly = true;
		textarea.style.position = "absolute";
		textarea.style.top = "-9999px";
		textarea.style.left = "-9999px";
		document.body.append(textarea);
		textarea.select();
		let result = document.execCommand("copy");
		textarea.remove();
		return result !== "unsuccessful";
	};

	// Returns the value limited to the range between min and max.
	Frontfire.clamp = (value, min, max) =>
		Math.max(min, Math.min(value, max));

	// Returns the value rounded to the specified number of decimals.
	Frontfire.round = (value, decimals) => {
		if (decimals === undefined) decimals = 0;
		let precision = Math.pow(10, decimals);
		return Math.round(value * precision) / precision;
	}

	// Escapes a string for use in a regular expression.
	Frontfire.regExpEscape = text =>
		text.replace(/[-\/\\^$*+?.()|[\]{}]/g, "\\$&");

	// Encodes a string for use in HTML code. This does not change any quote characters so it cannot
	// be used in HTML attribute values.
	Frontfire.encodeHTML = text =>
		text.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");

	// Builds a translation function with a text dictionary for the specified language.
	Frontfire.getTranslator = (dictionary, language) => {
		if (!language)
			language = document.documentElement.lang;
		language = language.trim().toLowerCase();
		if (!(language in dictionary))
			language = "en";
		let languageOnly = language;
		if (language.indexOf("-") !== -1)
			languageOnly = language.replace(/-.*$/, "");
		let translate = key =>
			key in dictionary[language] ? dictionary[language][key] :
				key in dictionary[languageOnly] ? dictionary[languageOnly][key] :
					dictionary.en[key];
		return translate;
	};

	// ---------- Scrolling ----------

	var isScrollingPrevented = false;

	// Prevents scrolling the document.
	//
	// state: Enable or disable the scrolling prevention.
	Frontfire.preventScrolling = state => {
		let doc = new Frontfire(document);
		let html = document.documentElement;
		if (state !== false) {
			if (!isScrollingPrevented) {
				isScrollingPrevented = true;
				let scrollTop = html.scrollTop;
				let scrollLeft = html.scrollLeft;
				doc.on("scroll.ff-prevent-scrolling", e => html.scrollTo(scrollLeft, scrollTop));
				html.style.touchAction = "none";
			}
		}
		else {
			isScrollingPrevented = false;
			doc.off("scroll.ff-prevent-scrolling");
			html.style.touchAction = "";
		}
	}

	// TODO: Convert from jQuery when needed and add to documentation (instance method already exists, this is a separate static method!)
	//// Scrolls the window so that the rectangle is fully visible.
	//Frontfire.scrollIntoView = rect => {
	//	let cont = $(window);
	//	let viewportWidth = cont.width() - 1;
	//	let viewportHeight = cont.height() - 1;
	//	let scrollTop = cont.scrollTop();
	//	let scrollLeft = cont.scrollLeft();

	//	if (rect.top < scrollTop) {
	//		cont.scrollTop(rect.top);
	//	}
	//	if (rect.bottom > scrollTop + viewportHeight) {
	//		cont.scrollTop(scrollTop + (rect.bottom - (scrollTop + viewportHeight)));
	//	}
	//	if (rect.left < scrollLeft) {
	//		cont.scrollLeft(rect.left);
	//	}
	//	if (rect.right > scrollLeft + viewportWidth) {
	//		cont.scrollLeft(scrollLeft + (rect.right - (scrollLeft + viewportWidth)));
	//	}
	//}

	// ---------- Network requests ----------

	// Executes a GET request to a URL and returns the JSON-data result. If an error occurs, the
	// error is logged to the console and the returned Promise resolves to null.
	//
	// url: The request URL.
	// data: An object containing additional URL query parameters. These entries are appended to
	//   already existing query parameters in the URL.
	// init: An optional object with additional options to the fetch() call init argument.
	//   See https://developer.mozilla.org/en-US/docs/Web/API/fetch#parameters
	Frontfire.getJSON = (url, data, init) => fetchJSON("GET", url, data, init);

	// Executes a JSON-data POST request to a URL and returns the JSON-data result. If an error
	// occurs, the error is logged to the console and the returned Promise resolves to null.
	//
	// url: The request URL.
	// data: The object that is sent as JSON-serialized request body.
	// init: An optional object with additional options to the fetch() call init argument.
	//   See https://developer.mozilla.org/en-US/docs/Web/API/fetch#parameters
	Frontfire.postJSON = (url, data, init) => fetchJSON("POST", url, data, init);

	async function fetchJSON(method, url, data, init) {
		// Convert data to URL parameters for GET requests
		if (method === "GET" && data !== undefined) {
			// Parse the provided URL
			url = new URL(url, location);
			// Append all query string values from the data parameter
			let searchParams = new URLSearchParams(data);
			searchParams.forEach((value, key) => {
				url.searchParams.append(key, value);
			});
			// Don't use the data as body anymore, it's not supported for GET
			data = undefined;
			// Update the provided URL
			url.search = url.searchParams.toString();
		}

		try {
			let myInit = { method: method };
			if (data !== undefined)
				myInit.body = JSON.stringify(data);
			myInit = Object.assign(myInit, init);
			// Set the request content type to JSON (adds to or overwrites any set value, don't do that)
			setInitHeaderContentType(myInit, "application/json");
			let response = await fetch(url, myInit);
			let responseData = await response.json();
			return responseData;
		}
		catch (error) {
			console.error("fetch or JSON error, returning null instead.", error);
			return null;
		}
	}

	// Executes a form-data POST request to a URL and returns the JSON-data result. If an error
	// occurs, the error is logged to the console and the returned Promise resolves to null.
	//
	// url: The request URL.
	// data: An object containing the keys and values to send as form fields in the request body.
	// init: An optional object with additional options to the fetch() call init argument.
	//   See https://developer.mozilla.org/en-US/docs/Web/API/fetch#parameters
	Frontfire.postForm = async (url, data, init) => {
		try {
			let myInit = { method: "POST" };
			if (data !== undefined)
				myInit.body = new URLSearchParams(data);
			myInit = Object.assign(myInit, init);
			// Set the request content type to JSON (adds to or overwrites any set value, don't do that)
			setInitHeaderContentType(myInit, "application/x-www-form-urlencoded");
			let response = await fetch(url, myInit);
			let responseData = await response.json();
			return responseData;
		}
		catch (error) {
			console.error("fetch or JSON error, returning null instead.", error);
			return null;
		}
	};

	function setInitHeaderContentType(init, type) {
		if (Array.isArray(init.headers)) {
			init.headers.push(["Content-Type", type]);
		}
		else if (typeof init.headers === "object") {
			init.headers["Content-Type"] = type;
		}
		else if (!init.headers) {
			init.headers = { "Content-Type": type };
		}
	}

	// ---------- Variable type/value tests ----------

	// Determines whether the value is set (i.e. not undefined or null).
	Frontfire.isSet = value => typeof value !== "undefined" && value !== null;

	// Determines whether the value is boolean.
	Frontfire.isBoolean = isBoolean;

	// Determines whether the value is a number.
	Frontfire.isNumber = isNumber;

	// Determines whether the value is a string.
	Frontfire.isString = isString;

	// Determines whether the value is an even integer number.
	Frontfire.isEven = value => isNumber(value) && value % 2 === 0;

	// Determines whether the value is an odd integer number.
	Frontfire.isOdd = value => isNumber(value) && value % 2 === 1;

	// Determines whether an object is iterable, i.e. usable in for-of loops.
	Frontfire.isIterable = isIterable;

	// ---------- Operating system tests ----------

	// Determines whether the client operating system is Android.
	Frontfire.isAndroid = () => !!navigator.userAgent.match(/Android/);

	// Determines whether the client operating system is iOS.
	Frontfire.isIos = () => !!navigator.platform.match(/iPhone|iPad|iPod/);

	// Determines whether the client operating system is Linux (not Android).
	Frontfire.isLinux = () => !!navigator.platform.match(/Linux/) && !Frontfire.isAndroid();

	// Determines whether the client operating system is macOS.
	Frontfire.isMac = () => !!navigator.platform.match(/Mac/);

	// Determines whether the client operating system is Windows.
	Frontfire.isWindows = () => !!navigator.platform.match(/Win/);

	// ---------- Browser tests ----------
	// Old source (not up to date): https://stackoverflow.com/a/9851769

	// Determines whether the browser is Brave (derived from Chromium).
	Frontfire.isBrave = () => !!navigator.brave?.isBrave;

	// Determines whether the browser is Chrome or derived from Chromium.
	Frontfire.isChrome = () => typeof window.chrome === "object";

	// Determines whether the browser is Edge (derived from Chromium).
	Frontfire.isEdge = () => Frontfire.isChrome() && (navigator.userAgent.indexOf("Edg") != -1);

	// Determines whether the browser is classic Edge.
	Frontfire.isEdgeClassic = () => !!window.StyleMedia;

	// Determines whether the browser is Firefox.
	// The CSS property -moz-user-focus is supported from Firefox 1 and nowhere else and not deprecated.
	// NOTE: Referencing InstallTrigger prints a warning to the console.
	Frontfire.isFirefox = () => "MozUserFocus" in document.body.style || typeof InstallTrigger !== "undefined";

	// Determines whether the browser is Opera (derived from Chromium).
	Frontfire.isOpera = () => Frontfire.isChrome() && navigator.userAgent.indexOf(" OPR/") >= 0;

	// Determines whether the browser is Safari (internal engine of all iOS browsers).
	Frontfire.isSafari = () => "onwebkitmouseforcedown" in document.documentElement;


	// ==================== Plugin methods ====================

	let registeredPlugins = [];
	let autostartPlugins = [];
	let autostartPluginsSorted = true;
	let isFirstAutostartDone = false;

	// Registers a Frontfire plugin.
	//
	// pluginName: The plugin name. This is exposed as plugin method in Frontfire instances.
	// createFn: The plugin create function.
	// data: An object that further defines the plugin with the following keys:
	// - defaultOptions: The default options of the plugin. Only properties defined in here are
	//   considered for data attributes in the HTML element.
	// - methods: An object containing additional plugin methods and properties.
	// - selectors: An array of CSS selectors for the autostart function.
	Frontfire.registerPlugin = function (pluginName, createFn, data) {
		// Define a new property for each Frontfire object that provides the plugin. This property
		// getter is called whenever the plugin or one of its additional functions are called.
		const methods = data?.methods;
		const defaultOptions = data?.defaultOptions;
		object_defineProperty(Frontfire_prototype, pluginName, {
			get: function () {
				// Plugin default function, returned to make this property callable.
				// Wrap the function to assign the additional methods below to the individual
				// instance and not the original function. This makes the return values of this
				// property storable and reusable.
				let ret = function () { return createFn.apply(this, arguments); };

				// Additional plugin methods, added to the returned function, bound to whoever has
				// called this property to pass on "this" to the next function
				if (methods) {
					for (let key in methods) {
						const method = methods[key];
						if (isFunction(method)) {
							ret[key] = method.bind(this);
						}
						else if (typeof method === "object" && ("get" in method || "set" in method)) {
							object_defineProperty(ret, key, {
								get: method.get?.bind(this),
								set: method.set?.bind(this)
							});
						}
					}
				}

				// Make the default options in the original shared object accessible and overwritable
				if (defaultOptions) {
					object_defineProperty(ret, "defaults", {
						get: () => defaultOptions,
						set: value => object_assign(defaultOptions, value)
					});
				}
				return ret;
			}
		});
		registeredPlugins.push(pluginName);

		// Remember the specified selectors for the autostart method
		if (data?.selectors) {
			data.selectors.forEach(selector => {
				let entry = [selector, pluginName];
				autostartPlugins.push(entry);
				autostartPluginsSorted = false;
				if (isFirstAutostartDone) {
					// The initial autostart has already run, apply this new plugin now on the
					// entire document
					applyPlugins(new Frontfire(document.body), true, [entry]);
				}
			});
		}
	}

	// Applies all Frontfire plugins to the selected nodes except those that have the "no-frontfire"
	// CSS class, or descendants of an element with that class.
	Frontfire_prototype.autostart = function () {
		applyPlugins(this, true);
		return this;
	};

	// Applies all Frontfire plugins to the selected nodes. The "no-frontfire" CSS class is removed
	// from the selected nodes and all their descendants to also activate the CSS features.
	Frontfire_prototype.frontfire = function () {
		applyPlugins(this, false);
		return this;
	};

	// Runs the autostart list once when all plugins have been loaded.
	// Called by Frontfire UI, do not call this method directly. Use the autostart() or frontfire()
	// methods instead.
	Frontfire.runAutostart = function () {
		// Automatically apply all controls now. Must be loaded at the end of the document.
		// Doing it now is faster than waiting for the DOM ready event, and when loaded at the end
		// of the document, all relevant DOM parts are already there.
		if (document.body) {
			// We expect this script to be placed at the end of <body> after all visible elements.
			new Frontfire(document.body).autostart();
			isFirstAutostartDone = true;
		}
		else {
			// If the script is included in <head>, document.body is still null, so gracefully
			// revert to the DOM ready event to run this.
			Frontfire.onReady(() => {
				new Frontfire(document.body).autostart();
				isFirstAutostartDone = true;
			});
		}
	};

	// Applies all registered plugins on the selected nodes of the instance.
	//
	// instance: The selected nodes.
	// isAutostart: Indicates whether no-frontfire elements are excluded.
	// plugins: Apply only these plugins, if specified; otherwise all registered plugins are applied.
	function applyPlugins(instance, isAutostart, plugins) {
		if (!isAutostart) {
			// Remove all no-frontfire classes from elements to apply CSS
			instance.querySelectorAll(".no-frontfire").add(instance).classList.remove("no-frontfire");
		}
		if (!plugins) {
			// Only sort the plugins array after it was modified and when it is used again.
			// Apply the plugins in a suitable order (poor man's specificity):
			// - Selectors with an element name and a CSS class (high "." index)
			// - Selectors with a CSS class ("." at beginning, index is 0)
			// - Selectors without a CSS class (no ".", index is -1)
			if (!autostartPluginsSorted) {
				autostartPlugins.L.sortBy(x => x[0].indexOf("."));
				autostartPluginsSorted = true;
			}
			plugins = autostartPlugins;
		}

		plugins.forEach(entry => {
			const selector = entry[0];
			const methodName = entry[1];
			if (methodName in Frontfire_prototype) {
				// Find all descendants of the selected nodes
				let targets = instance.querySelectorAll(selector);
				// Add the selected nodes that match themselves
				targets.addRange(instance.where(selector));
				// Remove no-frontfire and template targets if in autostart mode
				if (isAutostart)
					targets = targets.where(n =>
						!n.classList.contains("no-frontfire") &&
						n.nodeName.toLowerCase() !== "template" &&
						!n.closest(".no-frontfire, template"));
				// Call the method on the target elements
				targets[methodName]();
			}
		});
	}

	// Removes all Frontfire plugins from the selected nodes. This reverts all changes made and
	// restores the state in which the element was before applying Frontfire plugins.
	// Additionally created elements and event handlers are also removed.
	Frontfire_prototype.deinit = function () {
		registeredPlugins.forEach(pluginName => {
			// Fetch a plugin context object for the selected nodes
			let instance = this[pluginName];
			// Call the plugin's deinit() method if it exists. It needs to decide for itself whether
			// it is responsible for any of the selected nodes.
			instance && isFunction(instance.deinit) && instance.deinit();
		});
		return this;
	};

	// Determines the options to use for a plugin.
	//
	// pluginName: The plugin name.
	// elem: The element to find data attributes in. Options are stored here, too.
	// converters: An object that specifies a conversion function for each special data attribute.
	// params: The options passed to the plugin function.
	Frontfire.initOptions = function (pluginName, elem, converters, params) {
		params = params || {};

		// Start with the defaults
		let defaults = Frontfire_prototype[pluginName].defaults;
		let opts = object_assign({}, defaults);

		// Look for a combined HTML data-opt attribute containing a JSON object
		let optValue = elem.dataset.opt;
		if (optValue !== undefined) {
			object_assign(opts, parseOptions(elem, optValue, converters));
		}

		// Then overwrite with individual HTML data attributes
		for (let key in defaults) {
			// Only do the work if it's not overridden again by params
			if (params[key] === undefined) {
				let elemDataValue = elem.dataset[F.camelCase("opt-" + key)];
				if (elemDataValue !== undefined) {
					opts[key] = convertOptValue(elemDataValue, converters, key);
				}
			}
		}

		// Finally overwrite with params
		object_assign(opts, params);

		// Keep options in DOM element's data
		setNodeData(elem, "ff-" + pluginName + "-options", opts);

		return opts;
	}

	// Loads plugin options for additional plugin functions.
	// If the plugin options have been initialised for the element, undefined is returned.
	//
	// pluginName: The plugin name.
	// elem: The element to find data attributes in. Options are stored here, too.
	Frontfire.loadOptions = function (pluginName, elem) {
		return getNodeData(elem, "ff-" + pluginName + "-options");
	}

	// Interprets an option value specified as separate attribute or unquoted string.
	function convertOptValue(value, converters, name) {
		if (converters && isFunction(converters[name])) {
			return converters[name](value);
		}
		else if (value === "true") {
			return true;
		}
		else if (value === "false") {
			return false;
		}
		else if (value.match(/^-?[0-9]+(?:\.[0-9]+)?$/)) {
			return +value;
		}
		else {
			return value;
		}
	}

	// Parses the options specified in the combined data-opt attribute, using a similar syntax as
	// CSS properties in a style attribute.
	function parseOptions(element, attr, converters) {
		// The states of the parser state machine
		const stateBeforeName = 0;
		const stateName = 1;
		const stateAfterName = 2;
		const stateBeforeValue = 3;
		const stateValue = 4;
		const stateAfterValue = 5;
		const stateDQString = 6;
		const stateSQString = 7;

		let options = {};
		let pos = 0;
		let state = stateBeforeName;   // Initial state
		let name = "";
		let value = "";
		let quotedValue = false;
		let loggedWarning = false;
		let skip;

		// Logs a warning for invalid syntax (only once per options string).
		let warn = () => {
			if (!loggedWarning) {
				console.warn("Invalid data-opt value syntax at position " + pos + " for element:", element);
				loggedWarning = true;
			}
		};

		// Reads a backslash escape sequence from the current position and returns the resulting character.
		let readEscape = () => {
			skip = 2;
			let next = attr.substring(pos + 1, pos + 2);
			switch (next) {
				case "\"":
				case "'":
				case "\\":
					return next;
				case "n":
					return "\n";
				case "r":
					return "\r";
				case "t":
					return "\t";
				case "u":
				case "x":
					let more = attr.substring(pos + 1, pos + 10);
					let match;
					if (match = more.match(/^x([0-9A-Za-z]{2})/)) {
						skip = 4;
					}
					else if (match = more.match(/^u([0-9A-Za-z]{4})/)) {
						skip = 6;
					}
					else if (match = more.match(/^u\{([0-9A-Za-z]{1,6})\}/)) {
						skip = 4 + match[1].length;
					}
					else {
						warn();
						return next;
					}
					return String.fromCharCode(parseInt(match[1], 16));
				default:
					warn();
					return next;
			}
		};

		// Adds a complete name-value pair to the resulting options.
		let addValue = () => {
			if (name !== "") {
				name = camelCase(name);
				if (!quotedValue)
					value = convertOptValue(value, converters, name);
				options[name] = value;
			}
			name = "";
			value = "";
			quotedValue = false;
		};

		// Run the parser state machine
		while (pos < attr.length) {
			let newState = state;
			skip = 1;
			let ch = attr.substring(pos, pos + 1);

			switch (state) {
				case stateBeforeName:
					if (ch.match(/\S/)) {
						newState = stateName;
						skip = 0;   // Read again
					}
					break;
				case stateName:
					if (ch.match(/\s/)) {
						newState = stateAfterName;
					}
					else if (ch === ":") {
						newState = stateBeforeValue;
					}
					else {
						name += ch;
					}
					break;
				case stateAfterName:
					if (ch === ":") {
						newState = stateBeforeValue;
					}
					else if (ch.match(/\S/)) {
						warn();
					}
					break;

				case stateBeforeValue:
					if (ch === "\"") {
						newState = stateDQString;
						quotedValue = true;
					}
					else if (ch === "'") {
						newState = stateSQString;
						quotedValue = true;
					}
					else if (ch.match(/\S/)) {
						newState = stateValue;
						skip = 0;   // Read again
					}
					break;
				case stateValue:
					if (ch === ";") {
						value = value.trimEnd();
						addValue();
						newState = stateBeforeName;
					}
					else {
						value += ch;
					}
					break;
				case stateAfterValue:
					if (ch === ";") {
						addValue();
						newState = stateBeforeName;
					}
					else if (ch.match(/\S/)) {
						warn();
					}
					break;

				case stateDQString:
					if (ch === "\\") {
						value += readEscape();
					}
					else if (ch === "\"") {
						newState = stateAfterValue;
					}
					else {
						value += ch;
					}
					break;
				case stateSQString:
					if (ch === "\\") {
						value += readEscape();
					}
					else if (ch === "'") {
						newState = stateAfterValue;
					}
					else {
						value += ch;
					}
					break;
			}
			// Log output for parser debugging:
			//console.log(pos + ": [" + state + "] \"" + ch + "\" +" + skip + " [" + newState + "] " + name + "=" + value);
			state = newState;
			pos += skip;
		}

		// Accept unterminated value
		if (state === stateValue || state === stateAfterValue)
			addValue();
		else if (state === stateName || state === stateAfterName)
			warn();

		return options;
	}


	// ==================== Extra jQuery-style methods ====================

	// jQuery-style method chaining variant of '.classList.add()'
	Frontfire_prototype.addClass = function () {
		this.classList.add(...arguments);
		return this;
	};

	// jQuery-style method chaining variant of '.classList.remove()'
	Frontfire_prototype.removeClass = function () {
		this.classList.remove(...arguments);
		return this;
	};

	// jQuery-style method chaining variant of '.classList.toggle()'
	Frontfire_prototype.toggleClass = function () {
		this.classList.toggle(...arguments);
		return this;
	};

	// jQuery-style method chaining variant of textContent getter/setter
	Frontfire_prototype.text = function (text) {
		if (arguments.length === 0)
			return this.textContent;
		this.textContent = text;
		return this;
	};

	// jQuery-style method chaining variant of innerHTML getter/setter
	Frontfire_prototype.html = function (html) {
		if (arguments.length === 0)
			return this.innerHTML;
		this.innerHTML = html;
		return this;
	};

	// jQuery-style method chaining variant of getAttribute/setAttribute/removeAttribute
	Frontfire_prototype.attr = function (name, value) {
		if (value === undefined)
			return this[0] ? this[0].getAttribute(name) : undefined;
		else if (value !== null)
			return this.setAttribute(name, value);
		else
			return this.removeAttribute(name);
	};

	// jQuery-style method chaining variant of element property getter/setter
	Frontfire_prototype.prop = function (name, value) {
		if (value === undefined)
			return this[0] ? this[0][name] : undefined;
		else
			return this.forEach(node => node[name] = value);
	};


	// ==================== Private methods ====================

	// Throws an argument error.
	//
	// value: The unsupported value.
	// name: (String) The argument name. (Optional)
	function argError(value, name) {
		// The console can display the type of the value and more details than a simple string in
		// the error object.
		console.error("value:", value);
		throw new TypeError("The argument type is not supported" + (name ? " for " + name : "") + ": " + value);
	}

	// Determines whether an object is iterable, i.e. usable in for-of loops.
	//
	// obj: (Object) The object to test.
	function isIterable(obj) {
		return obj !== undefined && obj !== null && isFunction(obj[Symbol.iterator]);
	}

	// Splits a string at space characters and returns the non-empty items.
	//
	// str: (String) The string to split.
	function splitBySpace(str) {
		if (isString(str))
			return str.split(" ").filter(i => i);
		if (isIterable(str))
			return Array.from(str).map(x => splitBySpace(x)).flat().filter(i => i);
		if (str)
			return [str];
		return [];
	}

	var singleElementRegex = /^<\s*([0-9a-z]+)\s*\/?\s*>$/i;

	// Creates Nodes from an HTML string.
	//
	// html: (String) The HTML string. Optimized for single elements like "<a>".
	// single: (Boolean) Only returns a single element, not an array. (Optional, default: false)
	function fromHTML(html, single) {
		let match = html.match(singleElementRegex);
		if (match) {
			let element = document.createElement(match[1]);
			if (single)
				return element;
			else
				return [element];
		}

		let template = document.createElement("template");
		template.innerHTML = html.trim();
		if (single)
			return template.content.childNodes[0];
		else
			return template.content.childNodes;
	}

	// Converts a string with hyphens like "camel-case" to camelCase.
	function camelCase(str) {
		return str.replace(/-([a-z])/g, g => g[1].toUpperCase());
	}

	// Determines whether an element has a layout size.
	function hasLayoutSize(element) {
		return element.offsetWidth || element.offsetHeight || element.getClientRects().length;
	}

	// Determines whether the computed "visibility" style of an element is "visible".
	function isVisibilityVisible(element) {
		return getComputedStyle(element, null).visibility === "visible";
	}

	// Recurses all selected Nodes by a property until the chain ends (the property value is empty).
	//
	// that: (Frontfire) The selected Nodes.
	// propertyName: (String) The name of the property to recurse into.
	function recurseAllByProperty(that, propertyName) {
		let result = new Frontfire();
		that.forEach(n => {
			while (n = n[propertyName]) {
				result.add(n);
			}
		});
		return result;
	}


	// ---------- Internal data for each Node ----------

	// The internal node data is stored in an object managed by Frontfire and stored in the target
	// Node object under this property. It is the only property that is added to Node instances. The
	// stored data disappears when the Node is deleted, so there is no memory leak no matter how the
	// nodes were removed from the document.
	const dataKey = "_frontfireData";

	// Gets the internal data of a Node for the specified key.
	//
	// node: (Node) The Node.
	// key: (String) The data key.
	// defaultValue: The value to return if the key is yet undefined.
	// setDefaultValue: (Boolean) If true, the returned defaultValue is also saved for the key.
	function getNodeData(node, key, defaultValue, setDefaultValue) {
		if (node[dataKey] !== undefined && key in node[dataKey])
			return node[dataKey][key];
		if (setDefaultValue)
			setNodeData(node, key, defaultValue);
		return defaultValue;
	}

	// Gets the keys of the internal data of a Node.
	// If the node has no data, an empty array is returned.
	//
	// node: (Node) The Node.
	function getNodeDataKeys(node) {
		if (node[dataKey] !== undefined)
			return Object.keys(node[dataKey]);
		return [];
	}

	// Sets the internal data of a Node for the specified key.
	//
	// node: (Node) The Node.
	// key: (String) The data key.
	// value: The value to store.
	function setNodeData(node, key, value) {
		if (node[dataKey] === undefined)
			node[dataKey] = {};
		node[dataKey][key] = value;
	}

	// Deletes the internal data of a Node for the specified key.
	//
	// node: (Node) The Node.
	// key: (String) The data key.
	function deleteNodeData(node, key) {
		if (node[dataKey] !== undefined)
			delete node[dataKey][key];
	}

	// Adds an item to the internal data of a Node for the specified key. The internal data for the
	// key must be an Array.
	//
	// node: (Node) The Node.
	// key: (String) The data key.
	// value: The value to add to the array.
	function addNodeData(node, key, value) {
		if (node[dataKey] === undefined)
			node[dataKey] = {};
		if (!(key in node[dataKey]))
			node[dataKey][key] = [];
		node[dataKey][key].push(value);
	}

	// Removes an item from the internal data of a Node for the specified key. The internal data  for
	// the key must be an Array. If the array is empty, the key is removed from the internal data.
	//
	// node: (Node) The Node.
	// key: (String) The data key.
	// value: The value to remove from the array.
	function removeNodeData(node, key, value) {
		if (node[dataKey] !== undefined && key in node[dataKey]) {
			let index = node[dataKey][key].indexOf(value);
			if (index !== -1)
				node[dataKey][key].splice(index, 1);
			if (node[dataKey][key].length === 0)
				delete node[dataKey][key];
		}
	}

	// The internal data functions must also be available to Frontfire UI plugins, so they're
	// exposed here but not documented and not approved for external use.
	Frontfire.internalData = {
		get: getNodeData,
		getKeys: getNodeDataKeys,
		set: setNodeData,
		delete: deleteNodeData,
		add: addNodeData,
		remove: removeNodeData
	};


	// ==================== Exports ====================

	// Environment detection
	if (typeof module === "object" && typeof module.exports === "object") {
		// Node.js
		module.exports = Frontfire;
	}
	else {
		// Global object
		window.Frontfire = Frontfire;
		// Define a public short alias for the Frontfire function
		// (Weak definition, will not overwrite anything and may be overwritten by others)
		// (But overwrite implicit DHTML access to element with that id)
		if (window.F === undefined || window.F === document.getElementById("F"))
			window.F = Frontfire;
	}
})(ArrayList);
