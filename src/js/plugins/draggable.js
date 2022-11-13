// ==================== Draggable plugin ====================

const draggableClass = "ff-draggable";
const draggableEventClass = ".ff-draggable";

// Defines default options for the draggable plugin.
let draggableDefaults = {
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
	// accepted by the Frontfire constructor.
	stack: undefined,

	// The mouse cursor to show during dragging.
	dragCursor: undefined,

	// A CSS class to add to the element while it's being dragged.
	dragClass: undefined,

	// The grid to snap the dragged element to during dragging, as [x, y] in pixels.
	grid: undefined,

	// Indicates whether the window should scroll to keep the dragged element visible.
	scroll: false,

	// An element that catches all pointer input and moves the draggable to that point, in any
	// format accepted by the Frontfire constructor.
	catchElement: undefined
};

// Makes each selected elements draggable.
function draggable(options) {
	return this.forEach(elem => {
		if (elem.classList.contains(draggableClass)) return;   // Already done
		elem.classList.add(draggableClass);

		let dragging, draggingCancelled, dragPoint, elemRect, minDragDistance, pointerId, origCursor;
		let opt = F.initOptions("draggable", elem, {}, options);

		let handleF = elem.F;
		if (F.isString(opt.handle))
			handleF = elem.F.querySelectorAll(opt.handle);
		else if (opt.handle)
			handleF = F(opt.handle);
		opt.handleF = handleF;

		handleF.style.touchAction = opt.axis === "x" ? "pan-y" : opt.axis === "y" ? "pan-x" : "none";
		handleF.on(`pointerdown${draggableEventClass}`, event => {
			if (event.button === 0) {
				event.stopImmediatePropagation();
				event.preventDefault();   // Prevent text selection and, as a consequence, page scrolling
				if (dragging) return;
				draggingCancelled = false;
				dragPoint = { left: event.pageX, top: event.pageY };
				pointerId = event.pointerId;
				minDragDistance = event.pointerType === "touch" ? 8 : 4;
				F(window).on(`>pointermove${draggableEventClass}`, onMove);
				F(window).on(`>pointerup${draggableEventClass} >pointercancel${draggableEventClass}`, onEnd);
			}
		});
		// Prevent <a> elements from dragging the link
		opt.resetAHandlesDraggable = [];
		handleF.where("a").forEach(a => {
			if (a.draggable) {
				a.draggable = false;
				opt.resetAHandlesDraggable.push(a);
			}
		});

		let cancelF = null;
		if (F.isString(opt.cancel))
			cancelF = elem.F.querySelectorAll(opt.cancel);
		else if (opt.cancel)
			cancelF = F(opt.cancel);
		opt.cancelF = cancelF;

		cancelF?.on(`pointerdown${draggableEventClass}`, event => {
			event.stopImmediatePropagation();
		});

		if (opt.catchElement) {
			F(opt.catchElement).on(`pointerdown${draggableEventClass}`, event => {
				if (event.button === 0) {
					event.stopImmediatePropagation();
					if (dragging) return;
					draggingCancelled = false;
					dragPoint = { left: event.pageX, top: event.pageY };
					pointerId = event.pointerId;
					F(window).on(`>pointermove${draggableEventClass}`, onMove);
					F(window).on(`>pointerup${draggableEventClass} >pointercancel${draggableEventClass}`, onEnd);
					// Start dragging mode immediately when catching.
					tryStartDragging(event);
					if (dragging) {
						// Move the draggable element directly under the pointer initially
						elemRect.top = dragPoint.top - elemRect.height / 2;
						elemRect.left = dragPoint.left - elemRect.width / 2;
						handleMove(event);
					}
				}
			});
		}

		function tryStartDragging(event) {
			elemRect = elem.F.rect;
			let events = elem.F.trigger("draggablestart", { bubbles: true, cancelable: true }, {
				dragPoint: dragPoint,
				newPoint: { left: event.pageX, top: event.pageY }
			});
			if (!events.first.defaultPrevented) {
				dragging = true;
				opt.dragClass && elem.F.classList.add(opt.dragClass);
				elem.setPointerCapture(event.pointerId);
				if (opt.stack)
					stackElements(F(opt.stack), elem);
				if (opt.dragCursor) {
					origCursor = elem.style.cursor;
					elem.style.setProperty("cursor", opt.dragCursor, "important");
				}
			}
			else {
				draggingCancelled = true;
			}
		}

		function handleMove(event) {
			// Start with the default drag movement position
			var newPoint = {
				top: elemRect.top + event.pageY - dragPoint.top,
				left: elemRect.left + event.pageX - dragPoint.left
			};

			// Consider constraints
			if (opt.grid) {
				let gridBaseTop = elem.parentElement.F.top;
				let gridBaseLeft = elem.parentElement.F.left;
				newPoint = {
					top: Math.round((newPoint.top - gridBaseTop) / opt.grid[1]) * opt.grid[1] + gridBaseTop,
					left: Math.round((newPoint.left - gridBaseLeft) / opt.grid[0]) * opt.grid[0] + gridBaseLeft
				};
			}
			if (opt.axis === "x") {
				newPoint.top = elemRect.top;
			}
			if (opt.axis === "y") {
				newPoint.left = elemRect.left;
			}
			if (opt.containment) {
				let contF, contRect;
				if (opt.containment === "parent") {
					contF = elem.F.parentElement;
				}
				else if (opt.containment === "viewport") {
					let scrollTop = window.scrollY;
					let scrollLeft = window.scrollX;
					contRect = {
						top: 0 + scrollTop,
						left: 0 + scrollLeft,
						bottom: document.documentElement.clientHeight + scrollTop,
						right: document.documentElement.clientWidth + scrollLeft
					};
				}
				else {
					contF = F(opt.containment);
				}
				if (contF && contF.length > 0) {
					contRect = contF.rect;
				}
				if (contRect) {
					let stepX = opt.grid ? opt.grid[0] : 1;
					let stepY = opt.grid ? opt.grid[1] : 1;
					while (newPoint.left < contRect.left) newPoint.left += stepX;
					while (newPoint.left + elemRect.width > contRect.right) newPoint.left -= stepX;
					while (newPoint.top < contRect.top) newPoint.top += stepY;
					while (newPoint.top + elemRect.height > contRect.bottom) newPoint.top -= stepY;
				}
			}

			// Move element
			let events = elem.F.trigger("draggablemove", { bubbles: true, cancelable: true }, {
				elemRect: elemRect,
				newPoint: newPoint
			});
			if (!events.first.defaultPrevented) {
				let elemCStyle = elem.F.computedStyle;
				let left = events.first.newPoint.left - parseFloat(elemCStyle.marginLeft);
				let top = events.first.newPoint.top - parseFloat(elemCStyle.marginTop);
				elem.F.moveTo(left, top);
			}

			// Handle auto-scrolling
			if (opt.scroll) {
				elem.F.scrollIntoView();
			}
		}

		function onMove(event) {
			if (event.pointerId !== pointerId) return;   // Not my pointer
			if (draggingCancelled) return;   // Don't try again until the button was released

			// Consider starting a drag operation
			if (dragPoint && !dragging && !elem.F.disabled) {
				let distance = Math.sqrt(Math.pow(event.pageX - dragPoint.left, 2) + Math.pow(event.pageY - dragPoint.top, 2));
				if (distance >= minDragDistance) {
					tryStartDragging(event);
				}
			}

			// Handle an ongoing drag operation
			if (dragging) {
				handleMove(event);
			}
		}

		function onEnd(event) {
			if (event.pointerId !== pointerId) return;   // Not my pointer

			if (event.button === 0) {
				var wasDragging = dragging;
				dragPoint = undefined;
				dragging = false;
				pointerId = undefined;
				opt.dragClass && elem.F.classList.remove(opt.dragClass);
				F(window).off(">" + draggableEventClass);

				if (wasDragging) {
					elem.releasePointerCapture(event.pointerId);
					if (opt.dragCursor)
						elem.style.cursor = origCursor;

					// If event.type is "pointerup", a click event may follow somewhere!
					if (event.type === "pointerup") {
						event.target.F.once(`click${draggableEventClass}`, event => event.preventDefault());
						setTimeout(() => event.target.F.off(`click${draggableEventClass}`), 50);
					}

					elem.F.trigger("draggableend", { bubbles: true }, {
						revert: () => {
							let elemCStyle = elem.F.computedStyle;
							let left = elemRect.left - parseFloat(elemCStyle.marginLeft);
							let top = elemRect.top - parseFloat(elemCStyle.marginTop);
							elem.F.moveTo(left, top);
						}
					});
				}
			}
		}
	});
}

