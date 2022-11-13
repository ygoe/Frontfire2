// ==================== Color picker plugin ====================

// TODO: Localisation of labels

const colorPickerClass = "ff-color-picker";

// Defines default options for the color picker plugin.
let colorPickerDefaults = {
	// The initially selected color.
	color: undefined,

	// The type of use for the color (foreground, background).
	colorUse: undefined,

	// Indicates whether the alpha channel is displayed and editable.
	withAlpha: false,

	// Indicates whether the preview panel shows the currently selected color in HTML hex notation.
	previewHex: true
};

// Shows a color picker on the element.
function colorPicker(options) {
	let container = this.first;
	if (!container) return;   // Nothing to do
	if (container.classList.contains(colorPickerClass)) return container.F.colorPicker;   // Already created
	let opt = F.initOptions("colorPicker", container, {}, options);
	opt._setColor = setColor;

	opt.color = new Color(opt.color);

	container.classList.add(colorPickerClass);

	let detailsSliders = {};
	let detailsInputs = {};
	let alphaSlider;
	let previewPanel, previewHex;
	let updatingPreview;
	let foundMatchInTab;
	let quickUpdateCount = 0, quickUpdateTimeout;

	container.classList.add(colorPickerClass);
	container.style.width = "420px";
	container.style.maxWidth = "100%";

	let tabs = F.c("div");
	tabs.classList.add("tabs", "same-height");
	container.append(tabs);

	let dataPaletteTab = F.c("div");
	dataPaletteTab.title = opt.colorUse === "background" ? "Hintergrund" : "Vordergrund";
	tabs.append(dataPaletteTab);
	let colorIds = DataColor.getColorIds();
	let grid = F.c("div");
	grid.F.style = {
		display: "grid",
		gridTemplateColumns: "repeat(" + colorIds.length + ", 1fr)",
		gridTemplateRows: "auto",
		gridGap: "6px"
	};
	dataPaletteTab.append(grid);
	const colorTypes = opt.colorUse === "background" ? ["b0", "b1"] : ["f0", "f1", "f2"];
	colorTypes.forEach(type => {
		colorIds.forEach(colorId => {
			const dataColor = DataColor.getColor(colorId, type, false);
			const swatch = F.c("a");
			swatch.F.style = {
				height: "29px",
				backgroundColor: dataColor,
				outline: "solid 0px " + (Color(dataColor).gray().r < 100 ? "#eee" : "#000"),
				outlineOffset: "-2px"
			};
			swatch.href = "#";
			grid.append(swatch);
			swatch.F.on("click", event => {
				event.preventDefault();
				const a = opt.color.a;
				opt.color = new Color(dataColor);
				if (a) opt.color.a = a;
				updateView();
				if (event.detail === 2) {
					// Double-click: apply color picker
					container.F.trigger("apply", { bubbles: true });
				}
			});
		});
	});

	let genericPaletteTab = F.c("div");
	genericPaletteTab.title = "Allgemein";
	tabs.append(genericPaletteTab);
	// Add grey tones explicitly
	let colors = [0xffffff, 0xf0f0f0, 0xd0d0d0, 0xa0a0a0, 0x707070, 0x404040, 0x000000];
	// Add colors with shades
	[
		0xff0000,   // red
		0xff8000,   // orange
		0xffc000,   // orangeyellow
		0xffe000,   // gold
		0xffff00,   // yellow
		0xc0ff00,   // greenyellow
		0x00ff00,   // green
		0x00ffc0,   // greencyan
		0x00ffff,   // cyan
		0x00c0ff,   // bluecyan
		0x0080ff,   // lightblue
		0x0000ff,   // blue
		0x8000ff,   // purple
		0xc000ff,   // violet
		0xff00ff    // magenta
	].forEach(baseColor => {
		baseColor = Color(baseColor);
		[0.875, 0.75, 0.5].forEach(factor => colors.push(baseColor.blendWith(0xffffff, factor)));
		colors.push(baseColor.toHTML());
		[0.25, 0.5, 0.75].forEach(factor => colors.push(baseColor.blendWith(0x000000, factor)));
	});
	grid = F.c("div");
	grid.F.style = {
		display: "grid",
		gridTemplateColumns: "repeat(16, 1fr)",
		gridTemplateRows: "auto",
		gridGap: "1px",
		height: "100%"
	};
	genericPaletteTab.append(grid);
	const x1 = 7;
	const x2 = colors.length / x1;
	for (let i = 0; i < colors.length; i++) {
		// Transpose columns to rows
		const j = (i - Math.floor(i / x2) * x2) * x1 + Math.floor(i / x2);
		const c = Color(colors[j]);
		c.format = "HTML";
		const swatch = F.c("a");
		swatch.F.style = {
			backgroundColor: String(c),
			outline: "solid 0px " + (c.gray().r < 100 ? "#eee" : "#000"),
			outlineOffset: "-2px"
		};
		swatch.href = "#";
		grid.append(swatch);
		swatch.F.on("click", event => {
			event.preventDefault();
			const a = opt.color.a;
			opt.color = new Color(c);
			if (a) opt.color.a = a;
			updateView();
			// Return to the current tab when the selected color also appears on a previous tab
			tabs.F.tabs.activeTab = genericPaletteTab;
			if (event.detail === 2) {
				// Double-click: apply color picker
				container.F.trigger("apply", { bubbles: true });
			}
		});
	}

	let detailsTab = F.c("div");
	detailsTab.title = "Details";
	tabs.append(detailsTab);
	grid = F.c("div");
	grid.F.style = {
		display: "grid",
		gridTemplateColumns: "auto 1fr 3em",
		gridTemplateRows: "auto"
	};
	detailsTab.append(grid);
	const makeSlider = (label, colorProp, max) => {
		const marginTop = colorProp === "h" ? "10px" : "0";
		const factor = colorProp === "s" || colorProp === "l" ? 100 : 1;
		let labelElement = F.c("div");
		labelElement.style.marginTop = marginTop;
		labelElement.style.paddingTop = "2px";
		labelElement.style.marginRight = "6px";
		labelElement.textContent = label;
		grid.append(labelElement);
		let updatingSlider = false;
		let updatingInput = false;
		let slider = detailsSliders[colorProp] = F.c("div");
		slider.style.marginTop = marginTop;
		grid.append(slider);
		slider.F.slider({
			min: 0,
			max: max,
			largeStep: max > 1 ? 10 : 0.1,
			smallStep: max > 1 ? 1 : 0.01,
			largeTicks: false,
			largeTickLabels: false
		})
		slider.F.on("change", event => {
			if (!updatingInput)
				detailsInputs[colorProp].value = Math.round(event.value * factor);

			if (updatingSlider) return;   // Already updating this slider
			updatingSlider = true;
			opt.color[colorProp] = event.value;
			let isHSL = ["h", "s", "l"].includes(colorProp);
			updateView(undefined, isHSL, !isHSL);
			updatingSlider = false;
		});
		const onInputEvent = () => {
			if (updatingInput) return;   // Already updating this input
			let value = +detailsInputs[colorProp].value;
			if (isNaN(value)) return;   // Ignore this input event
			updatingInput = true;
			slider.F.slider.value = value / factor;
			updatingInput = false;
		};
		let input = detailsInputs[colorProp] = F.c("input");
		input.type = "text";
		input.classList.add("no-border");
		input.style.marginTop = marginTop;
		input.style.marginLeft = "6px";
		input.value = "0";
		grid.append(input);
		input.F.on("input", event => onInputEvent());
		input.F.on("keydown", event => {
			if (event.key === "ArrowUp") {
				event.preventDefault();
				let value = +input.value;
				if (!isNaN(value) && value < max * factor) {
					input.value = value + 1;
					onInputEvent();
				}
			}
			if (event.key === "ArrowDown") {
				event.preventDefault();
				let value = +input.value;
				if (!isNaN(value) && value > 0) {
					input.value = value - 1;
					onInputEvent();
				}
			}
		});
		input.F.on("blur", event => {
			// Read clean value from slider
			let sliderValue = slider.F.slider.value;
			input.value = Math.round(sliderValue * factor);
		});
	};
	makeSlider("Rot", "r", 255);
	makeSlider("Grün", "g", 255);
	makeSlider("Blau", "b", 255);
	makeSlider("Farbton", "h", 359);
	makeSlider("Sättigung", "s", 1);
	makeSlider("Helligkeit", "l", 1);

	// Future tab: tools like blending or secondary colour selection

	tabs.F.tabs();

	if (opt.withAlpha) {
		let labelElement = F.c("div");
		labelElement.style.marginTop = "10px";
		labelElement.textContent = "Deckkraft";
		container.append(labelElement);
		alphaSlider = F.c("div");
		alphaSlider.style.marginTop = "20px";
		container.append(alphaSlider);
		alphaSlider.F.slider({
			min: 0,
			max: 100,
			largeStep: 10,
			smallStep: 1
		});
		alphaSlider.F.on("change", event => {
			opt.color.a = event.value / 100;
			updateView(undefined, undefined, true);
		});
	}
	else {
		opt.color.a = 1;
	}

	let previewLabel = F.c("div");
	previewLabel.style.marginTop = "10px";
	previewLabel.textContent = "Vorschau";
	container.append(previewLabel);
	previewPanel = F.c("div");
	previewPanel.F.style = {
		marginTop: "4px",
		height: "60px",
		border: "solid 1px var(--textbox-border)",
		padding: "2px 6px",
		transition: "background-color var(--animation-duration) var(--animation-function)"
	};
	container.append(previewPanel);
	if (opt.previewHex) {
		previewHex = F.c("input");
		previewHex.type = "text";
		previewHex.classList.add("no-border", "transparent");
		previewHex.style.width = "100%";
		previewHex.value = String(opt.color);
		previewPanel.append(previewHex);
		previewHex.F.on("input", event => {
			const val = previewHex.value;
			if (val.trim().match(/^#[0-9A-Za-z]{6}$/)) {
				const c = new Color(val);
				opt.color = c;
				updateView(false, undefined, true);
			}
		});
	}

	updateView();

	function updateView(withText, fromSlidersHSL, changed) {
		if (updatingPreview) return;   // Already in here
		updatingPreview = true;

		if (fromSlidersHSL === true)
			opt.color.updateRGB();
		else
			opt.color.updateHSL();

		if (opt.withAlpha) {
			alphaSlider.F.slider.value = opt.color.a * 100;
			alphaSlider.querySelector(".ff-range").style.background = "transparent";
			alphaSlider.querySelector(".ff-background").style.background = "linear-gradient(to right, transparent, " + opt.color.alpha(1).toHTML() + "), url(data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAoAAAAKAQMAAAC3/F3+AAAABlBMVEXQ0NDw8PAEPQNRAAAAEElEQVR4XmNgP4CCfjAgIwB8gwi88/AFZQAAAABJRU5ErkJggg) left center";
			// The image is a transparent background chessboard pattern that lies behind the gradually transparent color
		}
		previewPanel.style.backgroundColor = opt.color.toCSS();
		if (opt.previewHex) {
			previewHex.style.color = opt.color.text().toHTML();   // TODO: consider alpha and parent background
			if (withText !== false)
				previewHex.value = opt.color.toHTML().toUpperCase();
		}

		// Indicate currently selected swatches in tab 1 and 2
		foundMatchInTab = -1;
		let opaqueColor = Color(opt.color);
		opaqueColor.a = 1;
		tabs.querySelectorAll("a").forEach(a => {
			let match = opt.color.a > 0 && a.style.backgroundColor === opaqueColor.toCSS();
			a.style.outlineWidth = match ? "2px" : "0";
			if (foundMatchInTab === -1 && match) {
				if (dataPaletteTab.contains(a))
					foundMatchInTab = 0;
				else if (genericPaletteTab.contains(a))
					foundMatchInTab = 1;
			}
		});

		const updateSliderColor = (colorProp, max) => {
			let slider = detailsSliders[colorProp];
			let isHSL = ["h", "s", "l"].includes(colorProp);

			slider.querySelector(".ff-range").style.background = "transparent";
			let colorLeft = new Color(opt.color);
			colorLeft[colorProp] = 0;
			if (isHSL)
				colorLeft.updateRGB();
			let colorRight = new Color(opt.color);
			colorRight[colorProp] = max;
			if (isHSL)
				colorRight.updateRGB();
			let background = "linear-gradient(to right, " + colorLeft.toHTML();
			if (isHSL) {
				// First (0) and last (12) gradient stop already exist, add those in between
				for (let x = 1; x <= 11; x++) {
					let colorMid = new Color(opt.color);
					colorMid[colorProp] = x / 12 * max;
					colorMid.updateRGB();
					background += ", " + colorMid.toHTML();
				}
			}
			background += ", " + colorRight.toHTML() + ")";
			slider.querySelector(".ff-background").style.background = background;
		};
		updateSliderColor("r", 255);
		updateSliderColor("g", 255);
		updateSliderColor("b", 255);
		updateSliderColor("h", 359);
		updateSliderColor("s", 1);
		updateSliderColor("l", 1);

		changed |=
			opt.color.r !== detailsSliders.r.F.slider.value ||
			opt.color.g !== detailsSliders.g.F.slider.value ||
			opt.color.b !== detailsSliders.b.F.slider.value ||
			opt.color.a !== alphaSlider.F.slider.value / 100;
		if (fromSlidersHSL !== true) {
			detailsSliders.h.F.slider.value = opt.color.h;
			detailsSliders.s.F.slider.value = opt.color.s;
			detailsSliders.l.F.slider.value = opt.color.l;
		}
		if (fromSlidersHSL !== false) {
			detailsSliders.r.F.slider.value = opt.color.r;
			detailsSliders.g.F.slider.value = opt.color.g;
			detailsSliders.b.F.slider.value = opt.color.b;
		}

		// Disable preview color transition during quick updates because it'll cause flicker
		if (quickUpdateTimeout)
			clearTimeout(quickUpdateTimeout);
		quickUpdateTimeout = setTimeout(() => {
			quickUpdateCount = 0;
			previewPanel.style.transition = "background-color var(--animation-duration) var(--animation-function)";
		}, 50);
		quickUpdateCount++;
		if (quickUpdateCount > 1)
			previewPanel.style.transition = "background-color 0s";

		updatingPreview = false;

		// Select the tab that contains the selected color, otherwise the details tab
		if (foundMatchInTab !== -1 && tabs.F.tabs.activeTabIndex < detailsTab.F.index)
			tabs.F.tabs.activeTabIndex = foundMatchInTab;
		else
			tabs.F.tabs.activeTab = detailsTab;

		if (changed)
			container.F.trigger("change", { bubbles: true });
	}

	function setColor(newColor) {
		opt.color = new Color(newColor);
		updateView();
	}

	// Return current plugin instance
	return container.F.colorPicker;
}

// Gets the selected color of the color picker.
function getColor() {
	let container = this.first;
	if (!container) return this;   // Nothing to do
	let opt = F.loadOptions("colorPicker", container);
	return String(opt?.color);
}

// Sets the selected color of the color picker.
function setColor(newColor) {
	return this.forEach(container => {
		let opt = F.loadOptions("colorPicker", container);
		opt && opt._setColor(newColor);
	});
}

F.registerPlugin("colorPicker", colorPicker, {
	defaultOptions: colorPickerDefaults,
	methods: {
		color: {
			get: getColor,
			set: setColor
		}
	}
});
