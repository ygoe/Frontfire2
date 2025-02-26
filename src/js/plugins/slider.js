// ==================== Slider plugin ====================

const sliderClass = "ff-slider";
const backgroundClass = "ff-background";
const rangeClass = "ff-range";
const ticksClass = "ff-ticks";
const handleClass = "ff-handle";
const sliderEventClass = ".ff-slider";
const sliderDragEventClass = ".ff-slider-drag";

// Defines default options for the slider plugin.
let sliderDefaults = {
	// The orientation of the slider, either "h" or "v".
	orientation: "h",

	// The current value of the slider.
	value: 0,

	// The current values of the slider. Overrides the single value option.
	values: null,

	// The minimum value of the slider range.
	min: 0,

	// The maximum value of the slider range.
	max: 100,

	// The base value of the range rectangle ("min", "max", any value e.g. 0).
	rangeBase: 0,

	// The large step of the slider.
	largeStep: 10,

	// The small step of the slider.
	smallStep: 1,

	// Indicates whether the large step ticks are visible.
	largeTicks: true,

	// Indicates whether the small step ticks are visible.
	smallTicks: false,

	// Indicates whether the large step ticks have their value as label.
	largeTickLabels: true,

	// Indicates whether the small step ticks have their value as label.
	smallTickLabels: false,

	// The location of the tick marks in the slider ("topleft", "bottomright", "both", "none").
	tickPlacement: "topleft",

	// The number of slider handles.
	handleCount: 1,

	// How multiple handles interact with each other while dragging ("locked", "push", "free").
	handleInteractionMode: "locked",

	// Overflow the range if the two handles have the same value.
	rangeOverflowEqual: false,

	// Hide ranges when the end is less than the start.
	hideWrapping: false,

	// Individual ranges. Overrides the rangeBase option and two-handle range behaviour.
	// Each range object has the properties: start, end, overflowEqual, color, className.
	// start and end can be fixed values, "min"/"max", or zero-based handle references prefixed with "#".
	ranges: null,

	// Indicates whether the slider has a logarithmic scale.
	logarithmic: false,   // TODO (implementation and documentation)

	// The mouse cursor to show during dragging the slider.
	dragCursor: undefined
};

