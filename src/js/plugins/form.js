// Form module

// ==================== Keyboard focus style ====================

// Use focus-visible style for text fields only when focusing the element by keyboard
const focusVisibleEventClass = ".ff-focus-visible";
const textFieldsSelector = "input:is(:not([type]), [type^=date], [type=email], [type=month], [type=number], [type=password], [type=search], [type=tel], [type=text], [type=time], [type=url], [type=week]), textarea";
let tabKeyResetTimeout;
let tabKeyPressed = false;
F(document.documentElement)
	.on("keydown" + focusVisibleEventClass, event => {
		if (event.key === "Tab" && !event.altKey && !event.ctrlKey) {
			tabKeyPressed = true;
			tabKeyResetTimeout && clearTimeout(tabKeyResetTimeout);
			tabKeyResetTimeout = setTimeout(() => tabKeyPressed = false, 50);
		}
	})
	.on("keyup" + focusVisibleEventClass, event => {
		if (event.key === "Tab") {
			tabKeyPressed = false;
			tabKeyResetTimeout && clearTimeout(tabKeyResetTimeout);
			tabKeyResetTimeout = undefined;
		}
	})
	.on("focusin" + focusVisibleEventClass, event => {
		let textbox = F.findEventTarget(event, textFieldsSelector);
		if (textbox && !textbox.classList.contains("no-frontfire") && !textbox.closest(".no-frontfire")) {
			if (tabKeyPressed)
				textbox.classList.add("ff-focus-visible");
		}
	})
	.on("focusout" + focusVisibleEventClass, event => {
		let textbox = F.findEventTarget(event, textFieldsSelector);
		if (textbox && !textbox.classList.contains("no-frontfire") && !textbox.closest(".no-frontfire")) {
			textbox.classList.remove("ff-focus-visible");
		}
	});


// ==================== Repeat button plugin ====================

const repeatButtonClass = "ff-repeat-button";

// Defines default options for the repeatButton plugin.
let repeatButtonDefaults = {
	// Indicates whether the button is focused when clicked.
	focus: true
};

// Makes each selected button trigger repeated click events while being pressed.
// The buttons will not trigger a click event anymore but instead repeatclick events.
function repeatButton(options) {
	return this.forEach(button => {
		if (button.classList.contains(repeatButtonClass)) return;   // Already done
		button.classList.add(repeatButtonClass);
		let opt = F.initOptions("repeatButton", button, {}, options);

		let timeout, ms;
		button.F.on("pointerdown", event => {
			if (!opt.focus)
				event.preventDefault();
			pressed();
		});
		button.F.on("pointerup pointerleave pointercancel", () => {
			released();
		});
		button.F.on("click", event => {
			event.preventDefault();
		});
		button.F.on("keydown", event => {
			if (event.key === " " && !event.ctrlKey && !event.repeat) {
				event.preventDefault();
				pressed();
			}
			else if (event.key === "Enter" && !event.ctrlKey && !event.shiftKey) {
				event.preventDefault();
				button.F.trigger("repeatclick");
			}
		});
		button.F.on("keyup", event => {
			if (event.key === " " && !event.ctrlKey) {
				event.preventDefault();
				released();
			}
		});

		function pressed() {
			button.classList.add("ff-active");   // CSS :active doesn't trigger, do it manually with an alternate class
			ms = 500;
			click();
		}

		function released() {
			button.classList.remove("ff-active");
			if (timeout) {
				clearTimeout(timeout);
				timeout = undefined;
			}
			ms = undefined;
		}

		// Triggers the button's click event and repeats the timeout
		function click() {
			button.F.trigger("repeatclick");
			timeout = setTimeout(click, ms);
			ms = 50 + Math.round((ms - 50) * 0.8);
		}
	});
}

F.registerPlugin("repeatButton", repeatButton, {
	defaultOptions: repeatButtonDefaults,
	selectors: [
		"input[type=button].repeat-button",
		"button.repeat-button"
	]
});


// ==================== Numeric spinner plugin ====================

