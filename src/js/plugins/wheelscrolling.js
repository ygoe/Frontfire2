// ==================== Wheel-scrolling plugin ====================

const wheelScrollingEventClass = ".wheel-scrolling";

// Defines default options for the wheel-scrolling plugin.
let wheelScrollingDefaults = {
	// The scroll offset of a single wheel delta event.
	// Values between 0 (exclusive) and 1 (inclusive) are treated as the ratio of the element's
	// visible height. Values greater than 1 are absolute pixel offsets.
	step: 0.1,

	// The duration of a single scroll event animation, in milliseconds.
	duration: 150,

	// Specifies whether wheel scrolling is disabled completely.
	disabled: false
}

// Enables custom mouse wheel scrolling on each selected element.
function wheelScrolling(options) {
	return this.forEach(element => {
		if (element.F.hasEventListeners("wheel" + wheelScrollingEventClass)) return;   // Already done

		let opt = F.initOptions("wheelScrolling", element, {}, options);

		let step = opt.step;
		if (typeof step !== "number" || isNaN(step) || step <= 0)
			step = wheelScrollingDefaults.step;
		let duration = opt.duration;
		if (typeof duration !== "number" || isNaN(duration) || duration < 0)
			duration = wheelScrollingDefaults.duration;

		let scrollTarget, scrollTargetTimeout, scrollAnimation;
		element.F.on("wheel" + wheelScrollingEventClass, event => {
			event.preventDefault();
			if (opt.disabled) return;

			if (scrollTarget === undefined)
				scrollTarget = element.scrollTop;
			let newScroll = scrollTarget;
			let offset;
			if (step <= 1)
				offset = Math.sign(event.deltaY) * step * element.clientHeight;
			else
				offset = Math.sign(event.deltaY) * step;
			newScroll += offset;
			if (newScroll < 0)
				newScroll = 0;
			if (newScroll > element.scrollHeight - element.clientHeight)
				newScroll = element.scrollHeight - element.clientHeight;
			if (newScroll != scrollTarget) {
				scrollTarget = newScroll;
				scrollAnimation && scrollAnimation.cancel();
				scrollAnimation = animate(element.scrollTop, scrollTarget, v => element.scrollTop = v, duration);
			}
			clearTimeout(scrollTargetTimeout);
			scrollTargetTimeout = setTimeout(() => scrollTarget = undefined, duration);
		});
	});
}

// Deinitializes the plugin.
function deinit() {
	return this.forEach(elem => {
		if (!elem.F.hasEventListeners("wheel" + wheelScrollingEventClass)) return;
		elem.off(wheelScrollingEventClass);
		F.deleteOptions("wheelScrolling", elem);
	});
}

F.registerPlugin("wheelScrolling", wheelScrolling, {
	defaultOptions: wheelScrollingDefaults,
	methods: {
		deinit: deinit
	}
});


// ==================== Private functions ====================

function animate(startValue, endValue, setter, duration) {
	if (typeof duration !== "number" || isNaN(duration))
		duration = 200;

	if (document.hidden) {
		setter(endValue);
		return;
	}

	const animationDelay = 10;   // 100 fps
	const animationCount = Math.round(duration / animationDelay);
	let animationPosition = 0;
	let timeout;
	animationStep();

	return {
		// Cancels the running animation.
		cancel: () => {
			clearTimeout(timeout);
		}
	};

	function animationStep() {
		if (++animationPosition <= animationCount) {
			const r = Math.sin(animationPosition / animationCount * Math.PI / 2);
			setter(startValue + (endValue - startValue) * r);
			timeout = setTimeout(animationStep, animationDelay);
		}
	}
}