// Creates a slider widget.
function slider(options) {
	return this.forEach(slider => {
		if (slider.classList.contains(sliderClass)) return;   // Already done
		slider.classList.add(sliderClass);
		let converters = {
			values: value => JSON.parse(value),
			ranges: value => JSON.parse(value)
		};
		let opt = F.initOptions("slider", slider, converters, options);
		let dragHandleOffsets = [], dragHandlePointerIds = [];
		let lastTouchedHandleIndex = 0;
		let isVertical = opt.orientation === "v";
		let initialTabindex;
		let originalcursor;
		let touchDownPos;

		opt._setValue = setValue;

		if (!opt.values) opt.values = [opt.value];
		if (opt.max < opt.min) opt.max = opt.min;
		if (opt.handleCount < 1) opt.handleCount = 1;

		let backgroundElement = F.c("div");
		backgroundElement.classList.add(backgroundClass);
		slider.append(backgroundElement);

		// Create 1 pair of ranges by default; more only if individually specified
		let ranges = [];
		for (let index = 0; index < Math.max(1, opt.ranges && opt.ranges.length); index++) {
			let range = F.c("div");
			range.classList.add(rangeClass);
			slider.append(range);
			ranges[index * 2] = range;

			range = F.c("div");
			range.classList.add(rangeClass);
			slider.append(range);
			ranges[index * 2 + 1] = range;
		}
		if (opt.ranges) {
			opt.ranges.forEach((rangeItem, index) => {
				if (rangeItem.color) {
					ranges[index * 2].style.background = rangeItem.color;
					ranges[index * 2 + 1].style.background = rangeItem.color;
				}
				if (rangeItem.className) {
					// Support multiple space-separated class names or arrays
					ranges[index * 2].F.classList.add(rangeItem.className);
					ranges[index * 2 + 1].F.classList.add(rangeItem.className);
				}
			});
		}

		// Create ticks layer, it will contain the actual ticks with their labels
		let ticks = F.c("div");
		ticks.classList.add(ticksClass);
		slider.append(ticks);

		// Create handles
		let handles = [];
		for (let index = 0; index < opt.handleCount; index++) {
			let handle = F.c("div");
			handle.classList.add(handleClass);
			slider.append(handle);
			handles[index] = handle;
		}

		// Use precision to avoid ugly JavaScript floating point rounding issues
		// (like 35 * 0.01 = 0.35000000000000003)
		let decimals = -Math.floor(Math.log10(opt.smallStep));

		let rangeBaseValue = opt.rangeBase;
		if (rangeBaseValue === "min") rangeBaseValue = opt.min;
		if (rangeBaseValue === "max") rangeBaseValue = opt.max;
		rangeBaseValue = Math.max(opt.min, Math.min(rangeBaseValue, opt.max));
		let rangeBasePos = Math.round((rangeBaseValue - opt.min) / (opt.max - opt.min) * 10000) / 100;

		let startAttr, endAttr;

		if (isVertical) {
			startAttr = "bottom";
			endAttr = "top";
			slider.classList.add("vertical");
		}
		else {
			startAttr = "left";
			endAttr = "right";
			slider.classList.remove("vertical");
		}
		for (let index = 0; index < opt.handleCount; index++) {
			setValue(index, opt.values[index]);
		}

		// Draw ticks
		if (opt.smallTicks || opt.largeTicks) {
			let minTick = Math.ceil(opt.min / opt.smallStep) * opt.smallStep;
			for (let value = minTick; value <= opt.max; value += opt.smallStep) {
				value = F.round(value, decimals);
				let large = value / opt.largeStep === Math.trunc(value / opt.largeStep);
				if (!large && !opt.smallTicks) continue;

				let pos = Math.round((value - opt.min) / (opt.max - opt.min) * 10000) / 100;
				let ticksF = F();
				if (opt.tickPlacement === "both" || opt.tickPlacement === "topleft") {
					let tick = F.c("div");
					tick.style[startAttr] = pos + "%";
					ticks.append(tick);
					ticksF.add(tick);
				}
				if (opt.tickPlacement === "both" || opt.tickPlacement === "bottomright") {
					let tick = F.c("div");
					tick.classList.add("opposite");
					tick.style[startAttr] = pos + "%";
					ticks.append(tick);
					ticksF.add(tick);
				}
				if (large) {
					ticksF.classList.add("large");
				}
				if (opt.smallTickLabels || opt.largeTickLabels && large) {
					ticksF.dataset.label = value;
				}
			}
		}

		handles.F.style.touchAction = isVertical ? "pan-x" : "pan-y";
		handles.F.on("pointerdown", event => {
			event.preventDefault();

			// Select touched handle
			let handle = event.target.closest("." + handleClass);
			var index = handles.indexOf(handle);
			if (index === -1) {
				console.warn("Clicked slider handle not found");
				return;   // Should not happen: handle not found
			}

			// Remember where the handle was dragged (probably not exactly the centre)
			if (isVertical)
				// Measure in slider direction, upwards is positive
				dragHandleOffsets[index] = (handles[index].F.top + handles[index].F.borderHeight / 2) - event.pageY;
			else
				dragHandleOffsets[index] = event.pageX - (handles[index].F.left + handles[index].F.borderWidth / 2);
		});
		slider.F.on("pointerdown", event => {
			if (slider.F.disabled) return;
			if (event.button === 0) {
				event.preventDefault();
				event.stopImmediatePropagation();
				slider.focus();

				let isFirstDrag = dragHandlePointerIds.every(id => id === undefined);
				if (isFirstDrag)
					slider.F.trigger("firstdragstart", { bubbles: true });

				// Select touched or nearest handle and remember by pointerId
				let handle = event.target.closest("." + handleClass);
				let index = handles.indexOf(handle);
				if (index === -1) {
					// Not clicked on a handle.
					// Find nearest handle, prefer same direction (for locked handles on the same value)
					let pointerValue = getValueFromEvent(event);
					let minValueDistance = Infinity;
					opt.values.forEach((value, valueIndex) => {
						let valueDistance = Math.abs(value - pointerValue);
						if (valueDistance < minValueDistance ||
							pointerValue > value && valueDistance <= minValueDistance) {
							minValueDistance = valueDistance;
							index = valueIndex;
							handle = handles[index];
						}
					});
					// Drag this handle at its centre
					dragHandleOffsets[index] = 0;
				}
				dragHandlePointerIds[index] = event.pointerId;
				lastTouchedHandleIndex = index;

				handle.classList.add("pressed");
				onMove(event);

				if (isFirstDrag) {
					originalcursor = slider.style.cursor;
					if (opt.dragCursor)
						slider.style.cursor = opt.dragCursor;
					else
						slider.style.cursor = handle.F.computedStyle.cursor;
					slider.setPointerCapture(event.pointerId);
					slider.F.on(`pointermove${sliderDragEventClass}`, onMove);
					slider.F.on(`pointerup${sliderDragEventClass} pointercancel${sliderDragEventClass}`, onEnd);
				}
			}
		});

		// Make the element focusable if not already specified
		initialTabindex = slider.getAttribute("tabindex");
		if (initialTabindex === null) {
			initialTabindex = "0";
			slider.setAttribute("tabindex", initialTabindex);
		}

		// Make the element unfocusable when disabled
		slider.F.on("disabledchange", () => {
			if (slider.F.disabled)
				slider.removeAttribute("tabindex");
			else
				slider.setAttribute("tabindex", initialTabindex);
		});

		slider.F.on("blur" + sliderEventClass, () => slider.classList.remove("ff-focus-visible"));
		slider.F.on("keydown" + sliderEventClass, event => {
			if (slider.F.disabled) return;
			if (event.key !== "Control" && event.key !== "Shift" && event.key !== "Alt")
				slider.classList.add("ff-focus-visible");
			onKeydown(event);
		});
		slider.F.on("keyup" + sliderEventClass, event => {
			// When the Tab key was released on this element, it must have been focused by keyboard.
			// Since the :focus-visible matches after clicking on the slider which is wrong, we need
			// to use this hacky detection here. It has the disadvantage that the tab-key-focused
			// element only shows its focus outline when the Tab key is released, not immediately
			// when it is pressed.
			if (slider.F.disabled) return;
			if (event.key === "Tab")
				slider.classList.add("ff-focus-visible");
		});

		// TODO: Trigger "remove" event for DOM elements being removed, like jQuery UI overrides $.cleanData (once!)
		// TODO: slider.on("remove", /* cancel current drag operation and remove all events */) - also in other widgets!

		function onMove(event) {
			// Select dragged handle from pointerId
			let index = dragHandlePointerIds.indexOf(event.pointerId);
			if (index === -1) return;   // Not my pointer

			if (event.pointerType === "touch") {
				let eventPos = isVertical ? event.pageY : event.pageX;
				if (event.type === "pointerdown") {
					touchDownPos = eventPos;
					return;
				}
				if (Math.abs(eventPos - touchDownPos) < 8) {
					return;   // Move some more to prove your intention and avoid false detection when actually scrolling the page
				}
			}

			let value = getValueFromEvent(event);

			if (opt.handleCount > 1) {
				switch (opt.handleInteractionMode) {
					case "locked":
						if (index > 0 && value < opt.values[index - 1])
							value = opt.values[index - 1];
						if (index < opt.handleCount - 1 && value > opt.values[index + 1])
							value = opt.values[index + 1];
						break;

					case "push":
						for (let otherIndex = index - 1; otherIndex >= 0; otherIndex--) {
							if (value < opt.values[otherIndex])
								setValue(otherIndex, value);
						}
						for (let otherIndex = index + 1; otherIndex < opt.handleCount; otherIndex++) {
							if (value > opt.values[otherIndex])
								setValue(otherIndex, value);
						}
						break;
				}
			}

			setValue(index, value);
		}

		function onEnd(event) {
			// Select dragged handle from pointerId
			let index = dragHandlePointerIds.indexOf(event.pointerId);
			if (index === -1) return;   // Not my pointer

			if (event.button === 0) {
				dragHandlePointerIds[index] = undefined;
				handles[index].classList.remove("pressed");

				let isLastDrag = dragHandlePointerIds.every(id => id === undefined);
				if (isLastDrag) {
					slider.releasePointerCapture(event.pointerId);
					slider.style.cursor = originalcursor;
					slider.F.off(sliderDragEventClass);
					slider.F.trigger("lastdragend", { bubbles: true });
				}
			}
		}

		function onKeydown(event) {
			if (slider.F.disabled) return;
			if (event.key === "ArrowDown" || event.key === "ArrowLeft") {
				event.preventDefault();
				setValue(lastTouchedHandleIndex, opt.values[lastTouchedHandleIndex] - (event.shiftKey ? opt.largeStep : opt.smallStep));
			}
			if (event.key === "ArrowUp" || event.key === "ArrowRight") {
				event.preventDefault();
				setValue(lastTouchedHandleIndex, opt.values[lastTouchedHandleIndex] + (event.shiftKey ? opt.largeStep : opt.smallStep));
			}
			if (event.key === "PageDown") {
				event.preventDefault();
				setValue(lastTouchedHandleIndex, opt.values[lastTouchedHandleIndex] - opt.largeStep);
			}
			if (event.key === "PageUp") {
				event.preventDefault();
				setValue(lastTouchedHandleIndex, opt.values[lastTouchedHandleIndex] + opt.largeStep);
			}
			if (event.key === "Home") {
				event.preventDefault();
				setValue(lastTouchedHandleIndex, opt.min);
			}
			if (event.key === "End") {
				event.preventDefault();
				setValue(lastTouchedHandleIndex, opt.max);
			}
		}

		// Gets the slider value from the coordinates of a pointer event.
		function getValueFromEvent(event) {
			// Select dragged handle from pointerId
			let index = dragHandlePointerIds.indexOf(event.pointerId);

			// Assume centre click if pointer is unknown
			let myDragHandleOffset = 0;
			if (index !== -1) myDragHandleOffset = dragHandleOffsets[index];

			let sliderRect = slider.F.rect;
			let pointerPosIntoSlider;   // Distance from min end of the slider to the pointer
			let sliderLength;   // Length of the slider in drag direction
			if (isVertical) {
				let sliderBorder = parseFloat(slider.F.computedStyle.borderTopWidth);
				pointerPosIntoSlider = sliderRect.bottom - sliderBorder - event.pageY;
				sliderLength = slider.F.paddingHeight;
			}
			else {
				let sliderBorder = parseFloat(slider.F.computedStyle.borderLeftWidth);
				pointerPosIntoSlider = event.pageX - sliderRect.left - sliderBorder;
				sliderLength = slider.F.paddingWidth;
			}

			let handleCenterPos = pointerPosIntoSlider - myDragHandleOffset;   // Position of the handle's centre
			let value = handleCenterPos / sliderLength * (opt.max - opt.min) + opt.min;   // Selected value
			return value;
		}

		// Sets a slider value and triggers the change event. Also moves the handle.
		function setValue(index, value) {
			value = Math.max(opt.min, Math.min(value, opt.max));
			value = Math.round(value / opt.smallStep) * opt.smallStep;   // Snap to steps
			value = F.round(value, decimals);
			moveHandle(index, value);
			if (value !== opt.values[index]) {
				opt.values[index] = value;
				slider.F.trigger("change", { bubbles: true }, {
					index: index,
					value: value
				});
			}
		}

		// Moves a handle to the specified slider value and updates the ranges.
		function moveHandle(index, value) {
			let pos = getPosFromValue(value);
			handles[index].style[startAttr] = pos + "%";

			// Also update ranges
			if (opt.ranges) {
				opt.ranges.forEach((rangeItem, rangeIndex) => {
					let start = rangeItem.start, startHandleIndex;
					if (start === "min") {
						start = opt.min;
					}
					else if (start === "max") {
						start = opt.max;
					}
					else if (start[0] === "#") {
						startHandleIndex = +start.substring(1);
						start = startHandleIndex === index ? value : opt.values[startHandleIndex];
					}
					if (start < opt.min) start = opt.min;
					if (start > opt.max) start = opt.max;

					let end = rangeItem.end, endHandleIndex;
					if (end === "min") {
						end = opt.min;
					}
					else if (end === "max") {
						end = opt.max;
					}
					else if (end[0] === "#") {
						endHandleIndex = +end.substring(1);
						end = endHandleIndex === index ? value : opt.values[endHandleIndex];
					}
					if (end < opt.min) end = opt.min;
					if (end > opt.max) end = opt.max;

					let startPos = getPosFromValue(start);
					let endPos = getPosFromValue(end);
					let overflowEqual = rangeItem.overflowEqual ||
						startHandleIndex !== undefined && endHandleIndex !== undefined && endHandleIndex < startHandleIndex;
					setRange(rangeIndex, startPos, endPos, overflowEqual, opt.hideWrapping);
				});
			}
			else if (opt.handleCount === 1) {
				if (pos < rangeBasePos)
					setRange(0, pos, rangeBasePos, false, opt.hideWrapping);
				else
					setRange(0, rangeBasePos, pos, false, opt.hideWrapping);
			}
			else if (opt.handleCount === 2) {
				let pos0 = index === 0 ? pos : getPosFromValue(opt.values[0]);
				let pos1 = index === 1 ? pos : getPosFromValue(opt.values[1]);
				setRange(0, pos0, pos1, opt.rangeOverflowEqual, opt.hideWrapping);
			}
		}

		// Sets the size of a range element for a start and end value, supporting overflow.
		function setRange(index, start, end, overflowEqual, hideWrapping) {
			if (start < end || start === end && !overflowEqual) {
				// Only one contiguous range, hide the second element
				ranges[index * 2].style[startAttr] = start + "%";
				ranges[index * 2].style[endAttr] = (100 - end) + "%";
				ranges[index * 2 + 1].style[startAttr] = "0%";
				ranges[index * 2 + 1].style[endAttr] = "100%";
			}
			else if (!hideWrapping) {
				// Overflow range, split in two elements from either end of the slider
				ranges[index * 2].style[startAttr] = "0%";
				ranges[index * 2].style[endAttr] = (100 - end) + "%";
				ranges[index * 2 + 1].style[startAttr] = start + "%";
				ranges[index * 2 + 1].style[endAttr] = "0%";
			}
			else {
				// Overflow range, hidden
				ranges[index * 2].style[startAttr] = start + "%";
				ranges[index * 2].style[endAttr] = (100 - start) + "%";
				ranges[index * 2 + 1].style[startAttr] = "0%";
				ranges[index * 2 + 1].style[endAttr] = "100%";
			}
		}

		// Returns the relative position in percent from the slider value.
		function getPosFromValue(value) {
			let pos = Math.round((value - opt.min) / (opt.max - opt.min) * 10000) / 100;
			return pos;
		}
	});
}

// Gets the current slider value.
function getSliderValue() {
	return this.slider.multivalue(0);
}

// Sets the current slider value.
function setSliderValue(value) {
	return this.slider.multivalue(0, value);
}

// Gets the current value of the specified slider handle.
//
// value: Sets the value of the specified slider handle.
function sliderMultiValue(index, value) {
	// Getter
	if (value === undefined) {
		let slider = this.first;
		if (!slider) return;   // Nothing to do
		let opt = F.loadOptions("slider", slider);
		return opt?.values[index];
	}

	// Setter
	return this.forEach(slider => {
		let opt = F.loadOptions("slider", slider);
		opt && opt._setValue(index, value);
	});
}

F.registerPlugin("slider", slider, {
	defaultOptions: sliderDefaults,
	methods: {
		value: {
			get: getSliderValue,
			set: setSliderValue
		},
		multivalue: sliderMultiValue
	},
	selectors: [
		".slider"
	]
});
