// ==================== Sortable plugin ====================

const sortableClass = "ff-sortable";
const sortableEventClass = ".ff-sortable";
const sortablePlaceholderClass = "ff-sortable-placeholder";

// Defines default options for the sortable plugin.
let sortableDefaults = {
	// The element(s) that can start a drag operation, as CSS selector within the scope of the
	// element to drag, or node collection. Defaults to the element to drag if unset.
	handle: undefined,

	// The element(s) that cannot start a drag operation, as CSS selector within the scope of the
	// element to drag, or node collection.
	cancel: undefined,

	// Constrains the drag movement along the "x" or "y" axis.
	axis: undefined,

	// Constrains the drag movement inside the specified element, in any format accepted by the
	// Frontfire constructor, or the "parent" of the dragged element or the "viewport".
	containment: undefined,

	// The elements among which the dragged element will be pulled to the front, in any format
	// accepted by the Frontfire constructor, or true to stack all sortable children.
	stack: undefined,

	// The mouse cursor to show during dragging.
	dragCursor: undefined,

	// A CSS class to add to the element while it's being dragged.
	dragClass: undefined,

	// Indicates whether the window should scroll to keep the dragged element visible.
	scroll: false
};

const blockDisplayValues = ["block", "flex", "grid", "list-item", "table", "table-footer-group", "table-header-group", "table-row", "table-row-group"];

// Determines whether the specified CSS display value defines a block instead of an inline.
const isBlockDisplay = value => blockDisplayValues.indexOf(value) !== -1;

// Returns the center point of the specified rectangle.
const center = rect => ({
	top: rect.top + rect.height / 2,
	left: rect.left + rect.width / 2
});

// Source: https://jsfiddle.net/beentaken/9k1sf6p2/ (modified)
const dist2 = (v, w) => (v.left - w.left) ** 2 + (v.top - w.top) ** 2;

const distToSegmentSquared = (p, v, w) => {
	const l2 = dist2(v, w);
	if (l2 == 0) return dist2(p, v);
	const t = ((p.left - v.left) * (w.left - v.left) + (p.top - v.top) * (w.top - v.top)) / l2;
	if (t < 0) return dist2(p, v);
	if (t > 1) return dist2(p, w);
	return dist2(p, { left: v.left + t * (w.left - v.left), top: v.top + t * (w.top - v.top) });
};

const distToSegment = (p, v, w) => Math.sqrt(distToSegmentSquared(p, v, w));