const inputWrapperClass = "ff-input-wrapper";

// Defines default options for the spinner plugin.
let spinnerDefaults = {
	// Indicates whether the increment/decrement button are added to the input element.
	buttons: true
};

// Adds buttons to each selected input[type=number] element to decrement or increment the value.
function spinner(options) {
	return this.forEach(input => {
		if (input.parentElement?.classList.contains(inputWrapperClass)) return;   // Already done
		let opt = F.initOptions("spinner", input, {}, options);

		// Put a wrapper between the input and its parent
		let wrapper = F.c("div");
		wrapper.classList.add(inputWrapperClass);
		let styleAttr = input.getAttribute("style");
		if (styleAttr)
			wrapper.setAttribute("style", styleAttr);
		input.before(wrapper);
		wrapper.append(input);
		input.setAttribute("autocomplete", "off");
		// TODO: Change dataset.stepFactor to a plugin option?
		if (input.dataset.stepFactor !== undefined) {
			// The default step is 1 and the usual min value for exponential steps is not an integer,
			// so only integer increments of the min value would be valid for the browser. Tell it
			// to stop caring about that.
			input.setAttribute("step", "any");
		}

		// Add control buttons
		if (opt.buttons) {
			let buttons = F.c("span");
			buttons.classList.add("group");
			wrapper.append(buttons);

			let updateButtons;

			let decButton = F.c("button");
			decButton.type = "button";
			decButton.classList.add("ff-spinner-dec");
			buttons.append(decButton);
			decButton.setAttribute("tabindex", "-1");
			decButton.disabled = input.disabled;
			//decButton.textContent = "\u2212";   // &minus;
			decButton.innerHTML = `<svg style="width: 9px; height: 9px;"><path d="M0,4.5L9,4.5"/></svg>`;
			decButton.F.on("repeatclick", () => {
				if (input.disabled) return;
				let value = parseFloat(input.value);
				let min = getFieldInfoNumber(input, "min");
				let max = getFieldInfoNumber(input, "max");
				if (isNaN(value)) {
					// Empty field, start with the maximum value
					if (max !== null)
						value = max;
					else
						value = 0;
				}
				else {
					let step = getFieldInfoNumber(input, "step");
					let factor = input.dataset.stepFactor;
					if (factor !== undefined) {
						// Decrement by factor
						if ((min === null || value / factor >= min) && (max === null || value / factor <= max))
							value /= factor;
					}
					else {
						// Decrement by step
						if (max !== null && safeCompare(value, max) > 0) value = max + 1;
						if (!step) step = 1;
						let stepBase = min !== null ? min : 0;
						value = (safeCeil((value - stepBase) / step) - 1) * step + stepBase;   // Set to next-smaller valid step
						if (min !== null && safeCompare(value, min) < 0) value = min;
						while (max !== null && safeCompare(value, max) > 0) value -= step;
					}
				}
				let valueStr = value.toFixed(getSafeDigits(value)).replace(/0+$/, "").replace(/[.,]$/, "");   // Correct floating-point number
				input.value = valueStr;
				input.F.trigger("input change");
				updateButtons();
			});
			decButton.F.repeatButton({ focus: false });
			let incButton = F.c("button");
			incButton.type = "button";
			incButton.classList.add("ff-spinner-inc");
			buttons.append(incButton);
			incButton.setAttribute("tabindex", "-1");
			incButton.disabled = input.disabled;
			//incButton.textContent = "+";
			incButton.innerHTML = `<svg style="width: 9px; height: 9px;"><path d="M0,4.5L9,4.5"/><path d="M4.5,0L4.5,9"/></svg>`;
			incButton.F.on("repeatclick", () => {
				if (input.disabled) return;
				let value = parseFloat(input.value);
				let min = getFieldInfoNumber(input, "min");
				let max = getFieldInfoNumber(input, "max");
				if (isNaN(value)) {
					// Empty field, start with the minimum value
					if (min !== null)
						value = min;
					else
						value = 0;
				}
				else {
					let step = getFieldInfoNumber(input, "step");
					let factor = input.dataset.stepFactor;
					if (factor !== undefined) {
						// Increment by factor
						if ((min === null || safeCompare(value * factor, min) >= 0) && (max === null || safeCompare(value * factor, max) <= 0))
							value *= factor;
					}
					else {
						// Increment by step
						if (max !== null && safeCompare(value, max) > 0) value = max + 1;
						if (!step) step = 1;
						let stepBase = min !== null ? min : 0;
						value = (safeFloor((value - stepBase) / step) + 1) * step + stepBase;   // Set to next-greater valid step
						if (min !== null && safeCompare(value, min) < 0) value = min;
						while (max !== null && safeCompare(value, max) > 0) value -= step;
					}
				}
				let valueStr = value.toFixed(getSafeDigits(value)).replace(/0+$/, "").replace(/[.,]$/, "");   // Correct floating-point number
				input.value = valueStr;
				input.F.trigger("input change");
				updateButtons();
			});
			incButton.F.repeatButton({ focus: false });

			updateButtons = () => {
				let value = parseFloat(input.value);
				if (isNaN(value)) {
					// Empty input can start in both directions, will be filled automatically
					decButton.disabled = false;
					incButton.disabled = false;
				}
				else {
					let min = getFieldInfoNumber(input, "min");
					let max = getFieldInfoNumber(input, "max");

					decButton.disabled = min !== null && safeCompare(value, min) <= 0;
					incButton.disabled = max !== null && safeCompare(value, max) >= 0;
				}

				decButton.disabled |= input.disabled;
				incButton.disabled |= input.disabled;
			};
			updateButtons();

			// Enable or disable the buttons when the input is enabled or disabled
			input.F.observeDisabled(disabled => updateButtons());

			let inputAttrObserver = new MutationObserver((mutationsList, observer) => {
				mutationsList.forEach(mutation => updateButtons());
			});
			inputAttrObserver.observe(input, { attributes: true, attributeFilter: ["min", "max"] });
			// The value property cannot be observed, require the change event
			input.F.on("change", () => updateButtons());
			input.F.on("keydown", event => {
				if (event.key === "ArrowUp") {
					event.preventDefault();
					incButton.F.trigger("repeatclick");
				}
				else if (event.key === "ArrowDown") {
					event.preventDefault();
					decButton.F.trigger("repeatclick");
				}
			});
		}
		else {
			// Disable the arrow value stepping if there are no buttons
			input.F.on("keydown", event => {
				if (event.key === "ArrowUp" || event.key === "ArrowDown") {
					event.preventDefault();
				}
			});
		}

		// Show or hide the wrapper instead whenever the input should be shown or hidden
		F.internalData.set(input, "visible.replacement", wrapper);
	});
}

