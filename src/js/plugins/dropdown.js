// ==================== Dropdown plugin ====================

const dropdownContainerClass = "ff-dropdown-container";

// Defines default options for the dropdown plugin.
let dropdownDefaults = {
	// The placement of the dropdown relative to the target element.
	placement: undefined,

	// The placement offset at the top edge of the target element, in pixels.
	offsetTop: 0,

	// The placement offset at the bottom edge of the target element, in pixels.
	offsetBottom: 0,

	// The placement offset at the left edge of the target element, in pixels.
	offsetLeft: 0,

	// The placement offset at the right edge of the target element, in pixels.
	offsetRight: 0,

	// Indicates whether the dropdown is closed when clicking anywhere outside of it.
	autoClose: true,

	// Indicates whether the dropdown is closed when the window is resized.
	closeOnResize: true,

	// Indicates whether the dropdown is closed when the document is hidden.
	closeOnHide: true,

	// The maximum height of the dropdown, in pixels. If the value is 0, there is no limit.
	maxHeight: 0,

	// The minimum width of the dropdown, in pixels.
	minWidth: 0,

	// Indicates whether the dropdown has fixed position instead of absolute.
	fixed: false,

	// Additional CSS classes to add to the dropdown container.
	cssClass: undefined,

	// Additional CSS styles to add to the dropdown container.
	style: undefined
};