// Makes the child elements in each selected element sortable by drag&drop.
function sortable(options) {
	return this.forEach(elem => {
		if (elem.classList.contains(sortableClass)) return;   // Already done
		elem.classList.add(sortableClass);
		let opt = F.initOptions("sortable", elem, {}, options);
		opt._prepareChild = prepareChild;
		opt._remove = remove;

		// Remove text nodes between children which cause layout issues when dragging
		Array.from(elem.childNodes)
			.filter(n => n.nodeType === 3)
			.forEach(n => elem.removeChild(n));

		let isVertical, flowStart, flowEnd, crossStart, crossEnd;

		elem.F.children.forEach(prepareChild);

		// Automatically prepare newly added children
		let observer = new MutationObserver((mutationsList, observer) => {
			mutationsList.forEach(mutation => {
				if (mutation.type === "childList") {
					mutation.addedNodes.forEach(child => prepareChild(child));
				}
			});
		});
		observer.observe(elem, { childList: true });

		function setVertical() {
			if (isVertical === undefined && elem.firstChild) {
				isVertical = isBlockDisplay(getComputedStyle(elem.firstChild).display);
				flowStart = isVertical ? "top" : "left";
				flowEnd = isVertical ? "bottom" : "right";
				crossStart = isVertical ? "left" : "top";
				crossEnd = isVertical ? "right" : "bottom";
			}
		}

		function prepareChild(child) {
			setVertical();

			let placeholder, initialChildAfterElement, placeholderAfterElement, betweenChildren, initialChildIndex;
			let stack = opt.stack;
			if (stack === true)
				stack = elem.F.children;   // Make a static copy

			child.F.draggable({
				handle: opt.handle,
				cancel: opt.cancel,
				axis: opt.axis,
				containment: opt.containment,
				stack: stack,
				dragCursor: opt.dragCursor,
				dragClass: opt.dragClass,
				scroll: opt.scroll
			});
			if (child.F.nodeNameLower === "tr") {
				child.F.querySelectorAll(":scope > td").style.touchAction = "inherit";
			}

			child.F.on("draggablestart" + sortableEventClass, event => {
				event.stopImmediatePropagation();
				let events = child.F.trigger("sortablestart", { bubbles: true, cancelable: true });
				if (events.first.defaultPrevented) {
					event.preventDefault();
					return;
				}

				// Remember where the element was before it was dragged, so it can be moved back there
				initialChildAfterElement = child.previousElementSibling;
				initialChildIndex = child.F.index;

				let childWidth = child.F.width;
				let childHeight = child.F.height;

				// Fix the size of table row cells while dragging
				if (child.F.nodeNameLower === "tr") {
					child.F.closest("table")
						.querySelector("tr")
						?.querySelectorAll(":scope > :is(td, th)")
						.forEach(obj => {
							obj.dataset.widthBeforeDrag = obj.style.width || "";
							obj.F.width = obj.F.borderWidth;
						});
					child.F.querySelectorAll(":scope > :is(td, th)")
						.forEach(obj => {
							obj.F.width = obj.F.borderWidth;
						});
					child.style.minWidth = child.F.borderWidth + 1 + "px";
				}

				// Create the placeholder element that will take the place of the dragged element
				placeholder = F.c(child.nodeName);
				placeholder.F.classList.add(child.className, sortablePlaceholderClass);
				placeholder.textContent = "\xa0";
				placeholder.style.width = childWidth + "px";
				placeholder.style.height = childHeight + "px";
				if (child.F.nodeNameLower === "tr") {
					let colCount = child.F.querySelectorAll(":scope > :is(td, th)")
						.sum(td => td.getAttribute("colspan") || 1);
					let td = F.c("td");
					td.setAttribute("colspan", colCount);
					placeholder.append(td);
				}

				// Insert the placeholder where the dragged element is, and take that out of the layout flow
				child.after(placeholder);
				child.F.style = { position: "absolute", width: childWidth + "px", height: childHeight + "px" };
				updateChildren();
			});
			child.F.on("draggablemove" + sortableEventClass, event => {
				event.stopImmediatePropagation();
				let events = child.F.trigger("sortablemove", { bubbles: true, cancelable: true });
				if (events.first.defaultPrevented) {
					event.preventDefault();
					return;
				}

				// Find the center points of the dragged element, both at the start and end in flow direction
				let rect = child.F.rect;
				let childStartCenter = center(rect);
				childStartCenter[flowStart] = rect[flowStart];
				let childEndCenter = center(rect);
				childEndCenter[flowStart] = rect[flowEnd];

				let minStartDistance = Infinity;
				let minEndDistance = Infinity;
				let newPlaceholderAfterElementStart;
				let newPlaceholderAfterElementEnd;

				// Iterate betweenChildren to find the closest line connecting two elements
				betweenChildren.forEach(x => {
					let startDistance = distToSegment(childStartCenter, x.p1, x.p2);
					if (startDistance < minStartDistance) {
						minStartDistance = startDistance;
						newPlaceholderAfterElementStart = x.after;
					}
					let endDistance = distToSegment(childEndCenter, x.p1, x.p2);
					if (endDistance < minEndDistance) {
						minEndDistance = endDistance;
						newPlaceholderAfterElementEnd = x.after;
					}
				});

				// Find the suggested new placeholder location that's different from the current...
				// TODO: If a short item is dragged over a long item at the beginning of a row and its placeholder still fits into the previous row, this flickers
				// * Visualise the generated lines between the items to get an idea of what the code sees
				//console.log("start is after center of " + newPlaceholderAfterElementStart.textContent);
				//console.log("end is after center of " + newPlaceholderAfterElementEnd.textContent);
				let newPlaceholderAfterElement;
				if (newPlaceholderAfterElementStart !== placeholderAfterElement)
					newPlaceholderAfterElement = newPlaceholderAfterElementStart;
				if (newPlaceholderAfterElementEnd !== placeholderAfterElement)
					newPlaceholderAfterElement = newPlaceholderAfterElementEnd;

				// ...and move it there
				if (newPlaceholderAfterElement !== undefined) {
					let eventCancelled = false;
					if (placeholderAfterElement !== undefined) {
						let events = child.F.trigger("sortablechange", { bubbles: true, cancelable: true }, {
							after: newPlaceholderAfterElement
						});
						eventCancelled = events.first.defaultPrevented;
					}
					if (!eventCancelled) {
						if (!newPlaceholderAfterElement)
							placeholder.F.insertBefore(elem.firstChild);
						else
							placeholder.F.insertAfter(newPlaceholderAfterElement);
						placeholderAfterElement = newPlaceholderAfterElement;
						updateChildren();
					}
				}
			});
			child.F.on("draggableend" + sortableEventClass, event => {
				event.stopImmediatePropagation();
				child.F.style = { position: "", width: "", height: "", top: "", left: "" };
				placeholder.replaceWith(child);
				placeholder = undefined;
				betweenChildren = undefined;

				// Reset the size of table row cells
				if (child.F.nodeNameLower === "tr") {
					child.F.closest("table")
						.querySelector("tr")
						?.querySelectorAll(":scope > :is(td, th)")
						.forEach(obj => {
							if (obj.dataset.widthBeforeDrag)
								obj.F.width = +obj.dataset.widthBeforeDrag;
							obj.F.dataset.widthBeforeDrag = null;
						});
					child.F.querySelectorAll(":scope > :is(td, th)")
						.forEach(obj => {
							obj.style.width = "";
						});
					child.style.minWidth = "";
				}

				let events = child.F.trigger("sortableend", { bubbles: true, cancelable: true }, {
					initialIndex: initialChildIndex,
					newIndex: child.F.index,
					after: placeholderAfterElement
				});
				if (events.first.defaultPrevented) {
					if (!initialChildAfterElement)
						child.F.insertBefore(elem.firstChild);
					else
						child.F.insertAfter(initialChildAfterElement);
				}
				initialChildAfterElement = undefined;
			});

			function updateChildren() {
				betweenChildren = [];
				let rowElements = [];
				let rowMin, rowMax, currentPos, childElem = null;
				Array.from(elem.children).forEach(obj => {
					if (obj !== child) {
						let rect = obj.F.rect;
						if (rect[flowStart] + 0.1 < currentPos) {   // Need to compensate for rounding issues from the 4th decimal in Chrome/Edge/IE
							// This element is in a new row
							addRow();
						}

						// Remember the width of a row
						if (rowMin === undefined || rect[crossStart] < rowMin) rowMin = rect[crossStart];
						if (rowMax === undefined || rect[crossEnd] < rowMax) rowMax = rect[crossEnd];

						// Remember how far the row has been used
						currentPos = rect[flowEnd];

						if (obj !== placeholder) childElem = obj;
						rowElements.push({ elem: childElem, rect: rect });
					}
				});

				// Don't forget the last row
				addRow();

				function addRow() {
					let rowCenter = (rowMin + rowMax) / 2;

					// Add line before the first element in the row
					betweenChildren.push({
						// far away
						p1: createPoint(-10000, rowCenter),
						// the first row element's center
						p2: createPoint(center(rowElements[0].rect)[flowStart], rowCenter),
						// the position after the last element of the previous row, if any
						after: betweenChildren.length > 0 ? betweenChildren[betweenChildren.length - 1].after : null
					});

					// Now add lines after each element in the row
					rowElements.forEach((x, i) => {
						betweenChildren.push({
							// the current row element's center
							p1: createPoint(center(x.rect)[flowStart], rowCenter),
							// the next row element's center, if any; otherwise far away
							p2: createPoint(i < rowElements.length - 1 ? center(rowElements[i + 1].rect)[flowStart] : 10000, rowCenter),
							// the position after the current row element
							after: x.elem
						});
					});

					// Reset values for the new row
					rowMin = rowMax = currentPos = undefined;
					rowElements = [];
				}
			}
		}

		// Returns an absolute point with "left" and "top" coordinates for the current orientation.
		function createPoint(flow, cross) {
			let p = {};
			p[flowStart] = flow;
			p[crossStart] = cross;
			return p;
		}

		function remove() {
			observer.disconnect();
			elem.F.children.forEach(child => {
				child.F.off(sortableEventClass);
				child.F.draggable.remove();
			});
		}
	});
}

// Removes the sortable features from the elements.
function remove() {
	return this.forEach(elem => {
		if (!elem.classList.contains(sortableClass)) return;
		elem.classList.remove(sortableClass);
		let opt = F.loadOptions("sortable", elem);
		opt._remove();
	});
}

F.registerPlugin("sortable", sortable, {
	defaultOptions: sortableDefaults,
	methods: {
		remove: remove
	},
	selectors: [".sortable"]
});