F.registerPlugin("spinner", spinner, {
	defaultOptions: spinnerDefaults,
	selectors: ["input[type=number]"]
});


// ==================== Toggle button plugin ====================

// Converts each selected checkbox input into a toggle button.
function toggleButton() {
	return this.forEach(input => {
		if (!input.matches("input[type=checkbox]")) return;   // Wrong element
		let content;
		let isActive = input.checked;
		if (input.parentElement.matches("label")) {
			let label = input.parentElement;
			label.before(input);
			content = label.innerHTML;
			label.remove();
		}
		else if (input.id) {
			let label = F('label[for="' + input.id + '"]');
			if (label.length > 0) {
				content = label.innerHTML;
				label.remove();
			}
		}

		let button = F.c("button");
		button.type = "button";
		button.title = input.title;
		let styleAttr = input.getAttribute("style");
		if (styleAttr)
			button.setAttribute("style", styleAttr);
		button.classList.add("ff-toggle-button");
		button.disabled = input.disabled;
		button.innerHTML = content;
		input.after(button);
		input.F.hide();
		// Copy some CSS classes to the button
		["narrow", "icon-only", "icon-right", "transparent", "dark", "not-dark"].forEach(clsName => {
			if (input.classList.contains(clsName))
				button.classList.add(clsName);
		});

		// Set initial state
		if (isActive)
			button.classList.add("ff-tb-active");

		// Handle user toggle and checkbox checked change events
		button.F.on("click", () => {
			button.classList.toggle("ff-tb-active");
			input.checked = button.classList.contains("ff-tb-active");
			input.F.trigger("change", { bubbles: true });
		});
		input.F.on("change", () => {
			button.classList.toggle("ff-tb-active", input.checked);
		});

		// Show or hide the button instead whenever the input should be shown or hidden
		F.internalData.set(input, "visible.replacement", button);
		// Enable or disable the button when the input is enabled or disabled
		input.F.observeDisabled(disabled => button.disabled = disabled);

		button.F.forwardUIEvents(input);
	});
}

