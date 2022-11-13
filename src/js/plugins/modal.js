// ==================== Modal plugin ====================

const modalEventClass = ".ff-modal";
const modalClass = "ff-modal-container";
const modalCloseButtonClass = "ff-modal-close-button";

// The number of currently opened modals.
let modalLevel = 0;

// Defines default options for the modal plugin.
let modalDefaults = {
	// Indicates whether the modal is closed when clicking anywhere outside of it or pressing Esc.
	// This also shows a close button in the modal overlay.
	cancelable: true,

	// The tooltip text for the close button.
	closeTooltip: "",

	// Indicates whether the page background is dimmed while the modal is open.
	dimBackground: true,

	// The action to execute when the Enter key was pressed.
	defaultAction: undefined
};

// Opens a modal with the selected element.
function modal(options) {
	let modalElement = this.first;
	if (!modalElement) return;   // Nothing to do
	if (modalElement.parentElement?.classList.contains(modalClass)) return modalElement.F.modal;   // Already open
	modalLevel++;
	let opt = F.initOptions("modal", modalElement, {}, options);
	opt.level = modalLevel;
	if (opt.dimBackground && modalLevel === 1)
		F.dimBackground();

	let container = F.c("div");
	container.classList.add(modalClass);
	document.body.append(container);
	container.append(modalElement);

	let autofocus = modalElement.querySelector("[autofocus]");
	if (autofocus) {
		queueMicrotask(() => {
			autofocus.setSelectionRange && autofocus.setSelectionRange(0, 0);
			autofocus.focus && autofocus.focus();
		});
	}
	else {
		let firstFocusable = modalElement.F.queryFocusable().first;
		if (firstFocusable) {
			firstFocusable.focus();
			firstFocusable.blur();
		}
	}

	if (modalLevel === 1)
		F.preventScrolling();

	// Prevent moving the focus out of the modal
	document.F.on("focusin" + modalEventClass + "-" + opt.level, event => {
		if (opt.level === modalLevel) {
			// This is the top-most modal now, handle the focus event
			if (!modalElement.contains(event.target)) {
				// The focused element is not a descendant of the modal, so the focus went out of
				// the modal. Bring it back.
				let firstFocusable = modalElement.F.queryFocusable().first;
				if (firstFocusable)
					firstFocusable.focus();
				event.preventDefault();
				event.stopImmediatePropagation();
				return false;
			}
		}
	});

	let closeButton;
	if (opt.cancelable) {
		// Close on pressing the Escape key or clicking outside the modal
		document.F.on("keydown" + modalEventClass + "-" + opt.level, event => {
			// Only handle if there's no other modal on top of this one
			if (modalLevel === opt.level) {
				if (event.key === "Escape") {
					event.preventDefault();
					tryClose();
				}
				if (event.key === "Enter" && opt.defaultAction) {
					event.preventDefault();
					opt.defaultAction();
				}
			}
		});
		// Close on pointerdown instead of click because it's more targeted. A click event is also
		// triggered when the mouse button was pressed inside the modal and released outside of it.
		// This is considered "expected behaviour" of the click event.
		container.F.on("pointerdown", event => {
			// Only close when clicking with the left mouse button (including touch), and outside of
			// the modal element (i.e. on the background)
			if (event.button === 0 && !F.findEventTarget(event, modalElement)) {
				tryClose();
			}
		});

		// Add default close button
		closeButton = F.c("a");
		closeButton.classList.add(modalCloseButtonClass);
		closeButton.href = "#";
		closeButton.draggable = false;
		// Workaround for Firefox bug https://bugzilla.mozilla.org/show_bug.cgi?id=1763858
		closeButton.F.on("dragstart", event => event.preventDefault());
		modalElement.append(closeButton);
		if (opt.closeTooltip)
			closeButton.title = opt.closeTooltip;
		closeButton.F.on("click", event => {
			event.preventDefault();
			if (event.button === 0)
				tryClose();
		});

		function tryClose() {
			let events = modalElement.F.trigger("closing", { bubbles: true, cancelable: true });
			if (!events.first.defaultPrevented) {
				closeModal.call(modalElement.F);
			}
		}
	}

	// Return current plugin instance
	return modalElement.F.modal;
}

