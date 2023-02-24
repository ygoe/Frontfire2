// ==================== Toggle switch plugin ====================

const toggleSwitchClass = "ff-toggle-switch";
const inputWrapperClass = "ff-input-wrapper";

// Defines default options for the toggle switch plugin.
let toggleSwitchDefaults = {
	// The initial state of the toggle switch.
	state: false
};

// Converts each selected element to a toggle switch.
function toggleSwitch(options) {
	return this.forEach(container => {
		let isHtmlCheckbox = container.matches("input[type=checkbox]");
		if (container.classList.contains(toggleSwitchClass)) return;   // Already created
		if (isHtmlCheckbox && container.parentElement.classList.contains(inputWrapperClass)) return;   // Already done
		let opt = F.initOptions("toggleSwitch", container, {}, options);
		opt._setState = setState;

		let input;
		if (isHtmlCheckbox) {
			input = container;
			if (input.indeterminate)
				opt.state = null;
			else if (input.checked)
				opt.state = true;

			// Put a wrapper between the input and its parent
			let wrapper = F.c("div");
			wrapper.classList.add(inputWrapperClass);
			if (input.getAttribute("style"))
				wrapper.setAttribute("style", input.getAttribute("style"));
			input.F.wrap(wrapper);

			// Hide original input and add a new one, synchronise (and convert) values
			input.F.hide();
			let inputChanging = false;
			container = F.c("span");
			input.after(container);

			// Show or hide the new element instead whenever the <input> element should be shown or hidden
			F.internalData.set(input, "visible.replacement", container);
			// Enable or disable the new element when the <input> element is enabled or disabled
			disabledObservers = input.F.observeDisabled(disabled => {
				container.F.disabled = disabled;
			});
			if (input.F.disabled) {
				container.F.disabled = true;
			}

			// Overwrite the focus method to focus the new visible element
			//let origFocusFunction = input.focus;   // TODO: Use for deinit
			input.focus = () => container.focus();

			container.F.on("change", () => {
				inputChanging = true;
				input.checked = opt.state;
				input.indeterminate = opt.state == null;
				input.F.trigger("change", { bubbles: true });
				inputChanging = false;
			});
			input.F.on("change", () => {
				if (!inputChanging) {
					setState(input.indeterminate ? null : input.checked);
				}
			});

			container.F.forwardUIEvents(input, "blur");
		}

		container.classList.add(toggleSwitchClass);
		setState(opt.state, true);

		container.setAttribute("tabindex", 0);
		container.F.on("blur", () => container.classList.remove("ff-focus-visible"));
		container.F.on("keydown", event => {
			if (container.F.disabled) return;
			if (event.key !== "Control" && event.key !== "Shift" && event.key !== "Alt")
				container.classList.add("ff-focus-visible");
			if (event.key === " " && !event.ctrlKey) {
				event.preventDefault();
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
			if (container.F.disabled) return;
			container.classList.remove("indeterminate");
			const newState = container.classList.toggle("active");
			opt.state = newState;
			container.F.trigger("change", { bubbles: true });
		}

		function setState(newState, force) {
			let changed = newState !== opt.state;
			if (changed || force) {
				opt.state = newState;
				container.classList.toggle("active", newState !== null && !!newState);
				container.classList.toggle("indeterminate", newState === null);
				if (changed)
					container.F.trigger("change", { bubbles: true });
			}
		}

		// TODO: Add drag handler to move the thumb horizontally
	});
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
	},
	selectors: ["input[type=checkbox].toggle-switch"]
});