F.registerPlugin("toggleButton", toggleButton, {
	selectors: ["input[type=checkbox].toggle-button"]
});


// ==================== Style checkbox plugin ====================

const styleCheckboxClass = "ff-checkbox";

// Applies the enhanced style on the selected checkbox and radio input elements.
function styleCheckbox() {
	return this.forEach(input => {
		if (input.classList.contains(styleCheckboxClass)) return;   // Already done
		if (!input.matches("input[type=checkbox], input[type=radio]")) return;   // Wrong element
		if (input.classList.contains("toggle-button")) return;   // Hidden and replaced by a button

		if (!input.closest("label")) {
			// Styled input needs a label around it to remain clickable
			input.F.wrap('<label class="empty">');
		}
		input.classList.add(styleCheckboxClass);
		let span = F.c("span");
		span.classList.add(styleCheckboxClass);
		input.after(span);
	});
}

F.registerPlugin("styleCheckbox", styleCheckbox, {
	selectors: [
		"input[type=checkbox]:not(.toggle-switch):not(.toggle-button)",
		"input[type=radio]"
	]
});


// ==================== 3-state checkbox plugin ====================

const treeStateClass = "ff-threestate";

// Defines default options for the threeState plugin.
let threeStateDefaults = {
	// Indicates whether the checkbox is initially in the indeterminate state.
	indeterminate: false
};

// Makes each selected checkbox cycle through indeterminate (third) state on clicking.
function threeState(options) {
	return this.forEach(input => {
		if (input.classList.contains(treeStateClass)) {
			// Already done, but let's update the readOnly state for an externally set indeterminate state
			input.readOnly = input.indeterminate;
			return;
		}
		if (!input.matches("input[type=checkbox]")) return;   // Wrong element
		input.classList.add(treeStateClass);

		let opt = F.initOptions("threeState", input, {}, options);

		if (opt.indeterminate) {
			input.checked = false;
			input.readOnly = input.indeterminate = true;
		}

		// Based on: https://css-tricks.com/indeterminate-checkboxes/
		input.F.on("click", () => {
			// indeterminate is unset when the user clicks to change the checked state.
			// readonly (ineffective for checkboxes) is used to backup the previous indeterminate state.
			// In this event, checked is already updated to the new desired state.
			if (input.checked && !input.readOnly) {
				// Was unchecked and not readonly (indeterminate) -> uncheck and make indeterminate
				input.checked = false;
				input.readOnly = input.indeterminate = true;
			}
			else if (input.readOnly) {
				// Was readonly (indeterminate) -> check and forget indeterminate state (unset readonly)
				input.checked = true;   // Firefox and Chrome are already checked here, Edge is not
				input.readOnly = false;
			}
		});
	});
}

F.registerPlugin("threeState", threeState, {
	defaultOptions: threeStateDefaults,
	selectors: ["input[type=checkbox].three-state"]
});


// ==================== Text field auto-select plugin ====================

// Selects the content of an input field when it is focused or clicked.
function autoSelect() {
	// Select all content when focusing in or clicking again on focused element
	this.on("focus pointerup", event => {
		let input = event.currentTarget;
		// Timeout is required for reliable selection when clicking
		setTimeout(() => input.setSelectionRange(0, input.value.length), 0);
	});
	// Clear selection before focusing again to avoid flashing selection on next focus
	this.on("blur", event => {
		event.currentTarget.setSelectionRange(0, 0);
	});
	return this;
}

