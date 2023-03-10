// ==================== Resizable plugin ====================

const resizableClass = "ff-resizable";

// Defines default options for the resizable plugin.
let resizableDefaults = {
	// The aspect ratio (x/y) to maintain during resizing, or true to maintain the initial aspect ratio.
	// TODO: Uncomment documentation when implemented
	aspectRatio: undefined,

	// The resizing handles to use. Can be "all" or a combination of "n,ne,e,se,s,sw,w,nw". Default: All.
	handles: undefined,

	// The width of the default handles, in pixels.
	handleWidth: 10,

	// Additional CSS class for the handle elements. Known class: "box".
	handleClass: undefined,

	// Constrains the resizing inside the specified element or the "parent" of the resized element or the "viewport".
	containment: undefined,

	// The grid to snap the resized element to during resizing, as [x, y] in pixels.
	grid: undefined,

	// The minimum width to keep during resizing, in pixels.
	minWidth: undefined,

	// The minimum height to keep during resizing, in pixels.
	minHeight: undefined,

	// The maximum width to keep during resizing, in pixels.
	maxWidth: undefined,

	// The maximum height to keep during resizing, in pixels.
	maxHeight: undefined,

	// Indicates whether the window should scroll to keep the resized edge visible.
	scroll: false
};

// Makes each selected element resizable.
function resizable(options) {
	return this.forEach(elem => {
		if (elem.classList.contains(resizableClass)) return;   // Already done
		elem.classList.add(resizableClass);
		let handleElements = F();
		let opt = F.initOptions("resizable", elem, {}, options);

		let aspectRatio = opt.aspectRatio;
		if (aspectRatio === true || aspectRatio === "true")
			aspectRatio = elem.F.borderWidth / elem.F.borderHeight;
		if (F.isNumber(aspectRatio))
			aspectRatio = parseFloat(aspectRatio);
		if (aspectRatio === 0 || !isFinite(aspectRatio) || !F.isNumber(aspectRatio))
			aspectRatio = undefined;

		if (elem.F.computedStyle.position === "static") {
			opt._wasPositionStatic = true;
			elem.style.position = "relative";
		}

		let optHandles = opt.handles;
		if (optHandles === undefined)
			optHandles = "all";
		if (optHandles === "all")
			optHandles = "n,ne,e,se,s,sw,w,nw";
		if (F.isString(optHandles))
			optHandles = optHandles.replace(/\s/g, "").toLowerCase().split(",");

		let vCursor = "ns-resize";
		let hCursor = "ew-resize";
		let nwCursor = "nwse-resize";
		let neCursor = "nesw-resize";

		if (opt.handleClass === "box") {
			if (optHandles.indexOf("n") !== -1)
				addHandle({ left: "calc(50% - 4px)", top: "-9px" }, vCursor, true, true);   // Top edge
			if (optHandles.indexOf("e") !== -1)
				addHandle({ right: "-9px", top: "calc(50% - 4px)" }, hCursor, false, false);   // Right edge
			if (optHandles.indexOf("s") !== -1)
				addHandle({ left: "calc(50% - 4px)", bottom: "-9px" }, vCursor, true, false);   // Bottom edge
			if (optHandles.indexOf("w") !== -1)
				addHandle({ left: "-9px", top: "calc(50% - 4px)" }, hCursor, false, true);   // Left edge

			if (optHandles.indexOf("ne") !== -1)
				addHandle({ top: "-9px", right: "-9px" }, neCursor, false, false, true, true);   // Top right corner
			if (optHandles.indexOf("se") !== -1)
				addHandle({ bottom: "-9px", right: "-9px" }, nwCursor, false, false, true, false);   // Bottom right corner
			if (optHandles.indexOf("sw") !== -1)
				addHandle({ bottom: "-9px", left: "-9px" }, neCursor, false, true, true, false);   // Bottom left corner
			if (optHandles.indexOf("nw") !== -1)
				addHandle({ top: "-9px", left: "-9px" }, nwCursor, false, true, true, true);   // Top left corner
		}
		else {
			let w = opt.handleWidth;
			if (optHandles.indexOf("n") !== -1)
				addHandle({ left: w / 2 + "px", right: w / 2 + "px", top: -w / 2 + "px", height: w + "px" }, vCursor, true, true);   // Top edge
			if (optHandles.indexOf("e") !== -1)
				addHandle({ top: w / 2 + "px", bottom: w / 2 + "px", right: -w / 2 + "px", width: w + "px" }, hCursor, false, false);   // Right edge
			if (optHandles.indexOf("s") !== -1)
				addHandle({ left: w / 2 + "px", right: w / 2 + "px", bottom: -w / 2 + "px", height: w + "px" }, vCursor, true, false);   // Bottom edge
			if (optHandles.indexOf("w") !== -1)
				addHandle({ top: w / 2 + "px", bottom: w / 2 + "px", left: -w / 2 + "px", width: w + "px" }, hCursor, false, true);   // Left edge

			if (optHandles.indexOf("ne") !== -1)
				addHandle({ right: -w / 2 + "px", top: -w / 2 + "px", width: w + "px", height: w + "px" }, neCursor, false, false, true, true);   // Top right corner
			if (optHandles.indexOf("se") !== -1)
				addHandle({ right: -w / 2 + "px", bottom: -w / 2 + "px", width: w + "px", height: w + "px" }, nwCursor, false, false, true, false);   // Bottom right corner
			if (optHandles.indexOf("sw") !== -1)
				addHandle({ left: -w / 2 + "px", bottom: -w / 2 + "px", width: w + "px", height: w + "px" }, neCursor, false, true, true, false);   // Bottom left corner
			if (optHandles.indexOf("nw") !== -1)
				addHandle({ left: -w / 2 + "px", top: -w / 2 + "px", width: w + "px", height: w + "px" }, nwCursor, false, true, true, true);   // Top left corner
		}

		opt._disabledObserver = elem.F.observeDisabled(disabled => updateHandles());
		updateHandles();

		function updateHandles() {
			handleElements.visible = !elem.F.disabled;
		}

		function addHandle(style, cursor, vertical, negative, vertical2, negative2) {
			let handle = F.c("div");
			handle.F.classList.add("ff-resizable-handle", opt.handleClass);
			handle.F.style = style;
			handle.style.position = "absolute";
			handle.style.cursor = cursor;
			elem.append(handle);
			handleElements.add(handle);
			handle.F.draggable({ scroll: opt.scroll, dragCursor: cursor });
			handle.F.on("draggablestart", event => {
				event.stopPropagation();   // Don't trigger for the resized (parent) element
				let events = elem.F.trigger("resizablestart", { bubbles: true, cancelable: true }, {
					vertical: vertical,
					negative: negative,
					edge: vertical ? (negative ? "top" : "bottom") : (negative ? "left" : "right")
				});
				if (events.first.defaultPrevented) {
					event.preventDefault();
				}
			});
			handle.F.on("draggablemove", event => {
				event.stopPropagation();   // Don't trigger for the resized (parent) element
				event.preventDefault();   // The handles already move with the element, don't touch their position
				resize(handle, event.newPoint, vertical, negative);
				if (vertical2 !== undefined)
					resize(handle, event.newPoint, vertical2, negative2);
			});
			handle.F.on("draggableend", event => {
				event.stopPropagation();   // Don't trigger for the resized (parent) element
				elem.F.trigger("resizableend", { bubbles: true }, {
					vertical: vertical,
					negative: negative,
					edge: vertical ? (negative ? "top" : "bottom") : (negative ? "left" : "right")
				});
			});
			return handle;
		}

		function resize(handle, newPoint, vertical, negative) {
			let side = vertical ? "top" : "left";
			let extent = vertical ? "Height" : "Width";
			let extentLower = extent.toLowerCase();
			let delta = newPoint[side] - handle.F[side];
			if (negative)
				delta = -delta;

			let newElemOffset = { left: elem.F.left, top: elem.F.top };
			let step = opt.grid ? opt.grid[vertical ? 1 : 0] : 1;

			if (opt.grid) {
				let gridBase = {
					left: elem.parentElement.F.left,
					top: elem.parentElement.F.top
				};
				if (negative) {
					delta = newElemOffset[side] - (Math.round(((newElemOffset[side] - delta) - gridBase[side]) / step) * step + gridBase[side]);
				}
				else {
					let length = elem.F["border" + extent];
					delta = Math.round(((newElemOffset[side] + length + delta) - gridBase[side]) / step) * step + gridBase[side] - (newElemOffset[side] + length);
				}
			}

			let newLength = elem.F["border" + extent] + delta;

			let minLength = Math.max(elem.F["border" + extent] - elem.F[extentLower], opt["min" + extent] || 0);
			while (newLength < minLength) {
				delta += step;
				newLength += step;
			}
			let maxLength = opt["max" + extent];
			while (maxLength && newLength > maxLength) {
				delta -= step;
				newLength -= step;
			}

			if (negative)
				newElemOffset[side] -= delta;

			if (opt.containment) {
				let cont, contRect;
				if (opt.containment === "parent") {
					cont = elem.parentElement;
				}
				else if (opt.containment === "viewport") {
					let scrollTop = window.scrollY;
					let scrollLeft = window.scrollX;
					contRect = {
						top: 0 + scrollTop,
						left: 0 + scrollLeft,
						height: window.clientHeight,
						width: window.clientWidth
					};
				}
				else {
					cont = F(opt.containment).first;
				}
				if (cont)
					contRect = cont.F.rect;
				if (contRect) {
					if (negative) {
						while (newElemOffset[side] < contRect[side]) {
							newElemOffset[side] += step;
							delta -= step;
							newLength -= step;
						}
					}
					else {
						while (newElemOffset[side] + newLength > contRect[side] + contRect[extentLower]) {
							delta -= step;
							newLength -= step;
						}
					}
				}
			}

			let events = elem.F.trigger("resizing", { bubbles: true, cancelable: true }, {
				vertical: vertical,
				negative: negative,
				edge: vertical ? (negative ? "top" : "bottom") : (negative ? "left" : "right"),
				newLength: newLength,
				newPosition: newElemOffset[side]
			});
			if (!events.first.defaultPrevented) {
				let minLength = elem.F["border" + extent] - elem.F["content" + extent];
				// The element cannot shrink below its border+padding size
				if (events.first.newLength < minLength) {
					events.first.newPosition -= minLength - events.first.newLength;
					events.first.newLength = minLength;
				}
				elem.F["border" + extent] = events.first.newLength;
				if (negative) {
					newElemOffset[side] = events.first.newPosition;
					elem.F.left = newElemOffset.left;
					elem.F.top = newElemOffset.top;
				}
			}
		}
	});
}

// Deinitializes the plugin.
function deinit() {
	return this.forEach(elem => {
		if (!elem.classList.contains(resizableClass)) return;
		elem.classList.remove(resizableClass);
		let opt = F.loadOptions("resizable", elem);
		if (opt._wasPositionStatic)
			elem.style.position = "static";
		elem.F.querySelectorAll(".ff-resizable-handle").remove();
		opt._disabledObserver.undo();
		F.deleteOptions("resizable", elem);
	});
}

F.registerPlugin("resizable", resizable, {
	defaultOptions: resizableDefaults,
	methods: {
		deinit: deinit
	}
});
