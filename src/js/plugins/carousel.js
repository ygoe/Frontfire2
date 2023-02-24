// ==================== Carousel plugin ====================

const carouselClass = "ff-carousel";
const carouselIndicatorClass = "ff-carousel-indicator";

// Defines default options for the carousel plugin.
let carouselDefaults = {
	// The index of the initially active item.
	active: 0,

	// The number of items concurrently visible.
	items: 1,

	// Show an indicator dot each x items. -1 means the same value as items.
	dotsEach: -1,

	// The margin between two items, in pixels.
	gutter: 0,

	// Shows the indicator dots for the active item.
	indicator: true,

	// Starts looping through all items automatically.
	autoPlay: false,

	// Autoplay item switch interval, in milliseconds.
	autoPlayInterval: 4000,

	// Pauses autoplay while the carousel is hovered with the mouse.
	pauseOnHover: true,

	// The mouse cursor to show during dragging.
	dragCursor: undefined,

	// The animation between items.
	// Possible values: slide-all, slide-in, slide-out, fade, slide-fade
	// For more than one visible item, only slide-all is supported and automatically used.
	animation: "slide-all",

	// Loops all items at the end instead of rewinding/restricting.
	// TODO
	//loop: false
};

// Converts each selected element into a carousel.
function carousel(options) {
	return this.forEach(carousel => {
		if (carousel.querySelector("." + carouselClass)) return;   // Already done
		let opt = F.initOptions("carousel", carousel, {}, options);

		if (opt.items > 1 || opt.gutter > 0)
			opt.animation = "slide-all";

		let stage = F.c("div");
		stage.classList.add(carouselClass);

		opt._gutterWidth = (opt.items - 1) / opt.items * opt.gutter;
		opt._gutterOffset = 1 / opt.items * opt.gutter;
		opt._itemWidthPercent = 100 / opt.items;
		opt._layout = layout;

		let itemIndex = 0;
		let maxItemHeight = 0;
		let items = carousel.F.children;
		let autoPlayTimeout;
		let itemOffset, startItemOffset, prevItemOffset, dragDirection, itemOffsetMin, itemOffsetMax, itemWidth;
		let currentTransition = "";
		let clickLock = false;
		let clickUnlockTimeout;

		if (opt.dotsEach === -1)
			opt.dotsEach = opt.items;
		opt.dotsEach = F.clamp(opt.dotsEach, 0, opt.items);

		// Set up items positioning
		items.forEach(obj => {
			obj.style.width = "calc(" + opt._itemWidthPercent + "% - " + opt._gutterWidth + "px)";
			maxItemHeight = Math.max(maxItemHeight, obj.F.borderHeight);
			stage.append(obj);
			itemIndex++;

			if (obj.getAttribute("href")) {
				obj.style.cursor = "pointer";
				obj.setAttribute("tabindex", "-1");
				obj.F.on("click", () => {
					if (!clickLock) {
						location.href = obj.getAttribute("href");
					}
				});
			}
		});
		carousel.append(stage);
		stage.style.height = maxItemHeight + "px";
		stage.setAttribute("tabindex", "-1");   // Would be tab-focusable otherwise (not sure why)

		// Add controls
		if (opt.indicator) {
			let indicator = F.c("div");
			indicator.classList.add(carouselIndicatorClass);
			carousel.append(indicator);
			let indicatorCount = Math.ceil(items.length / opt.dotsEach) - (opt.items - opt.dotsEach);
			for (let i = 0; i < indicatorCount; i++) {
				let dot = F("<span tabindex='0'><span></span></span>").appendTo(indicator).first;
				let fn = () => {
					carousel.F.carousel.activeItemIndex = i * opt.dotsEach;
					suspendAutoplay();
					resumeAutoplay();
				};
				dot.F.on("click", fn);
				dot.F.on("keydown", event => {
					if (event.key === "Enter") {
						event.preventDefault();
						fn();
					}
				});
			}
		}

		carousel.F.carousel.activeItemIndex = opt.active;

		stage.F.draggable({
			axis: "x",
			dragCursor: opt.dragCursor,
			cancel: stage.querySelectorAll("input, button, textarea, label")
		});
		stage.F.on("draggablestart", event => {
			let dx = Math.abs(event.dragPoint.left - event.newPoint.left);
			let dy = Math.abs(event.dragPoint.top - event.newPoint.top);
			if (dy > dx) {
				// Movement was mostly vertical, don't drag in that direction but leave scrolling intact
				event.preventDefault();
				return;
			}

			itemWidth = stage.F.width / opt.items;
			prevItemOffset = startItemOffset = layout();
			let lastPageFirstItem = Math.max(0, items.length - opt.items);
			itemOffsetMin = -opt.active;
			itemOffsetMax = lastPageFirstItem - opt.active;
			opt._isDragging = true;
			if (clickUnlockTimeout)
				clearTimeout(clickUnlockTimeout);
			clickLock = true;

			// Disable transition and autoplay while dragging
			removeTransition();
			suspendAutoplay();
		});
		stage.F.on("draggablemove", event => {
			itemOffset = startItemOffset - (event.newPoint.left - event.elemRect.left) / itemWidth;
			dragDirection = itemOffset - prevItemOffset;
			prevItemOffset = itemOffset;

			// Don't move the stage anywhere! Just tell me how far the pointer is dragged and we'll
			// move something else (the items within the stage) to provide the expected visual feedback.
			event.newPoint = event.elemRect;

			// Restrict dragging at start/end
			if (itemOffset < itemOffsetMin)
				itemOffset = itemOffsetMin - elastic(itemOffsetMin - itemOffset);
			if (itemOffset > itemOffsetMax)
				itemOffset = itemOffsetMax + elastic(itemOffset - itemOffsetMax);

			function elastic(exceeding) {
				var max = 0.25;
				// This function has a slope of 1 for x = 0 and slowly approaches (but never reaches) max
				return -max / (exceeding / max + 1) + max;
			}

			layout(itemOffset);
		});
		stage.F.on("draggableend", () => {
			// Restore transition and autoplay
			addTransition();
			resumeAutoplay();
			opt._isDragging = false;
			clickUnlockTimeout = setTimeout(() => clickLock = false, 100);

			// Snap to item, consider last drag direction
			let itemIndex = opt.active + itemOffset;
			if (itemIndex < 0)
				itemIndex = 0;
			let newDot = itemIndex / opt.dotsEach;
			if (dragDirection > 0)
				newDot = Math.ceil(newDot);
			else
				newDot = Math.floor(newDot);
			carousel.F.carousel.activeItemIndex = newDot * opt.dotsEach;
		});

		// Add transition after setting position of every item
		F.forceReflow();
		addTransition();

		let autoplaySuspendLevel = 0;
		if (opt.autoPlay) {
			if (opt.pauseOnHover) {
				stage.F.on("pointerenter", suspendAutoplay);
				stage.F.on("pointerleave", resumeAutoplay);
			}

			autoPlayTimeout = setTimeout(next, opt.autoPlayInterval);
		}

		function suspendAutoplay() {
			autoPlayTimeout && clearTimeout(autoPlayTimeout);
			autoplaySuspendLevel++;
		}

		function resumeAutoplay() {
			autoplaySuspendLevel--;
			if (opt.autoPlay && !autoplaySuspendLevel) {
				autoPlayTimeout = setTimeout(next, opt.autoPlayInterval * 2);
			}
		}

		function next() {
			let index = opt.active;
			index += opt.dotsEach;
			if (index > items.length - opt.items)
				index = 0;
			carousel.F.carousel.activeItemIndex = index;
			autoPlayTimeout = setTimeout(next, opt.autoPlayInterval);
		}

		function removeTransition() {
			currentTransition = "";
			items.style.transition = currentTransition;
		}

		function addTransition() {
			let opacityTime = "0.4s";
			if (opt.animation === "fade")
				opacityTime = "0.8s";
			currentTransition = "left 0.4s ease-in-out, opacity " + opacityTime + " ease-in-out";
			items.style.transition = currentTransition;
		}

		// Item layouts for each animation type:
		// slide-all
		//   All items are positioned next to each other and moved simultaneously
		//   No z-index or opacity is used
		// slide-out
		//   There are two stacks next to each other
		//   The right stack is at left: 0 (visible in the stage), the left stack is directly next to it
		//   The active item and all following items are on the right (visible) stack, with z-index from front to back
		//   The previous items are on the left (invisible) stack
		//   Only one item can be moved to the other stack at a time
		// slide-in
		//   There are two stacks next to each other
		//   The left stack is at left: 0 (visible in the stage), the right stack is directly next to it
		//   The active item and all previous items are on the left (visible) stack, with z-index from back to front
		//   The following items are on the right (invisible) stack
		//   Only one item can be moved to the other stack at a time
		// fade
		//   All items are stacked above one another, at the same position (left: 0, in the stage)
		//   The visible item or the item that is becoming visible is on z-index 1, opacity is 1.
		//   The previously visible item or the item that is becoming invisible is on z-index 2, opacity is (becoming) 0, pointer-events is none.
		//   All other items are on z-index 0 with opacity 0.
		// slide-fade
		//   Based on slide-all but moving items by 1/10th of the stage width.
		//   The active/visible item has opacity 1, gradually changing to 0 for the adjacent and all other items.

		// Translates between an item offset and the current layout.
		// The getter is used to initialise the item offset when starting to drag during an ongoing transition.
		// The setter is used everywhere the items need to be laid out for a new active item or item offset.
		function layout(itemOffset) {
			// Getter
			if (itemOffset === undefined) {
				let pos = [];
				let allSame = true;
				switch (opt.animation) {
					case "fade":
						let z1, z2, z2Opacity;
						items.forEach((obj, index) => {
							let style = obj.F.computedStyle;
							if (style.zIndex == 1)
								z1 = index;
							if (style.zIndex == 2) {
								z2 = index;
								z2Opacity = parseFloat(style.opacity);
							}
						});
						//console.log("get layout: z1=" + z1 + " z2=" + z2 + " z2Opacity=" + z2Opacity + " active=" + opt.active);
						if (z2 !== undefined) {
							if (z1 > z2)   // Moving forward (a higher item index is in layer 1, becoming visible)
								return z1 + (1 - z2Opacity) - opt.active - 1;
							else   // Moving backward
								return z1 + z2Opacity - opt.active;
						}
						if (z1 !== undefined)
							return z1 - opt.active;
						return 0;

					case "slide-in":
						let anyZero = false;
						let firstGtZero = -1;
						items.forEach((obj, index) => {
							let style = obj.F.computedStyle;
							let left = parseFloat(style.left);
							pos.push(left);
							if (left !== pos[0])
								allSame = false;
							if (left === 0)
								anyZero = true;
							if (left > 0 && firstGtZero === -1)
								firstGtZero = index;
						});
						if (allSame && pos[0] < 0)
							return items.length - 1 - pos[0] / itemWidth - opt.active;
						if (!anyZero)
							return -pos[0] / itemWidth - opt.active;
						if (firstGtZero > 0)
							return firstGtZero - pos[firstGtZero] / itemWidth - opt.active;
						return 0;

					case "slide-out":
						let anyPositive = false;
						let firstZero = -1;
						items.forEach((obj, index) => {
							let style = obj.F.computedStyle;
							let left = parseFloat(style.left);
							pos.push(left);
							if (left !== pos[0])
								allSame = false;
							if (left >= 0)
								anyPositive = true;
							if (left === 0 && firstZero === -1)
								firstZero = index;
						});
						if (allSame && pos[0] > 0)
							return -pos[0] / itemWidth - opt.active;
						if (!anyPositive)
							return items.length - 1 + -pos[pos.length - 1] / itemWidth - opt.active;
						if (firstZero > 0)
							return firstZero - 1 + -pos[firstZero - 1] / itemWidth - opt.active;
						return 0;

					case "slide-fade":
						let activeItemLeft2 = parseFloat(items.get(opt.active).F.computedStyle.left);
						return -activeItemLeft2 / (itemWidth / 10);

					case "slide-all":
					default:
						let activeItemLeft = parseFloat(items.get(opt.active).F.computedStyle.left);
						return -activeItemLeft / itemWidth;
				}
			}

			// Setter
			switch (opt.animation) {
				case "fade":
					if (itemOffset !== 0) {
						let fullyVisible = opt.active + Math.trunc(itemOffset);
						let partiallyVisible = opt.active + Math.trunc(itemOffset) + Math.sign(itemOffset);
						//console.log(fullyVisible, partiallyVisible);
						items.forEach((obj, index) => {
							if (index === fullyVisible) {
								obj.style.zIndex = "1";
								obj.style.opacity = "1";
							}
							else if (index === partiallyVisible) {
								obj.style.zIndex = "2";
								obj.style.opacity = Math.abs(itemOffset) - Math.trunc(Math.abs(itemOffset));
							}
							else {
								obj.style.zIndex = "0";
								obj.style.opacity = "0";
							}
						});
					}
					else {
						let z1, z2, z2Opacity;
						items.forEach((obj, index) => {
							let style = obj.F.computedStyle;
							if (style.zIndex == 1)
								z1 = index;
							if (style.zIndex == 2) {
								z2 = index;
								z2Opacity = parseFloat(style.opacity);
							}
						});
						//console.log("set layout: z1=" + z1 + " z2=" + z2 + " z2Opacity=" + z2Opacity + " active=" + opt.active);
						if (opt.active === z1) {
							items.get(z2).style.opacity = "0";
							items.get(z2).style.pointerEvents = "none";
						}
						else if (opt.active === z2) {
							removeTransition();
							items.get(z1).style.zIndex = "2";
							items.get(z1).style.opacity = 1 - z2Opacity;
							items.get(z2).style.zIndex = "1";
							items.get(z2).style.opacity = "1";
							items.get(z2).style.pointerEvents = "";
							F.forceReflow();
							if (!opt._isDragging)
								addTransition();
							items.get(z1).style.opacity = "0";
							items.get(z1).style.pointerEvents = "none";
						}
						else {
							let currentVisible;
							items.forEach((obj, index) => {
								let style = obj.F.computedStyle;
								if (style.zIndex == 1)
									currentVisible = index;
							});
							removeTransition();
							items.get(opt.active).style.zIndex = "1";
							items.get(opt.active).style.opacity = "1";
							items.get(opt.active).style.pointerEvents = "";
							F.forceReflow();
							if (!opt._isDragging)
								addTransition();
							items.forEach((obj, index) => {
								if (index === opt.active) {
								}
								else if (index === currentVisible) {
									obj.style.zIndex = "2";
									obj.style.opacity = "0";
									obj.style.pointerEvents = "none";
								}
								else {
									obj.style.zIndex = "0";
									obj.style.opacity = "0";
									obj.style.pointerEvents = "";
								}
							});
						}
					}

					//let status = "";
					//items.forEach((obj, index) => {
					//	let style = obj.F.computedStyle;
					//	status += index + ": z=" + style.zIndex + " op=" + style.opacity + (index === opt.active ? " active" : "") + "\n";
					//});
					//console.log(status);
					break;

				case "slide-in":
					items.forEach((obj, index) => {
						let left = opt.active + itemOffset <= items.length - 1 ?
							F.clamp((index - opt.active - itemOffset) * 100, 0, 100) :
							(items.length - 1 - opt.active - itemOffset) * 100;
						obj.style.left = left + "%";
						obj.style.zIndex = index;
					});
					break;

				case "slide-out":
					items.forEach((obj, index) => {
						let left = opt.active + itemOffset >= 0 ?
							F.clamp((index - opt.active - itemOffset) * 100, -100, 0) :
							(-opt.active - itemOffset) * 100;
						obj.style.left = left + "%";
						obj.style.zIndex = items.length - 1 - index;
					});
					break;

				case "slide-fade":
					items.forEach((obj, index) => {
						let percent = (index - opt.active) * 100 / 10;
						let left = (index - opt.active) * opt._gutterOffset - itemOffset * stage.F.width / 10;
						obj.style.left = "calc(" + percent + "% + " + left + "px)";
						let opacity = 1 - F.clamp(Math.abs(index - (opt.active + itemOffset)), 0, 1);
						obj.style.opacity = opacity;
					});
					break;

				case "slide-all":
				default:
					items.forEach((obj, index) => {
						let percent = (index - opt.active) * opt._itemWidthPercent;
						let left = (index - opt.active) * opt._gutterOffset - itemOffset * stage.F.width / opt.items;
						obj.style.left = "calc(" + percent + "% + " + left + "px)";
					});
					break;
			}
		}
	});
}