F.registerPlugin("autoSelect", autoSelect, {
	selectors: [
		"input:not([type]).auto-select",
		"input[type=email].auto-select",
		"input[type=password].auto-select",
		"input[type=search].auto-select",
		"input[type=tel].auto-select",
		"input[type=text].auto-select",
		"input[type=url].auto-select",
		"textarea.auto-select"
	]
});


// ==================== Textarea auto-height plugin ====================

const textareaWrapperClass = "ff-textarea-wrapper";

// Defines default options for the autoHeight plugin.
let autoHeightDefaults = {
	// The minimum number of rows to show for an empty input.
	minRows: 3,

	// The maximum number of rows to show for very long content. If the value is unset, there is no
	// limit.
	maxRows: undefined,

	// The number of empty rows to show after the input content.
	extraRows: 0
};

// Makes each selected textarea element automatically adjust its height to its content.
function autoHeight(options) {
	return this.forEach(textarea => {
		if (textarea.parentElement.classList.contains(textareaWrapperClass)) return;   // Already done

		let opt = F.initOptions("autoHeight", textarea, {}, options);

		// Put a wrapper between the textarea and its parent, and host a new shadow element in
		// the wrapper as well. The textarea is set to fill the container, and the shadow
		// element provides the size for the wrapper.
		let wrapper = F.c("div");
		wrapper.classList.add(textareaWrapperClass);
		let styleAttr = textarea.getAttribute("style");
		if (styleAttr)
			wrapper.setAttribute("style", styleAttr);
		textarea.before(wrapper);
		wrapper.append(textarea);
		let shadowContent = F.c("div");
		wrapper.append(shadowContent);
		// Remove some styles that could interfer with the textarea's new position in the wrapper
		textarea.F.style = {
			width: "",
			minWidth: "",
			maxWidth: "",
			height: "",
			minHeight: "",
			maxHeight: ""
		};

		let computedStyle = getComputedStyle(textarea, null);
		let addHeight = parseFloat(computedStyle.paddingTop) + parseFloat(computedStyle.paddingBottom) +
			parseFloat(computedStyle.borderTopWidth) + parseFloat(computedStyle.borderBottomWidth);
		let lineHeight = parseFloat(computedStyle.lineHeight);
		if (lineHeight) {
			shadowContent.style.minHeight = ((opt.minRows || 3) * lineHeight + addHeight) + "px";
			if (opt.maxRows) {
				shadowContent.style.maxHeight = (opt.maxRows * lineHeight + addHeight) + "px";
			}
		}

		textarea.F.on("input!.autoheight", () => {
			// Copy textarea contents; browser will calculate correct height of shadow copy,
			// which will make overall wrapper taller, which will make textarea taller.
			// Also make sure the last line break is visible.
			// Add an extra line break to convince the browser that the textarea doesn't need a scrollbar.
			shadowContent.textContent = textarea.value.replace(/\n$/, "\n.") + "\n.".repeat(opt.extraRows);

			// Copy all layout-relevant styles from textarea to shadow element, in case they've changed
			[
				"border-bottom-style", "border-bottom-width",
				"border-left-style", "border-left-width",
				"border-right-style", "border-right-width",
				"border-top-style", "border-top-width",
				"font-family", "font-feature-settings", "font-kerning", "font-size", "font-stretch", "font-style",
				"font-variant", "font-variant-alternates", "font-variant-caps", "font-variant-east-asian",
				"font-variant-ligatures", "font-variant-numeric", "font-variant-position", "font-weight",
				"hyphens", "letter-spacing", "line-height",
				"padding-bottom", "padding-left", "padding-right", "padding-top",
				"text-transform", "word-break", "word-spacing"
			].forEach(name => {
				shadowContent.F.style[name] = textarea.F.computedStyle[name];
			});
		});

		// The autofocus option often gets lost after this, so redo it explicitly
		if (textarea.autofocus)
			textarea.focus();
	});
}

