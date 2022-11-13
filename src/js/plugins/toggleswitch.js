// ==================== Toggle switch plugin ====================

const toggleSwitchClass = "ff-toggle-switch";

// Defines default options for the toggle switch plugin.
let toggleSwitchDefaults = {
	// The initial state of the toggle switch.
	state: false
};

// Shows a toggle switch on the element.
function toggleSwitch(options) {
	let container = this.first;
	if (!container) return;   // Nothing to do
	if (container.classList.contains(toggleSwitchClass)) return container.F.toggleSwitch;   // Already created
	let opt = F.initOptions("toggleSwitch", container, {}, options);
	opt._setState = setState;

	container.classList.add(toggleSwitchClass);
	setState(opt.state);

	container.setAttribute("tabindex", 0);
	container.F.on("blur", () => container.classList.remove("ff-focus-visible"));
	container.F.on("keydown", event => {
		if (container.F.disabled) return;
		if (event.key !== "Control" && event.key !== "Shift" && event.key !== "Alt")
			container.classList.add("ff-focus-visible");
		if (event.key === " " && !event.ctrlKey) {
			onClick();
		}
	});

	const background = document.createElement("div");
	background.classList.add("background");
	container.appendChild(background);

	const thumb = document.createElement("div");
	thumb.classList.add("thumb");
	container.appendChild(thumb);

	container.F.on("click", () => {
		onClick();
	});

	function onClick() {
		container.classList.remove("indeterminate");
		const newState = container.classList.toggle("active");
		opt.state = newState;
		container.F.trigger("change", { bubbles: true });
	}

	function setState(newState) {
		if (newState !== opt.state) {
			opt.state = newState;
			container.classList.toggle("active", newState !== null && !!newState);
			container.classList.toggle("indeterminate", newState === null);
		}
	}

	// TODO: Add drag handler to move the thumb horizontally

	// Return current plugin instance
	return container.F.toggleSwitch;
}

// Gets the state of the toggle switch.
function getState() {
	let container = this.first;
	if (!container) return this;   // Nothing to do
	let opt = F.loadOptions("toggleSwitch", container);
	return opt?.state;
}

// Sets the state of the toggle switch.
function setState(newState) {
	return this.forEach(container => {
		let opt = F.loadOptions("toggleSwitch", container);
		opt && opt._setState(newState);
	});
}

F.registerPlugin("toggleSwitch", toggleSwitch, {
	defaultOptions: toggleSwitchDefaults,
	methods: {
		state: {
			get: getState,
			set: setState
		}
	}
});