// Gets the active item in a carousel.
function getActiveItem() {
	let carousel = this.first;
	if (!carousel) return;   // Nothing to do
	let opt = F.loadOptions("carousel", carousel);
	if (!opt) return;
	return carousel.children[opt.active];
}

// Sets the active item in a carousel.
//
// item: The new active item element in each selected carousel.
function setActiveItem(item) {
	let carousel = this.first;
	if (!carousel) return;   // Nothing to do
	let opt = F.loadOptions("carousel", carousel);
	if (!opt || opt._isDragging) return;   // Ignore request while dragging
	let items = carousel.F.querySelector("." + carouselClass).children;

	let index = item.F.index;
	index = F.clamp(index, 0, items.length - opt.items);
	opt.active = index;
	opt._layout(0);
	if (opt.indicator) {
		let dots = carousel.F.querySelector("." + carouselIndicatorClass).children;
		dots.classList.remove("active");
		dots.get(Math.ceil(index / opt.dotsEach)).classList.add("active");
	}
	carousel.F.trigger("activeItemChange");
}

// Gets the index of the active item in a carousel.
function getActiveItemIndex() {
	let carousel = this.first;
	if (!carousel) return;   // Nothing to do
	let opt = F.loadOptions("carousel", carousel);
	return opt?.active;
}

// Sets the active item in a carousel by its index.
//
// index: The index of the new active item in each selected carousel.
function setActiveItemIndex(index) {
	return this.forEach(carousel => {
		let opt = F.loadOptions("carousel", carousel);
		if (!opt || opt._isDragging) return;   // Ignore request while dragging
		let items = carousel.F.querySelector("." + carouselClass).children;
		if (index === Infinity)
			index = items.length;   // Infinity can't be handled by Math.min
		else if (index < 0)
			index += items.length;   // Negative count from the end

		index = F.clamp(index, 0, items.length - opt.items);
		opt.active = index;
		opt._layout(0);
		if (opt.indicator) {
			let dots = carousel.F.querySelector("." + carouselIndicatorClass).children;
			dots.classList.remove("active");
			dots.get(Math.ceil(index / opt.dotsEach)).classList.add("active");
		}
		carousel.F.trigger("activeItemChange");
	});
}

F.registerPlugin("carousel", carousel, {
	defaultOptions: carouselDefaults,
	methods: {
		activeItem: {
			get: getActiveItem,
			set: setActiveItem
		},
		activeItemIndex: {
			get: getActiveItemIndex,
			set: setActiveItemIndex
		}
	},
	selectors: [".carousel"]
});