F.registerPlugin("autoHeight", autoHeight, {
	defaultOptions: autoHeightDefaults,
	selectors: ["textarea.auto-height"]
});


// ==================== Submit button lock plugin ====================

// Defines default options for the submitLock plugin.
let submitLockDefaults = {
	// The lock timeout, in seconds.
	timeout: 30
};

// Locks form submit buttons for a moment to avoid accidental double-submit.
function submitLock(options) {
	this.forEach(button => {
		if (button.dataset.hasSubmitLock) return;   // Already done
		button.dataset.hasSubmitLock = "true";

		let opt = F.initOptions("submitLock", button, {}, options);
		opt._lock = lockButton;
		opt._unlock = unlockButton;

		button.F.on("click", () => {
			button.dataset.submitLockClicked = "true";
			setTimeout(() => {
				delete button.dataset.submitLockClicked;
			}, 500);
		});

		let icon = button.querySelector("i");
		let loading;
		let unlockTimeout;

		// Connect with form submit event if there is a form; otherwise, only explicit locking
		// available for this button
		let form = button.form;
		if (form) {
			form.F.on("submit", event => {
				//event.preventDefault();   // DEBUG
				if (button.disabled) return;   // Nothing to do for this button
				lockButton(opt.timeout);
			});
		}

		function lockButton(timeout) {
			// Lock the button and replace the icon with a loading indicator
			button.disabled = true;
			if (icon) {
				if (button.dataset.submitLockClicked) {
					let iconWidth = icon.offsetWidth;
					let iconMarginLeft = parseFloat(icon.F.computedStyle.marginLeft);
					let iconMarginRight = parseFloat(icon.F.computedStyle.marginRight);
					icon.F.hide();
					loading = F.c("i");
					loading.classList.add("loading");
					loading.F.style = {
						fontSize: "1em",
						verticalAlign: "-2px"
					};
					loading.F.insertAfter(icon);
					let loadingWidth = loading.offsetWidth;
					let dx = loadingWidth - iconWidth;
					loading.F.style = {
						marginLeft: (-dx / 2 + iconMarginLeft) + "px",
						marginRight: (-dx / 2 + iconMarginRight) + "px"
					};
				}
			}

			// Unlock the button and restore the icon after a timeout if the page is still alive
			clearTimeout(unlockTimeout);
			unlockTimeout = setTimeout(unlockButton, timeout * 1000);
		}

		function unlockButton() {
			clearTimeout(unlockTimeout);   // Might have been called directly, before timer elapse
			button.disabled = false;
			if (loading) {
				loading.remove();
				icon.F.show();
			}
		}
	});
}

// Locks the button immediately.
function submitLockLock(timeout) {
	this.forEach(button => {
		let opt = F.loadOptions("submitLock", button);
		opt && opt._lock(timeout || opt.timeout);
	});
}

// Unlocks the button immediately.
function submitLockUnlock() {
	this.forEach(button => {
		let opt = F.loadOptions("submitLock", button);
		opt && opt._unlock();
	});
}

F.registerPlugin("submitLock", submitLock, {
	defaultOptions: submitLockDefaults,
	methods: {
		lock: submitLockLock,
		unlock: submitLockUnlock
	},
	selectors: [
		"input[type=submit].submit-lock",
		"button[type=submit].submit-lock"
	]
});


// ==================== Overflow buttons plugin ====================

const overflowButtonsEventClass = ".ff-overflow-buttons";
const overflowButtonsShrunkClass = "ff-overflow-shrunk";
const overflowButtonsOriginalTextKey = "overflow-original-text";

// Defines default options for the overflowButtons plugin.
let overflowButtonsDefaults = {
};

