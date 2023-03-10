// ==================== Progressbar plugin ====================

const progressbarClass = "ff-progressbar";

// Defines default options for the progressbar plugin.
let progressbarDefaults = {
	// The minimum value of the progress bar.
	min: 0,

	// The maximum value of the progress bar.
	max: 100,

	// The current progress value.
	value: 0,

	// The string to display before the value in the progress bar.
	valuePrefix: "",

	// The string to display after the value in the progress bar.
	valueSuffix: ""
};

// Shows a progressbar on the element.
function progressbar(options) {
	return this.forEach(elem => {
		if (elem.classList.contains(progressbarClass)) return;   // Already done
		elem.classList.add(progressbarClass);
		let opt = F.initOptions("progressbar", elem, {}, options);
		opt._setValue = setValue;

		let bar = F.c("div");
		bar.classList.add("ff-bar");
		elem.append(bar);
		let number = F.c("span");
		bar.append(number);
		setValue(opt.value);

		// Sets a progress bar value and triggers the change event.
		function setValue(value) {
			value = F.clamp(+value, +opt.min, +opt.max);
			let relWidth = (value - opt.min) / (opt.max - opt.min);
			bar.style.width = (relWidth * 100) + "%";
			number.textContent = (opt.valuePrefix ?? "") + value + (opt.valueSuffix ?? "");
			number.classList.toggle("outside", number.F.width + 8 > relWidth * elem.F.width);

			if (value !== opt.value) {
				opt.value = value;
				elem.F.trigger("change", { bubbles: true }, {
					value: value
				});
			}
		}
	});
}

function update() {
	let progressbar = this.first;
	if (!progressbar) return;   // Nothing to do
	let opt = F.loadOptions("progressbar", progressbar);
	opt && opt._setValue(opt.value);
}

// Gets the minimum value of the first selected node.
function getMin() {
	let progressbar = this.first;
	if (!progressbar) return;   // Nothing to do
	let opt = F.loadOptions("progressbar", progressbar);
	return opt?.min;
}

// Sets the minimum value of all selected nodes.
//
// value: The new progress value.
function setMin(min) {
	return this.forEach(progressbar => {
		let opt = F.loadOptions("progressbar", progressbar);
		if (opt) {
			opt.min = min;
			opt._setValue(opt.value);
		}
	});
}

// Gets the maximum value of the first selected node.
function getMax() {
	let progressbar = this.first;
	if (!progressbar) return;   // Nothing to do
	let opt = F.loadOptions("progressbar", progressbar);
	return opt?.max;
}

// Sets the maximum value of all selected nodes.
//
// value: The new progress value.
function setMax(max) {
	return this.forEach(progressbar => {
		let opt = F.loadOptions("progressbar", progressbar);
		if (opt) {
			opt.max = max;
			opt._setValue(opt.value);
		}
	});
}

// Gets the current progress bar value of the first selected node.
function getValue() {
	let progressbar = this.first;
	if (!progressbar) return;   // Nothing to do
	let opt = F.loadOptions("progressbar", progressbar);
	return opt?.value;
}

// Sets the current progress bar value of all selected nodes.
//
// value: The new progress value.
function setValue(value) {
	return this.forEach(progressbar => {
		let opt = F.loadOptions("progressbar", progressbar);
		opt && opt._setValue(value);
	});
}

// Gets the value prefix of the first selected node.
function getValuePrefix() {
	var progressbar = this.first;
	if (!progressbar) return;   // Nothing to do
	let opt = F.loadOptions("progressbar", progressbar);
	return opt?.valuePrefix;
}

// Sets the value prefix of all selected nodes.
//
// prefix: The new value prefix.
function setValuePrefix(prefix) {
	return this.forEach(progressbar => {
		let opt = F.loadOptions("progressbar", progressbar);
		if (opt) {
			opt.valuePrefix = prefix;
			opt._setValue(opt.value);
		}
	});
}

// Gets the value suffix of the first selected element.
function getValueSuffix() {
	var progressbar = this.first;
	if (!progressbar) return;   // Nothing to do
	let opt = F.loadOptions("progressbar", progressbar);
	return opt?.valueSuffix;
}

// Sets the value suffix of all selected elements.
//
// suffix: The new value suffix.
function setValueSuffix(suffix) {
	return this.forEach(progressbar => {
		let opt = F.loadOptions("progressbar", progressbar);
		if (opt) {
			opt.valueSuffix = suffix;
			opt._setValue(opt.value);
		}
	});
}

// Deinitializes the plugin.
function deinit() {
	return this.forEach(elem => {
		if (!elem.classList.contains(progressbarClass)) return;
		elem.classList.remove(progressbarClass);
		elem.querySelector("div.ff-bar")?.remove();
		F.deleteOptions("progressbar", elem);
	});
}

F.registerPlugin("progressbar", progressbar, {
	defaultOptions: progressbarDefaults,
	methods: {
		update: update,   // undocumented, for internal use, see below (might be changed in the future)
		min: {
			get: getMin,
			set: setMin
		},
		max: {
			get: getMax,
			set: setMax
		},
		value: {
			get: getValue,
			set: setValue
		},
		valuePrefix: {
			get: getValuePrefix,
			set: setValuePrefix
		},
		valueSuffix: {
			get: getValueSuffix,
			set: setValueSuffix
		},
		deinit: deinit
	},
	selectors: [".progressbar"]
});

F(window).on("resize", () => {
	// Update the progress bar display for all initialized elements
	F(".progressbar").progressbar.update();
});