// Closes the selected modal.
function closeModal() {
	let modalElement = this.first;
	if (!modalElement) return this;   // Nothing to do
	let container = modalElement.parentElement;
	if (!container.classList.contains(modalClass)) return this;   // Modal is not open
	let opt = F.loadOptions("modal", modalElement);
	if (!opt) return this;   // Modal not initialized
	modalLevel--;
	let closeButton = modalElement.querySelector("." + modalCloseButtonClass);

	if (modalLevel === 0)
		F.preventScrolling(false);
	document.F.off("focusin" + modalEventClass + "-" + opt.level);
	document.F.off("keydown" + modalEventClass + "-" + opt.level);

	// Put the modal element out of its container back to the document body
	document.body.append(modalElement);
	container.remove();
	if (closeButton)
		closeButton.remove();
	if (opt.dimBackground && modalLevel === 0)
		F.undimBackground();

	modalElement.F.trigger("close", { bubbles: true });
	return this;
}

// Determines whether the modal is currently open.
function isOpen() {
	let modalElement = this.first;
	if (!modalElement) return this;   // Nothing to do
	if (!modalElement.parentElement) return false;
	return modalElement.parentElement.classList.contains(modalClass);
}

F.registerPlugin("modal", modal, {
	defaultOptions: modalDefaults,
	methods: {
		close: closeModal,
		isOpen: {
			get: isOpen
		}
	}
});


// ==================== Confirm modal plugin ====================

// Defines default options for the confirm plugin.
let confirmModalDefaults = {
	// The confirmation question to present in the modal.
	question: "Please confirm the action.",

	// The text of the confirm button.
	confirmText: "Confirm",

	// The CSS class of an <i> element displayed before the text of the confirm button.
	confirmIcon: undefined,

	// The text content of an <i> element displayed before the text of the confirm button.
	confirmIconText: undefined,

	// Additional CSS classes for the confirm button.
	confirmClassName: "caution",

	// The text of the cancel button.
	cancelText: "Cancel",

	// The CSS class of an <i> element displayed before the text of the cancel button.
	cancelIcon: undefined,

	// The text content of an <i> element displayed before the text of the cancel button.
	cancelIconText: undefined,

	// Additional CSS classes for the cancel button.
	cancelClassName: "transparent",

	// A function that is called when the user has clicked on the confirmation button of the modal.
	// Parameters:
	// - clicked element
	// If the function returns a value, it overrides the boolean confirmation status.
	callback: undefined
};

// Opens a confirmation modal when clicking on the selected elements before invoking their default
// action.
function confirmModal(options) {
	return this.forEach(elem => {
		let opt = F.initOptions("confirm", elem, {}, options);
		let buttons = [
			{ text: opt.confirmText, icon: opt.confirmIcon, iconText: opt.confirmIconText, className: opt.confirmClassName, result: true },
			{ text: opt.cancelText, icon: opt.cancelIcon, iconText: opt.cancelIconText, className: opt.cancelClassName, result: false }
		];

		// Intercept the click event and show the confirmation message as long as the accept button
		// was not clicked
		elem.F.on("click", async event => {
			if (!elem.dataset.ffConfirmed) {
				event.preventDefault();
				event.stopImmediatePropagation();

				// Resolve the placeholders in the question from data attributes at the element
				let question = opt.question.replace(/{([A-Za-z0-9-]+)}/g, (match, p1) => elem.dataset[F.camelCase(p1)] || match);

				let result = await F.modal({
					text: question,
					buttons: buttons,
				});
				if (result && opt.callback) {
					let cbResult = opt.callback(elem);
					if (cbResult !== undefined)
						result = cbResult;
				}
				if (result) {
					// Disable the interception and let the click event pass through
					elem.dataset.ffConfirmed = "true";
					elem.click();

					// Clear the confirmation in a moment for the case that something goes wrong and
					// the element will be clicked again later to retry
					setTimeout(() => delete elem.dataset.ffConfirmed, 50);
				}
			}
		});
	});
}

F.registerPlugin("confirm", confirmModal, {
	defaultOptions: confirmModalDefaults
});


// ========== Static modal method ==========