// Sets up the button overflow feature for button divs.
function overflowButtons(options) {
	return this.forEach(buttonsDiv => {
		if (!buttonsDiv.F.hasEventListeners("click" + overflowButtonsEventClass)) {
			let opt = F.initOptions("overflowButtons", buttonsDiv, {}, options);
			opt._update = update;

			update();

			// Updates the button visibilities for the div.
			function update() {
				let items = buttonsDiv.querySelectorAll("button, a");

				// Restore all button texts
				items.forEach(item => {
					item.classList.remove(overflowButtonsShrunkClass);
					let originaltext = F.internalData.get(item, overflowButtonsOriginalTextKey);
					if (originaltext) {
						let textNode = getFirstTextNode(item);
						if (textNode) {
							textNode.nodeValue = originaltext;
							F.internalData.delete(item, overflowButtonsOriginalTextKey);
							item.classList.remove("narrow", "icon-only");
						}
					}
				});

				// Shrink buttons from right to left
				for (let i = items.length - 1; i >= 0; i--) {
					let contentWidth = Math.ceil(buttonsDiv.scrollWidth);
					let availableWidth = Math.ceil(buttonsDiv.parentElement.F.contentWidth);
					if (contentWidth <= availableWidth)
						break;
					let item = items[i];
					let itemWidth = item.F.borderWidth;
					item.classList.add(overflowButtonsShrunkClass);
					const buttonWithTextMinWidth = 70;
					if (availableWidth < contentWidth - itemWidth + buttonWithTextMinWidth) {
						// Button is too narrow to contain trimmed text: collapse to icon only
						let textNode = getFirstTextNode(item);
						if (textNode) {
							F.internalData.set(item, overflowButtonsOriginalTextKey, textNode.nodeValue);
							textNode.nodeValue = "";
							item.classList.add("narrow", "icon-only");
						}
					}
				}
			}

			function getFirstTextNode(parent) {
				let children = parent.childNodes;
				for (let i = 0; i < children.length; i++) {
					if (children[i].nodeType === 3)
						return children[i];
				}
			}
		}
	});
}

// Updates the button visibilities for a div. This needs to be called after updating the contents of
// the buttons div, like adding/removing buttons. It is called automatically after the window has
// been resized.
function overflowButtonsUpdate() {
	this.forEach(buttonsDiv => {
		let opt = F.loadOptions("overflowButtons", buttonsDiv);
		opt && opt._update();
	});
}

F.registerPlugin("overflowButtons", overflowButtons, {
	defaultOptions: overflowButtonsDefaults,
	methods: {
		update: overflowButtonsUpdate
	},
	selectors: [
		"div.buttons.overflow-buttons"
	]
});

F(window).on("resize", () => {
	// Update the buttons overflow for all initialized divs.
	// Needs to be delayed that far to reliably work when returning from mobile device preview.
	setTimeout(F("div.buttons.overflow-buttons").overflowButtons.update, 0);
});


// ==================== Private functions ====================

function getFieldInfo(input, name) {
	let value = input.getAttribute(name) || input.dataset[name];
	if (value === undefined || typeof value === "string" && value.trim() === "")
		value = null;
	return value;
}

function getFieldInfoNumber(input, name) {
	let value = input.getAttribute(name) || input.dataset[name];
	if (value === undefined || typeof value === "string" && value.trim() === "")
		value = null;
	if (typeof value === "string")
		value = +value;
	return value;
}

// Math.ceil with a due tolerance based on the value.
function safeCeil(value) {
	return Math.ceil(value - getTolerance(value));
}

// Math.floor with a due tolerance based on the value.
function safeFloor(value) {
	return Math.floor(value + getTolerance(value));
}

// Compares two values with a due tolerance based on the values.
function safeCompare(a, b) {
	let diff = a - b;
	let tolerance = Math.max(getTolerance(a), getTolerance(b));
	if (diff < -tolerance) return -1;
	if (diff > tolerance) return 1;
	return 0;
}

// Returns the comparison tolerance for double-precision floating point numbers.
function getTolerance(value) {
	return Math.abs(value) * 1E-15;
}

// Returns the number of decimal digits that are reliable for the double-precision floating point number.
function getSafeDigits(value) {
	if (value === 0)
		return 15;
	let integerDigits = Math.floor(Math.log10(Math.abs(value))) + 1;
	return 15 - integerDigits;
}
