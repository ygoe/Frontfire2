// ==================== Off-canvas plugin ====================

const offCanvasEventClass = ".ff-off-canvas";
const offCanvasClass = "ff-off-canvas";
const offCanvasOpeningClass = "opening";
const offCanvasClosingClass = "closing";

// Defines default options for the off-canvas plugin.
let offCanvasDefaults = {
	// Indicates whether the user can close the off-canvas panel by clicking anywhere outside of it or pressing the Escape key.
	cancellable: true,

	// The selector for elements that don't close the off-canvas panel when touched.
	noClose: undefined,

	// The side from which the off-canvas opens (left, right).
	edge: "left",

	// Push the page content to the side by this factor when showing the off-canvas panel.
	// 0 doesn't push, 0.5 pushes half-way, 1 pushes the full panel width.
	pushFactor: 1,

	// The push/slide transition time in milliseconds.
	transitionTime: 400,

	// Close the panel when the window size has changed.
	closeOnResize: true,

	// Dims the page background while the panel is open.
	dimBackground: true
};

// Opens an off-canvas with the selected element.
function offCanvas(options) {
	let container = this.first;
	if (!container) return;   // Nothing to do
	let wasClosing = false;
	if (container.classList.contains(offCanvasClass)) {
		if (container.classList.contains(offCanvasClosingClass)) {
			// Now closing, abort that and reopen
			wasClosing = true;
			container.classList.remove(offCanvasClosingClass);
		}
		else {
			return container.F.offCanvas;   // Already open or opening
		}
	}
	let opt;
	if (!wasClosing)
		opt = F.initOptions("offCanvas", container, {}, options);
	else
		opt = F.loadOptions("offCanvas", container);

	container.F.trigger("offcanvasopening");

	container.classList.add(offCanvasClass, offCanvasOpeningClass);
	document.body.append(container);

	if (["left", "right"].indexOf(opt.edge) === -1)
		opt.edge = "left";
	if (opt.edge === "left") opt._opposite = "right";
	else if (opt.edge === "right") opt._opposite = "left";

	let html = F("html");
	let width = container.F.width;

	if (!wasClosing) {
		opt._htmlStyle = {
			overflowX: html.computedStyle.overflowX
		};
	}

	if (opt.closeOnResize) {
		F(window).on("resize" + offCanvasEventClass, () => {
			closeOffCanvas.call(this);
		});
	}

	if (!wasClosing) {
		// Start the animation to the opened state
		opt._anim = container.F.animateFromTo({ [opt.edge]: [-width + "px", "0"] }, opt.transitionTime);
		opt._anim2 = html.animateFromTo({
			["margin-" + opt.edge]: ["0", (width * opt.pushFactor) + "px"],
			["margin-" + opt._opposite]: ["0", (-width * opt.pushFactor) + "px"]
		}, opt.transitionTime);
		html.style.overflowX = "hidden";
	}
	else {
		// Reverse the existing animation
		opt._anim.reverse();
		opt._anim2.reverse();
	}

	opt._anim.finished.then(() => {
		if (container.classList.contains(offCanvasOpeningClass) && !container.classList.contains(offCanvasClosingClass)) {
			container.classList.remove(offCanvasOpeningClass);
			container.F.trigger("offcanvasopen");
		}
	});

	if (opt.dimBackground)
		F.dimBackground(true);

	let firstFocusable = container.F.queryFocusable().first;
	firstFocusable.focus();
	firstFocusable.blur();

	F.preventScrolling();

	// Prevent moving the focus out of the offCanvas
	document.F.on("focusin" + offCanvasEventClass, event => {
		if (!event.target.F.parents.contains(container)) {
			// The focused element's ancestors do not include the offCanvas, so the focus went out
			// of the offCanvas. Bring it back.
			container.F.queryFocusable().first.focus();
			event.preventDefault();
			event.stopImmediatePropagation();
		}
	});

	// Close on pressing the Escape key or clicking outside the offCanvas
	if (opt.cancellable) {
		document.F.on("keydown" + offCanvasEventClass, event => {
			if (event.key === "Escape") {
				event.preventDefault();
				closeOffCanvas.call(this);
			}
		});

		document.F.on("pointerdown" + offCanvasEventClass, event => {
			if (event.button === 0) {
				if (opt.noClose) {
					// Let's see if the event went through an element that matches the no-close selector
					if (F.findEventTarget(event, opt.noClose))
						return;   // Don't close
				}
				closeOffCanvas.call(this);
			}
		});
		container.F.on("pointerdown" + offCanvasEventClass, event => {
			// Don't close the off-canvas when clicking inside of it
			event.stopImmediatePropagation();
		});
	}

	// Return current plugin instance
	return container.F.offCanvas;
}

// Closes the selected off-canvas.
function closeOffCanvas() {
	let container = this.first;
	if (!container) return this;   // Nothing to do
	if (!container.classList.contains(offCanvasClass) || container.classList.contains(offCanvasClosingClass))
		return this;   // offCanvas is not open or already closing
	let opt = F.loadOptions("offCanvas", container);
	if (!opt) return this;   // Plugin not initialized

	if (container.classList.contains(offCanvasOpeningClass)) {
		// Now opening, abort that and close
		container.classList.remove(offCanvasOpeningClass);
	}

	container.F.trigger("offcanvasclosing");

	let html = F("html");

	// Start the transition back to the closed state
	container.classList.add(offCanvasClosingClass);
	opt._anim.reverse();
	opt._anim2.reverse();

	F.preventScrolling(false);
	document.F.off("focusin" + offCanvasEventClass);
	document.F.off("keydown" + offCanvasEventClass);
	document.F.off("pointerdown" + offCanvasEventClass);
	F(window).off("resize" + offCanvasEventClass);
	container.F.off("pointerdown" + offCanvasEventClass);
	if (opt.dimBackground)
		F.undimBackground();
	opt._anim.finished.then(() => {
		if (container.classList.contains(offCanvasClosingClass) && !container.classList.contains(offCanvasOpeningClass)) {
			container.classList.remove(offCanvasClass, offCanvasClosingClass);
			html.style(opt._htmlStyle);
			container.F.trigger("offcanvasclose");
		}
	});
}

// Determines whether the off-canvas is currently open or opening but not closing.
function isOpen() {
	let container = this.first;
	if (!container) return this;   // Nothing to do
	return container.classList.contains(offCanvasClass) && !container.classList.contains(offCanvasClosingClass);
}

F.registerPlugin("offCanvas", offCanvas, {
	defaultOptions: offCanvasDefaults,
	methods: {
		close: closeOffCanvas,
		isOpen: {
			get: isOpen
		}
	}
});