// Removes the draggable features from the elements.
function remove() {
	return this.forEach(elem => {
		if (!elem.classList.contains(draggableClass)) return;
		elem.classList.remove(draggableClass);
		let opt = F.loadOptions("draggable", elem);
		opt.handleF.off(draggableEventClass);
		opt.resetAHandlesDraggable.forEach(a => a.draggable = true);
		opt.cancelF?.off(draggableEventClass);
		if (opt.catchElement)
			F(opt.catchElement).off(draggableEventClass);
	});
}

// Stacks the selected Nodes and moves one element to the top.
function stackElements(stackedElemsF, dragElem) {
	// Find all selected stackable elements and sort them by:
	//   currently dragging, then z-index, then DOM index
	// and assign their new z-index
	let stackedElems = stackedElemsF
		.select((el, index) => {
			let zIndex = parseInt(el.F.computedStyle.zIndex);
			if (isNaN(zIndex))
				zIndex = stackedElemsF.length;
			return { elem: el, dragElem: el === dragElem ? 1 : 0, index: index, zIndex: zIndex };
		})
		.sort((a, b) => {
			if (a.dragElem !== b.dragElem) return a.dragElem - b.dragElem;
			if (a.zIndex !== b.zIndex) return a.zIndex - b.zIndex;
			return a.index - b.index;
		});
	if (stackedElems.length > 0) {
		let maxZIndex = stackedElems.max(o => o.zIndex);
		stackedElems.forEach((item, index) => {
			item.elem.style.zIndex = maxZIndex - (stackedElems.length - 1) + index;
		});
	}
}

F.registerPlugin("draggable", draggable, {
	defaultOptions: draggableDefaults,
	methods: {
		remove: remove
	}
});