const buttonNames = {
	de: {
		ok: "OK",
		cancel: "Abbrechen",
		yes: "Ja",
		no: "Nein"
	},
	en: {
		ok: "OK",
		cancel: "Cancel",
		yes: "Yes",
		no: "No"
	}
};

// Shows a standard message box modal with content and buttons.
// The options will be passed on to the modal function and may contain these additional keys here:
//
// options.content: (Node) The element to display as modal content.
// options.html: (String) The message HTML content to display.
// options.text: (String) The message text to display.
// options.buttons: (Array) The buttons to display in the modal.
// options.buttons[].text: (String) The button text.
// options.buttons[].icon: (String) The CSS class of an <i> element displayed before the text.
// options.buttons[].iconText: (String) The text content of an <i> element displayed before the text.
// options.buttons[].className: (String) Additional CSS classes for the button.
// options.buttons[].result: The result value of the button.
// options.className: (String) Additional CSS class names for the modal element.
// options.languageOverride: (String) The language to use for default buttons.
//
// If a string is passed as first argument, it is displayed as text with an OK button.
//
// Returns a Promise that resolves with the clicked button's result, or undefined if the modal was closed otherwise.
F.modal = function (options) {
	if (F.isString(options)) {
		options = {
			text: options,
			buttons: "OK"
		};
	}

	let modalElement = F.c("div");
	modalElement.classList.add("modal");
	if (options.className)
		modalElement.F.classList.add(options.className);   // Support space-separated class names
	let content = F.c("div");
	content.style.overflow = "auto";
	content.style.maxHeight = "calc(100vh - 80px - 5em)";   // padding of modal, height of buttons
	modalElement.append(content);
	if (options.content) {
		// Use Frontfire append to allow appending Frontfire content
		content.F.append(options.content);
	}
	else if (options.html) {
		content.innerHTML = options.html;
	}
	else if (options.text) {
		content.textContent = options.text;
		content.style.whiteSpace = "pre-wrap";
	}

	let buttons = options.buttons;
	if (F.isString(buttons)) {
		let language = options.languageOverride || document.documentElement.lang;
		if (!(language in buttonNames))
			language = "en";
		const names = buttonNames[language];

		switch (buttons) {
			case "OK":
				buttons = [
					{ text: names.ok, className: "default", result: true }
				];
				break;
			case "OK cancel":
				buttons = [
					{ text: names.ok, className: "default", result: true },
					{ text: names.cancel, className: "transparent", result: false }
				];
				break;
			case "YES no":
				buttons = [
					{ text: names.yes, className: "default", result: true },
					{ text: names.no, result: false }
				];
				break;
			case "yes NO":
				buttons = [
					{ text: names.yes, result: true },
					{ text: names.no, className: "default", result: false }
				];
				break;
			default:
				buttons = [
					{ text: buttons, result: true },
				];
				break;
		}
	}

	var promise = new Promise((resolve, reject) => {
		let buttonsElement;
		let buttonPressed = false;
		if (buttons && buttons.length > 0) {
			buttonsElement = F.c("div");
			buttonsElement.classList.add("buttons");
			modalElement.append(buttonsElement);

			buttons.forEach(button => {
				let buttonElement = F.c("button");
				if (button.className)
					buttonElement.classList.add(button.className)
				buttonsElement.append(buttonElement);

				let icon;
				if (button.icon || button.iconText) {
					icon = F.c("i");
					if (button.icon)
						icon.F.classList.add(button.icon);   // Support space-separated class names
					if (button.iconText)
						icon.textContent = button.iconText;
					buttonElement.append(icon);
				}
				if (icon && button.text) {
					buttonElement.append(" ");
				}
				if (button.text) {
					buttonElement.append(button.text);
				}

				buttonElement.F.on("click", event => {
					buttonPressed = true;
					modalElement.F.modal.close();
					resolve(button.result);
				});
			});
		}

		modalElement.F.on("close", () => {
			if (!buttonPressed)
				resolve();
		});

		modalElement.F.modal(options);
		if (buttonsElement)
			buttonsElement.querySelector("button.default")?.focus();

		setTimeout(() => {
			promise.cancel =() => {
				modalElement.F.modal.close();
			};
		}, 0);
	});
	return promise;
}

// Gets the number of currently opened modals.
Object.defineProperty(F.modal, "level", {
	get: () => modalLevel
});