// Opens a dropdown with the selected element and places it at the specified target element.
// TODO: Move target parameter into options, allow selector or node
function createDropdown(target, options) {
	let element = this.first;
	if (!element) return;   // Nothing to do

	if (!target) {
		console.error("No dropdown target specified");
		return;   // Nothing to do
	}

	let wasConnected = element.isConnected;
	let oldContainer = element.parentElement;
	if (oldContainer?.classList.contains(dropdownContainerClass)) {
		if (oldContainer.classList.contains("closed")) {
			// Already closed but the transition hasn't completed yet. Bring it to an end right now.
			document.body.append(element);
			oldContainer.remove();
		}
		else {
			return element.F.dropdown;   // Already open
		}
	}

	let opt = F.initOptions("dropdown", element, {}, options);
	opt._wasConnected = wasConnected;

	// Measure these before the dropdown is added to the document and may become internally visible
	let viewportWidth = document.documentElement.clientWidth - 1;
	let viewportHeight = document.documentElement.clientHeight - 1;
	let scrollTop = window.scrollY;
	let scrollLeft = window.scrollX;

	let autoPlacement = false;
	if (!opt.placement) {
		opt.placement = "bottom-left";
		autoPlacement = true;
	}
	else if (opt.placement === "right") {
		opt.placement = "bottom-right";
		autoPlacement = true;
	}
	let optPlacement = opt.placement;

	let targetRect = {
		top: target.F.top + opt.offsetTop,
		bottom: target.F.bottom + opt.offsetBottom,
		left: target.F.left + opt.offsetLeft,
		right: target.F.right + opt.offsetRight
	};
	let isReducedHeight = false;
	let isRightAligned = false;
	let isHorizontallyCentered = false;

	let container = F("<div>").addClass(dropdownContainerClass).appendTo("body").first;
	if (opt.cssClass) {
		container.F.classList.add(opt.cssClass);   // Support space-separated classes
	}
	if (opt.style) {
		container.F.style = opt.style;
	}
	if (opt.fixed) {
		container.style.position = "fixed";
		targetRect.top -= window.scrollY;
		targetRect.bottom -= window.scrollY;
		targetRect.left -= window.scrollX;
		targetRect.right -= window.scrollX;
	}
	if (element.classList.contains("bordered")) {
		container.classList.add("bordered");
	}
	if (document.body.classList.contains("ff-dimmed")) {
		container.classList.add("no-dim");
	}
	container.append(element);

	// Measure the container with its content
	let dropdownWidth = container.F.borderWidth;
	let dropdownHeight = container.F.borderHeight;

	// Limit height if specified, has effect on placement
	if (opt.maxHeight && opt.maxHeight < dropdownHeight) {
		dropdownHeight = opt.maxHeight;
		container.F.borderHeight = dropdownHeight;
		isReducedHeight = true;
		dropdownWidth = container.F.borderWidth;
	}

	let dropdownDesiredWidth = dropdownWidth;
	if (dropdownWidth < opt.minWidth)
		dropdownWidth = opt.minWidth;

	// Place at bottom side, align left, by default
	let top = targetRect.bottom,
		left = targetRect.left,
		direction = "bottom";

	if (optPlacement.startsWith("top")) {
		top = targetRect.top - dropdownHeight;
		direction = "top";
	}
	else if (optPlacement.startsWith("bottom")) {
		top = targetRect.bottom;
		direction = "bottom";
	}
	else if (optPlacement.startsWith("left")) {
		left = targetRect.left - dropdownWidth;
		direction = "left";
		isRightAligned = true;
	}
	else if (optPlacement.startsWith("right")) {
		left = targetRect.right;
		direction = "right";
	}

	if (optPlacement.endsWith("left")) {
		left = targetRect.left;
	}
	else if (optPlacement.endsWith("right")) {
		left = targetRect.right - dropdownWidth;
		isRightAligned = true;
	}
	else if (optPlacement.endsWith("top")) {
		top = targetRect.top;
	}
	else if (optPlacement.endsWith("bottom")) {
		top = targetRect.bottom - dropdownHeight;
	}

	if (optPlacement === "top-center" || optPlacement === "bottom-center") {
		left = (targetRect.left + targetRect.right) / 2 - dropdownWidth / 2;
		isHorizontallyCentered = true;
	}
	else if (optPlacement === "left-center" || optPlacement === "right-center") {
		top = (targetRect.top + targetRect.bottom) / 2 - dropdownHeight / 2;
	}

	if (autoPlacement && left + dropdownWidth > viewportWidth) {
		left = viewportWidth - dropdownWidth;
	}
	if (autoPlacement && top + dropdownHeight > viewportHeight + scrollTop) {
		let topSpace = targetRect.top - scrollTop;
		let bottomSpace = viewportHeight + scrollTop - targetRect.bottom;
		if (topSpace > bottomSpace) {
			top = targetRect.top - dropdownHeight;
			direction = "top";
		}
	}

	let availableHeight;
	if (direction === "top") {
		availableHeight = targetRect.top - scrollTop;
	}
	else if (direction === "bottom") {
		availableHeight = viewportHeight + scrollTop - targetRect.bottom;
	}
	else {
		availableHeight = viewportHeight;
	}
	if (dropdownHeight > availableHeight) {
		dropdownHeight = availableHeight;
		container.F.borderHeight = dropdownHeight;
		isReducedHeight = true;
		if (direction === "top")
			top = targetRect.top - dropdownHeight;
	}

	if (direction === "left" || direction === "right") {
		if (top + dropdownHeight > viewportHeight + scrollTop) {
			top = viewportHeight + scrollTop - dropdownHeight;
		}
		else if (top < scrollTop) {
			top = scrollTop;
		}
	}
	else if (direction === "top" || direction === "bottom") {
		if (left + dropdownWidth > viewportWidth + scrollLeft) {
			left = viewportWidth + scrollLeft - dropdownWidth;
		}
		else if (left < scrollLeft) {
			left = scrollLeft;
		}
	}

	if (isReducedHeight) {
		let scrollbarWidth = container.offsetWidth - container.clientWidth;
		if (scrollbarWidth === 0)
			scrollbarWidth = element.offsetWidth - element.clientWidth;
		if (dropdownDesiredWidth + scrollbarWidth > dropdownWidth) {
			dropdownWidth = dropdownDesiredWidth + scrollbarWidth;
			if (dropdownWidth > viewportWidth) {
				dropdownWidth = viewportWidth;
			}
			if (isRightAligned) {
				left -= scrollbarWidth;
			}
			else if (isHorizontallyCentered) {
				left -= scrollbarWidth / 2;
			}

			if (left + dropdownWidth > viewportWidth + scrollLeft) {
				left = viewportWidth + scrollLeft - dropdownWidth;
			}
			else if (left < scrollLeft) {
				left = scrollLeft;
			}
		}
	}

	// Always set the dropdown container width to consider minWidth or extra width for a scrollbar
	container.F.borderWidth = dropdownWidth;

	// Compensate for offset <body> element (possibly due to child element margins) if the closest
	// "position: relative" parent is not <html>
	if (container.offsetParent?.F.computedStyle.position === "relative") {
		top -= container.offsetParent.F.top;
		left -= container.offsetParent.F.left;
	}

	container.F.top = top;
	container.F.left = left;
	// TODO: Use Animation instead of forceReflow()
	container.classList.add("animate-" + direction);
	F.forceReflow();
	container.classList.add("open");

	// Auto-close the dropdown when clicking outside of it
	if (opt.autoClose === undefined || opt.autoClose) {
		setTimeout(() => {
			// Close on pointerdown instead of click because it's more targeted. A click event is
			// also triggered when the mouse button was pressed inside the dropdown and released
			// outside of it. This is considered "expected behaviour" of the click event.
			// Also listen for the event in the capture phase (>) so that click target event
			// handlers that cancel the event cannot prevent the dropdown from closing.
			document.F.on(">pointerdown.dropdown-close", event => {
				// Don't close the dropdown when clicking inside of it
				if (!F.findEventTarget(event, container))
					tryClose();
			});
		}, 20);
	}

	if (opt.closeOnResize === undefined || opt.closeOnResize) {
		F(window).on("resize.dropdown", tryClose);
	}

	if (opt.closeOnHide === undefined || opt.closeOnHide) {
		document.F.on("visibilitychange.dropdown", () => {
			if (document.hidden)
				tryClose();
		});
	}

	function tryClose() {
		let event = element.F.trigger("closing", { bubbles: true, cancelable: true });
		if (!event.defaultPrevented) {
			closeDropdown.call(element.F);
		}
	}

	// Return current plugin instance
	return element.F.dropdown;
}

// Determines whether the dropdown is currently open.
function isDropdownOpen() {
	let element = this.first;
	if (!element) return this;   // Nothing to do
	let container = element.parentElement;
	return !!container?.classList.contains(dropdownContainerClass);
}

// Closes the selected dropdown.
function closeDropdown() {
	let element = this.first;
	if (!element) return this;   // Nothing to do
	let container = element.parentElement;
	if (!container?.classList.contains(dropdownContainerClass)) return this;   // Dropdown is not open
	let opt = F.loadOptions("dropdown", element);

	if (opt.autoClose === undefined || opt.autoClose) {
		document.F.off(">pointerdown.dropdown-close");
	}
	container.classList.remove("open");
	container.classList.add("closed");
	container.F.on("transitionend", () => {
		if (opt._wasConnected)
			document.body.append(element);
		container.remove();
	});
	F(window).off("resize.dropdown");
	document.F.off("visibilitychange.dropdown");

	element.F.trigger("close", { bubbles: true });
	return this;
}

F.registerPlugin("dropdown", createDropdown, {
	defaultOptions: dropdownDefaults,
	methods: {
		close: closeDropdown,
		isOpen: {
			get: isDropdownOpen
		}
	}
});
