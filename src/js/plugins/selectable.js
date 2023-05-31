// ==================== Selectable plugin ====================

const selectableClass = "ff-selectable";
const selectableSearchMatchClass = "selectable-search-match";
const selectableSearchNoMatchClass = "selectable-search-no-match";
const selectableEventClass = ".ff-selectable";

// Defines default options for the selectable plugin.
let selectableDefaults = {
	// Indicates whether multiple items can be selected.
	multiple: false,

	// Indicates whether a single click toggles the selection of an item. This implies multiple selection.
	toggle: false,

	// Indicates whether a selection is required, i.e. cannot be cleared.
	required: false,

	// The separator for multi-select dropdown lists.
	separator: ", ",

	// The placeholder text for the empty selection in the dropdown button.
	placeholder: "",

	// Indicates whether the entered search text is shown in the matching item.
	showSearchMatch: true
};

// Makes the child elements in each selected element selectable.
function selectable(options) {
	return this.forEach(elem => {
		if (elem.classList.contains(selectableClass)) return;   // Already done
		elem.classList.add(selectableClass);
		let opt = F.initOptions("selectable", elem, {}, options);
		opt._selectAll = selectAll;
		opt._selectNone = selectNone;
		opt._selectItem = selectItem;
		opt._deinit = deinit;

		let originalElem = elem;
		let replaceHtmlSelect = elem.F.nodeNameLower === "select";
		let htmlSize = +elem.getAttribute("size");
		let useDropdown = replaceHtmlSelect && htmlSize === 0;   // Includes missing size attribute
		let htmlSelect, button;
		let disabledObservers, forwardedEvents, originalHtmlSelectFocus;
		let htmlSelectChanging;
		let blurTimeout;
		let lastClickedItem, focusedItem, focusedIndex = -1;
		let searchText = "", searchUnderlineItem, searchUnderlineLength;
		let clearSearchTimeout, clearSearchTimeoutMs = 3000;

		if (replaceHtmlSelect) {
			htmlSelect = elem;
			let origStyle = elem.getAttribute("style");
			htmlSelect.F.visible = false;
			opt.multiple |= htmlSelect.multiple;
			opt.required |= htmlSelect.required;
			let newSelect = F.c("div");
			newSelect.classList.add(selectableClass);
			newSelect.F.insertAfter(htmlSelect);
			if (htmlSize > 1) {
				if (htmlSelect.style.height) {
					// Copy the HTML select's explicit height style
					newSelect.style.height = htmlSelect.style.height;
				}
				else {
					// Use size attribute to determine the visible rows
					let frameHeight = newSelect.F.height;
					// Create dummy element for height measurement
					let dummyOption = F.c("div");
					dummyOption.textContent = "x";
					newSelect.append(dummyOption);
					let itemHeight = dummyOption.F.height;
					dummyOption.remove();
					let marginFromSecond = 1;   // See CSS
					newSelect.F.height = frameHeight + htmlSize * itemHeight + (htmlSize - 1) * marginFromSecond;
				}
			}
			elem = newSelect;
			updateChildrenFromOptions();
			if (useDropdown) {
				button = F.c("div");
				button.classList.add("ff-selectable-button");
				let contentPart = F.c("div");
				button.append(contentPart);
				let iconPart = F.c("div");
				button.append(iconPart);
				button.F.insertAfter(htmlSelect);
				if (!htmlSelect.disabled)
					button.setAttribute("tabindex", 0);
				if (originalElem.classList.contains("narrow"))
					button.classList.add("narrow");
				if (origStyle)
					button.setAttribute("style", origStyle);
				newSelect.classList.add("dropdown");
				newSelect.style.height = "100%";   // Scroll the selectable, not the dropdown container
				if (!htmlSelect.querySelector(":scope > option"))
					elem.style.minHeight = "4em";
				updateButtonContent();
				updateButtonIcon();
				let openDropdown = () => {
					if (button.F.disabled) return;
					clearSearchText();
					button.classList.add("open");
					updateButtonIcon();
					let fixed = button.F.closest(p => p.F.computedStyle.position === "fixed").length > 0;
					let cssClass = "";
					if (button.closest(".dark, .not-dark")?.classList.contains("dark"))
						cssClass = "dark";   // Set dropdown container to dark
					newSelect.F.dropdown({
						target: button,
						offsetTop: 1,
						offsetBottom: -1,
						fixed: fixed,
						cssClass: cssClass,
						minWidth: button.F.borderWidth
					});
					let firstSelectedItem = elem.querySelector(":scope > .selected");
					if (firstSelectedItem) {
						scrollItemIntoView(firstSelectedItem, true);
					}
				};
				let justClosed = false;
				button.F.on("pointerdown", event => {
					if (event.pointerType === "mouse" && event.button !== 0)
						return;   // Ignore other-than-left mouse button
					if (!justClosed)
						openDropdown();
					// Stop other event handlers up the document tree, like a modal that would try
					// to find the event source in its modal element and close the modal if it
					// wasn't in there. We're opening or closing the dropdown here, which includes
					// updating the button icon. If the icon was clicked on, the originally clicked
					// icon is no longer in the tree when the event bubbles up to the modal, so it
					// would close - even with the selectable dropdown still open!
					// (The dropdown closing happens in the capture phase, managed by the dropdown
					// plugin itself, not here.)
					event.stopPropagation();
				});
				newSelect.F.on("close", () => {
					button.classList.remove("open");
					updateButtonIcon();
					clearSearchText();
					justClosed = true;
					setTimeout(() => justClosed = false, 0);
				});
				button.F.on("keydown", event => {
					//console.log(event);
					if (button.F.disabled) return;
					if (event.key !== "Control" && event.key !== "Shift" && event.key !== "Alt")
						button.classList.add("ff-focus-visible");
					switch (event.key) {
						case "Enter":
						case " ":
							event.preventDefault();
							if (button.classList.contains("open")) {
								newSelect.F.dropdown.close();
							}
							else {
								openDropdown();
							}
							break;
						case "Escape":
							event.preventDefault();
							clearSearchText();
							newSelect.F.dropdown.close();
							break;
						default:
							handleKeyDown(event);
							break;
					}
				});

				// Close the dropdown when leaving the field with the Tab key
				// (but not when clicking into the dropdown)
				button.F.on("blur", () => {
					if (!blurTimeout) {
						blurTimeout = setTimeout(() => {
							if (button.classList.contains("open")) {
								newSelect.F.dropdown.close();
							}
							button.classList.remove("ff-focus-visible");
							blurTimeout = undefined;
						}, 50);
					}
				});
				button.F.on("focus", () => {
					if (blurTimeout) {
						// Clicked on an item, focused back; don't close the dropdown
						clearTimeout(blurTimeout);
						blurTimeout = undefined;
					}
				});
			}

			let replacement = useDropdown ? button : newSelect;
			// Show or hide the new element instead whenever the <select> element should be shown or hidden
			F.internalData.set(htmlSelect, "visible.replacement", replacement);
			// Enable or disable the new element when the <select> element is enabled or disabled
			disabledObservers = htmlSelect.F.observeDisabled(disabled => {
				replacement.F.disabled = disabled;
				if (button) {
					// Make the button unfocusable while it is disabled
					if (disabled) {
						newSelect.F.dropdown.close();
						button.removeAttribute("tabindex");
					}
					else {
						button.setAttribute("tabindex", 0);
					}
				}
			});

			// Apply disabled property where appropriate
			if (htmlSelect.F.disabled) {
				if (useDropdown)
					button.F.disabled = true;
				else
					newSelect.F.disabled = true;
			}

			// Copy some CSS classes to the replacement element (new list or button)
			["wrap", "input-validation-error", "dark", "not-dark"].forEach(clsName => {
				if (htmlSelect.classList.contains(clsName))
					replacement.classList.add(clsName);
			});

			forwardedEvents = replacement.F.forwardUIEvents(htmlSelect, "pointerdown");
			// Overwrite the focus method to focus the new visible element
			originalHtmlSelectFocus = htmlSelect.focus;
			htmlSelect.focus = () => replacement.focus();

			htmlSelect.F.on("change" + selectableEventClass, () => {
				if (!htmlSelectChanging) {
					updateSelectionFromHtml();
					lastClickedItem = elem.F.querySelector(":scope > .selected");
					if (!lastClickedItem)
						lastClickedItem = elem.F.querySelector(":scope > :not([disabled])");
					if (lastClickedItem)
						setFocusedItem(lastClickedItem);
				}
				if (useDropdown) {
					updateButtonContent();
				}
			});
		}

		elem.setAttribute("tabindex", 0);
		elem.F.children.forEach(prepareChild);

		// Selects a non-disabled item if none is selected but a selection is required.
		// Returns true if an item was selected; otherwise, false.
		let trySelectOne = () => {
			if (opt.required && !elem.querySelector(":scope > .selected")) {
				elem.querySelector(":scope > :not([disabled])")?.classList.add("selected");
				return true;
			}
			return false;
		};

		// Automatically prepare newly added children and notify if a selected child was removed
		let removedSelectedItems = [];
		let observer = new MutationObserver((mutationsList, observer) => {
			mutationsList.forEach(mutation => {
				if (mutation.type === "childList") {
					//console.log("addedNodes:", mutation.addedNodes);
					//console.log("removedNodes:", mutation.removedNodes);

					mutation.addedNodes.forEach(child => {
						if (replaceHtmlSelect) {
							// Create UI element
							let i = removedSelectedItems.indexOf(child);
							if (i !== -1) {
								// This added child was removed as selected, now it's back again
								removedSelectedItems.splice(i, 1);
							}
							let newChild = createChildForOption(child);
							let optionIndex = child.F.index;
							if (optionIndex === htmlSelect.children.length - 1) {
								// Last option, append child
								elem.append(newChild);
							}
							else {
								// Insert child at correct index
								elem.insertBefore(newChild, elem.children[optionIndex]);
							}
							prepareChild(newChild);
						}
						else {
							prepareChild(child);
						}
						if (trySelectOne()) {
							if (replaceHtmlSelect)
								updateHtmlSelect();
							else
								originalElem.F.trigger("change", { bubbles: true });
						}
						if (useDropdown) {
							updateButtonContent();
							elem.style.minHeight = "";
						}
					});

					mutation.removedNodes.forEach(child => {
						if (child.nodeType !== 1 /*ELEMENT_NODE*/) return;   // Ignore text nodes
						let uiChild = child;
						if (replaceHtmlSelect) {
							// Remove UI element
							uiChild = elem.F.children.find(c => c._optionElement === child);
							if (uiChild)
								uiChild.remove();
						}
						else if (child === searchUnderlineItem) {
							revertSearchUnderline();
						}
						if (uiChild?.classList.contains("selected")) {
							removedSelectedItems.push(child);
							if (removedSelectedItems.length === 1)
								queueMicrotask(() => {
									if (removedSelectedItems.length > 0) {
										// Some removed selected items have not been added back
										trySelectOne();
										if (replaceHtmlSelect)
											updateHtmlSelect();
										else
											originalElem.F.trigger("change", { bubbles: true });
										removedSelectedItems.length = 0;
									}
								});
						}
						if (uiChild === focusedItem) {
							// The focused item was removed: focus a nearby item
							let uiChildren = elem.F.children;
							if (focusedIndex < uiChildren.length) {
								// Focus the remaining element at the same index (the following item)
								setFocusedItem(uiChildren.get(focusedIndex));
							}
							else if (uiChildren.length > 0) {
								// No following item: focus the last item
								setFocusedItem(uiChildren.get(-1));
							}
							else {
								// No items left
								setFocusedItem();
							}
						}
					});
					if (useDropdown) {
						updateButtonContent();
						if (!htmlSelect.querySelector(":scope > option"))
							elem.style.minHeight = "4em";
					}

					updateFocusedIndex();
				}
			});
		});
		observer.observe(originalElem, { childList: true });

		lastClickedItem = elem.querySelector(":scope > .selected");
		if (!lastClickedItem)
			lastClickedItem = elem.querySelector(":scope > :not([disabled])");
		if (lastClickedItem)
			setFocusedItem(lastClickedItem);

		elem.F.on("blur" + selectableEventClass, () => elem.classList.remove("ff-focus-visible"));
		elem.F.on("keydown" + selectableEventClass, event => {
			//console.log(event);
			if (elem.F.disabled) return;
			if (event.key !== "Control" && event.key !== "Shift" && event.key !== "Alt")
				elem.classList.add("ff-focus-visible");
			handleKeyDown(event);
		});

		// Also don't close the dropdown if clicked on a disabled item or empty space (if there are no items)
		if (useDropdown) {
			let isPointerDown = false;
			elem.F.on("pointerdown", event => {
				if (event.button === 0) {
					isPointerDown = true;
					setTimeout(() => button.focus(), 0);
				}
				else {
					isPointerDown = false;
				}
			});
			elem.F.on("pointerup", () => {
				if (!isPointerDown) return;
				isPointerDown = false;
				button.focus();
			});
		}

		function handleKeyDown(event) {
			// Extend from base to current
			let extend = !!event.shiftKey && (opt.multiple || opt.toggle);
			// Extend to current
			let extendAll = !!event.shiftKey && !!event.ctrlKey;
			// Only focus, don't select
			let focus = !!event.ctrlKey && !event.shiftKey && (opt.multiple || opt.toggle);

			switch (event.key) {
				case " ":
					if (!event.ctrlKey) {
						event.preventDefault();
						// Allow space in search if a search was already started
						if (searchText.length > 0) {
							searchText += event.key;
							restartSearchTimeout();
							selectFirstSearchMatch();
						}
						else if (opt.multiple || opt.toggle) {
							clearSearchText();
							if (focusedItem) {
								// Don't allow deselecting the last required selected item
								if (!focusedItem.classList.contains("selected") ||
									!opt.required ||
									elem.querySelectorAll(":scope > .selected").length > 1) {
									if (focusedItem.classList.toggle("selected")) {
										lastClickedItem = focusedItem;
									}
									if (replaceHtmlSelect)
										updateHtmlSelect();
									else
										elem.F.trigger("change", { bubbles: true });
								}
							}
						}
					}
					break;
				case "End":
					event.preventDefault();
					clearSearchText();
					changeSelectedIndex(3, extend, extendAll, focus);
					break;
				case "Home":
					event.preventDefault();
					clearSearchText();
					changeSelectedIndex(-3, extend, extendAll, focus);
					break;
				case "ArrowUp":
					event.preventDefault();
					clearSearchText();
					changeSelectedIndex(-1, extend, extendAll, focus);
					break;
				case "ArrowDown":
					event.preventDefault();
					clearSearchText();
					changeSelectedIndex(1, extend, extendAll, focus);
					break;
				case "PageUp":
					event.preventDefault();
					clearSearchText();
					changeSelectedIndex(-2, extend, extendAll, focus);
					break;
				case "PageDown":
					event.preventDefault();
					clearSearchText();
					changeSelectedIndex(2, extend, extendAll, focus);
					break;
				case "Escape":
					event.preventDefault();
					clearSearchText();
					break;
				case "Backspace":
					event.preventDefault();
					if (searchText.length > 0) {
						searchText = searchText.substring(0, searchText.length - 1);
						restartSearchTimeout();
						selectFirstSearchMatch();
					}
					break;
				default:
					if (event.key === "a" && event.ctrlKey && !event.shiftKey) {
						event.preventDefault();
						clearSearchText();
						selectAll();
					}
					else if (event.key === "d" && event.ctrlKey && !event.shiftKey) {
						event.preventDefault();
						clearSearchText();
						selectNone();
					}
					else if (event.key.length === 1 && !event.ctrlKey) {
						// Printable character, perform text search
						event.preventDefault();
						searchText += event.key;
						restartSearchTimeout();
						selectFirstSearchMatch();
					}
					break;
			}
		}

		function selectFirstSearchMatch() {
			let prevSearchUnderlineItem = searchUnderlineItem;
			let prevSearchUnderlineLength = searchUnderlineLength;
			// First undo any existing underline so that we match the list items against their
			// correct text content
			revertSearchUnderline();

			let match = originalElem.F.children
				.where(":not([disabled])")
				.where(child => child.textContent.toLowerCase().startsWith(searchText.toLowerCase()))
				.first;
			if (match) {
				selectItem(match);
				scrollItemIntoView(match);
				setSearchUnterline(match);
			}
			else if (searchText.length > 0 && opt.showSearchMatch && prevSearchUnderlineItem) {
				// There was a matching item, but with the new search text no item matches anymore.
				// Keep the previous item's underline but change its style to indicate that this was
				// the best match but there currently isn't an exact match.
				let prevItem = prevSearchUnderlineItem;
				if (replaceHtmlSelect)
					prevItem = prevItem._optionElement;
				setSearchUnterline(prevItem, prevSearchUnderlineLength);
			}
		}

		// Underlines matching text in an element.
		function setSearchUnterline(element, limitLength) {
			if (searchText.length > 0 && opt.showSearchMatch) {
				if (replaceHtmlSelect) {
					// Recreate the UI element content from the <option> element's plain-text content
					let uiChild = elem.F.children.find(c => c._optionElement === element);
					let text = element.textContent;
					appendSearchUnderline(uiChild, text, limitLength);
					searchUnderlineItem = uiChild;

					if (useDropdown && !button.classList.contains("open")) {
						// Update button again to show the underline text
						updateButtonContent();
					}
				}
				else {
					// Stash the original child nodes of the item and create underlining parts from
					// the previous plain-text content
					let stash = F.c("div");
					stash.style.display = "none";
					stash.classList.add("stash");
					let text = element.textContent;
					stash.append(...Array.from(element.childNodes));

					appendSearchUnderline(element, text, limitLength);
					element.append(stash);
					searchUnderlineItem = element;
				}

				// Remember the underline length if it was a match
				if (!limitLength)
					searchUnderlineLength = searchText.length;
			}
		}

		// Replaces the element's content with the search match underlined text.
		function appendSearchUnderline(element, fullText, limitLength) {
			let underlineLength = searchText.length;
			if (limitLength)
				underlineLength = limitLength;
			let underlineText = fullText.substring(0, underlineLength);
			let remainderText = fullText.substring(underlineLength);
			let underline = F.c("span");
			if (limitLength)
				underline.classList.add(selectableSearchNoMatchClass);
			else
				underline.classList.add(selectableSearchMatchClass);
			underline.textContent = underlineText;
			let remainder = F.c("span");
			remainder.textContent = remainderText;
			element.replaceChildren(underline, remainder);
		}

		// Restarts the timeout to clear the search text after more text has been entered.
		function restartSearchTimeout() {
			if (clearSearchTimeout)
				clearTimeout(clearSearchTimeout);
			clearSearchTimeout = setTimeout(clearSearchText, clearSearchTimeoutMs);
		}

		// Forgets the entered search text and restores search underline changes.
		function clearSearchText() {
			if (clearSearchTimeout)
				clearTimeout(clearSearchTimeout);
			searchText = "";
			revertSearchUnderline();
		}

		// Undoes any changes made for the search text underlining and restores the original content.
		function revertSearchUnderline() {
			if (!searchUnderlineItem) return;
			if (replaceHtmlSelect) {
				// Recreate the UI element content from the <option> element
				setChildContentFromOption(searchUnderlineItem);
				// Also update the button if the underline was shown there
				if (useDropdown && !button.classList.contains("open"))
					updateButtonContent();
			}
			else {
				// Restore the original child nodes of the item
				let stash = searchUnderlineItem.querySelector(".stash");
				if (stash)
					searchUnderlineItem.replaceChildren(...Array.from(stash.childNodes));
			}
			searchUnderlineItem = undefined;
		}

		// Sets up event handlers on a selection child.
		function prepareChild(child) {
			let isPointerDown = false;
			child.F.on("pointerdown" + selectableEventClass, event => {
				if (elem.F.disabled || child.F.disabled) return;
				if (event.button === 0) {
					event.stopPropagation();   // No need to handle events on elem itself
					isPointerDown = true;
					setTimeout(() => {
						if (useDropdown)
							button.focus();
						else
							elem.focus();
					}, 0);
				}
				else {
					isPointerDown = false;
				}
			});
			child.F.on("pointerup" + selectableEventClass, event => {
				if (!isPointerDown) return;
				event.stopPropagation();   // No need to handle events on elem itself
				isPointerDown = false;
				if (useDropdown)
					button.focus();
				else
					elem.focus();
				let ctrlKey = !!event.ctrlKey;
				let shiftKey = !!event.shiftKey;
				if (!opt.multiple) ctrlKey = shiftKey = false;
				if (opt.toggle) ctrlKey = true;
				let changed = false, closeDropdown = false;
				if (ctrlKey) {
					child.classList.toggle("selected");
					if (opt.required && !elem.querySelector(":scope > .selected")) {
						// Empty selection not allowed
						child.classList.add("selected");
					}
					else {
						changed = true;
					}
					lastClickedItem = child;
				}
				else if (shiftKey) {
					let lastIndex = lastClickedItem.F.index;
					let currentIndex = child.F.index;
					// Bring indices in a defined order
					let i1 = Math.min(lastIndex, currentIndex);
					let i2 = Math.max(lastIndex, currentIndex);
					// Replace selection with all items between these indices (inclusive)
					elem.F.children.classList.remove("selected");
					for (let i = i1; i <= i2; i++) {
						let c = elem.children[i];
						if (!c.F.disabled)
							c.classList.add("selected");
					}
					changed = true;
				}
				else {
					changed = !child.classList.contains("selected") || elem.querySelectorAll(":scope > .selected").length > 1;
					elem.F.children.classList.remove("selected");
					child.classList.add("selected");
					lastClickedItem = child;
					closeDropdown = true;
				}
				setFocusedItem(child);
				clearSearchText();
				if (changed || closeDropdown) {
					if (replaceHtmlSelect) {
						updateHtmlSelect();
						if (useDropdown) {
							updateButtonContent();
							if (!(opt.multiple || opt.toggle)) {
								elem.F.dropdown.close();
							}
						}
					}
					else if (changed) {
						elem.F.trigger("change", { bubbles: true });
					}
				}
			});
			if (useDropdown && opt.multiple && !opt.toggle) {
				child.F.on("dblclick", event => {
					if (elem.F.disabled || child.F.disabled) return;
					let ctrlKey = !!event.ctrlKey;
					let shiftKey = !!event.shiftKey;
					if (!ctrlKey && !shiftKey) {
						elem.F.dropdown.close();
					}
				});
			}
		}

		// Updates the HTML select element's selection from the UI elements (selected CSS class).
		function updateHtmlSelect() {
			let selectedOptions = elem.F.querySelectorAll(":scope > .selected").select(child => child._optionElement);
			htmlSelectChanging = true;
			htmlSelect.F.querySelectorAll(":scope > option").forEach(option => {
				option.selected = selectedOptions.contains(option);
			});
			htmlSelect.F.trigger("change", { bubbles: true });
			htmlSelectChanging = false;
		}

		// Updates the selection state of all children from the HTML <select> element.
		function updateSelectionFromHtml() {
			elem.F.children.forEach(child => {
				child.classList.toggle("selected", !!child._optionElement?.selected);
			});
		}

		// Appends the missing UI child elements for HTML <option> elements and removes old children.
		// This function cannot insert added children at the correct index.
		function updateChildrenFromOptions() {
			let options = htmlSelect.F.querySelectorAll(":scope > option");
			elem.F.children.forEach(child => {
				if (!child._optionElement || !options.contains(child._optionElement)) {
					// Original option element is missing, remove this child
					child.remove();
				}
			});
			let children = elem.F.children;
			options.forEach(option => {
				if (!children.any(child => child._optionElement === option)) {
					// No child found for this option, add a new child
					let newOption = createChildForOption(option);
					elem.append(newOption);
				}
			});

			// Keep the dropdown height visible if it's empty
			if (useDropdown) {
				if (options.length === 0)
					elem.style.height = "4em";
				else
					elem.style.height = "";
			}
		}

		// Creates a visual child element for an HTML <option> element.
		function createChildForOption(option) {
			let child = F.c("div");
			child._optionElement = option;
			child.dataset.value = option.value;
			setChildContentFromOption(child);
			if (option.dataset.summary)
				child.dataset.summary = option.dataset.summary;
			if (option.dataset.summaryHtml)
				child.dataset.summaryHtml = option.dataset.summaryHtml;
			if (option.selected)
				child.classList.add("selected");
			if (option.disabled)
				child.F.disabled = true;
			child.F.visible = option.F.visible;
			F.internalData.set(option, "visible.replacement", child);

			let observer = new MutationObserver((mutationsList, observer) => {
				mutationsList.forEach(mutation => {
					if (mutation.type === "attributes" && mutation.attributeName === "value") {
						child.dataset.value = option.value;
					}
					else if (mutation.type === "childList" || mutation.type === "characterData") {
						setChildContentFromOption(child);
						if (useDropdown) {
							updateButtonContent();
						}
					}
				});
			});
			observer.observe(option, {
				// (see https://stackoverflow.com/a/40195712)
				// for textContent changes:
				childList: true,
				// for innerHTML changes:
				characterData: true, subtree: true,
				// for value attribute changes:
				attributes: true, attributeFilter: ["value"]
			});

			return child;
		}

		// Sets the visible content of a UI child from its original <option> element.
		function setChildContentFromOption(child) {
			let option = child._optionElement;
			if (option.dataset.html)
				child.innerHTML = option.dataset.html;
			else
				child.textContent = option.textContent;
			if (child.innerHTML === "")
				child.innerHTML = "&nbsp;";
		}

		// Updates the dropdown list button's text from the current selection.
		function updateButtonContent() {
			let html = "";
			elem.F.querySelectorAll(":scope > .selected").forEach(child => {
				if (html) html += opt.separator;
				let summaryText = child.dataset.summary;
				let summaryHtml = child.dataset.summaryHtml;
				if (summaryHtml)
					html += summaryHtml;
				else if (summaryText)
					html += F.encodeHTML(summaryText);
				else
					html += child.innerHTML;
			});
			if (html) {
				button.firstElementChild.innerHTML = "<span>" + html + "</span>";
			}
			else if (opt.placeholder) {
				button.firstElementChild.replaceChildren(F("<div>").addClass("placeholder").text(opt.placeholder).first);
			}
			else {
				button.firstElementChild.innerHTML = "&nbsp;";
			}
		}

		// Updates the dropdown list button's icon.
		function updateButtonIcon() {
			if (button.classList.contains("open")) {
				button.lastElementChild.innerHTML = `<svg style="width: 10px; height: 7px;"><polyline fill="none" points="1,5 5,1 9,5"/></svg>`;
			}
			else {
				button.lastElementChild.innerHTML = `<svg style="width: 10px; height: 7px;"><polyline fill="none" points="1,1 5,5 9,1"/></svg>`;
			}
		}

		// Moves (and optionally extends) the selected index up or down.
		// offset: The offset to move. Negative moves up, positive moves down. Supported values:
		//   -1/1: Move by one up or down
		//   -2/2: Move by page up or down
		//   -3/3: Move to first or last
		// extend: Indicates whether all items from the base (last clicked) to the new index are selected.
		// extendAll: Indicates whether the new index will be added to the selection but nothing else deselected.
		// focus: Indicates whether only the focused item is moved and the selection is unchanged.
		function changeSelectedIndex(offset, extend, extendAll, focus) {
			let children = elem.children;
			let count = children.length;
			if (count === 0 || offset === 0)
				return;   // Nothing to do

			// Find item
			let myFocusedItem = focusedItem ?? elem.children[0];
			let index = myFocusedItem.F.index;
			if (offset === -1 || offset === 1) {
				if (!focus && !myFocusedItem.classList.contains("selected")) {
					// Select the last item itself first, not one below/above it
				}
				else {
					// Move selection until an enabled item was found
					do {
						index += offset;
						if (index < 0 || index >= count)
							return;   // Nothing found
					}
					while (children[index].F.disabled || !children[index].F.visible);
				}
			}
			else if (offset === -2) {
				// Move selection to an item that is no more than the view height away
				let top = myFocusedItem.F.getRelativeTop(elem);
				let newTop = top - elem.clientHeight + myFocusedItem.offsetHeight;
				do {
					index--;
				}
				while (index >= 0 && (children[index].F.getRelativeTop(elem) > newTop || children[index].F.disabled || !children[index].F.visible));
				while (index < 0 || children[index].F.disabled || !children[index].F.visible)
					index++;
			}
			else if (offset === 2) {
				// Move selection down an item that is no more than the view height away
				let top = myFocusedItem.F.getRelativeTop(elem);
				let newTop = top + elem.clientHeight - myFocusedItem.offsetHeight;
				do {
					index++;
				}
				while (index < count && (children[index].F.getRelativeTop(elem) < newTop || children[index].F.disabled || !children[index].F.visible));
				while (index >= count || children[index].F.disabled || !children[index].F.visible)
					index--;
			}
			else if (offset < 0) {
				// Move selection to the first enabled item
				index = elem.F.children.where(":not([disabled])").where(c => c.F.visible).first.F.index;
			}
			else if (offset > 0) {
				// Move selection to the last enabled item
				index = elem.F.children.where(":not([disabled])").where(c => c.F.visible).last.F.index;
			}
			if (index === -1)
				return;   // Nothing found

			// Apply selection
			if (!extendAll && !focus)
				children.F.classList.remove("selected");
			if (focus) {
				// No selection change
			}
			else if (extend || extendAll) {
				let lastIndex = lastClickedItem.F.index;
				// Bring indices in a defined order
				let i1 = Math.min(lastIndex, index);
				let i2 = Math.max(lastIndex, index);
				// Replace selection with all items between these indices (inclusive)
				for (let i = i1; i <= i2; i++) {
					let c = children[i];
					if (!c.F.disabled && children[index].F.visible)
						c.classList.add("selected");
				}
			}
			else {
				lastClickedItem = children[index];
				lastClickedItem.classList.add("selected");
			}
			setFocusedItem(children[index]);
			scrollItemIntoView(children[index]);
			if (replaceHtmlSelect)
				updateHtmlSelect();
			else
				elem.F.trigger("change", { bubbles: true });
		}

		// Scrolls the specified item into view. Accepts both originalElement children (HTML options)
		// and UI children.
		function scrollItemIntoView(child, toMiddle) {
			// Only try to scroll the item into view if the selectable itself is scrollable, to not
			// scroll the page to the item.
			if (elem.F.isScrollable()) {
				let uiChild = child;
				if (replaceHtmlSelect && child.parentElement !== elem)
					uiChild = elem.F.children.find(c => c._optionElement === child);
				if (uiChild) {
					let elemStyle = elem.F.computedStyle;
					let paddingTop = parseFloat(elemStyle.paddingTop);
					let paddingBottom = parseFloat(elemStyle.paddingBottom);
					if (toMiddle)
						paddingTop = paddingBottom = elem.clientHeight / 2 - uiChild.offsetHeight;
					uiChild.F.scrollIntoView([paddingTop, paddingBottom]);
				}
			}
		}

		// Updates the new focused item and clears the previous focused item.
		function setFocusedItem(item) {
			focusedItem && focusedItem.classList.remove("focused");
			focusedItem = item;
			focusedItem && focusedItem.classList.add("focused");
			updateFocusedIndex();
		}

		function updateFocusedIndex() {
			if (focusedItem)
				focusedIndex = focusedItem.F.index;
			else
				focusedIndex = -1;
		}

		// Selects all items, if allowed.
		function selectAll() {
			if (opt.multiple || opt.toggle) {
				elem.F.children.classList.add("selected");
				if (replaceHtmlSelect)
					updateHtmlSelect();
				else
					elem.F.trigger("change", { bubbles: true });
			}
		}

		// Deselects all items, if allowed.
		function selectNone() {
			if (!opt.required) {
				elem.F.children.classList.remove("selected");
				if (replaceHtmlSelect)
					updateHtmlSelect();
				else
					elem.F.trigger("change", { bubbles: true });
			}
		}

		// Selects a single item.
		function selectItem(item) {
			if (replaceHtmlSelect) {
				htmlSelect.F.children.forEach(option => {
					option.selected = option === item;
				});
				updateSelectionFromHtml();
				let uiElement = elem.F.children.find(child => child._optionElement === item);
				if (uiElement)
					setFocusedItem(uiElement);
				htmlSelect.F.trigger("change", { bubbles: true });
			}
			else {
				elem.F.children.classList.remove("selected");
				item.classList.add("selected");
				setFocusedItem(item);
				elem.F.trigger("change", { bubbles: true });
			}
		}

		// Deinitializes the plugin.
		function deinit() {
			if (replaceHtmlSelect) {
				htmlSelect.F.visible = true;
				elem.remove();
				if (useDropdown) {
					button.remove();
				}
				F.internalData.delete(htmlSelect, "visible.replacement");
				disabledObservers.undo();
				forwardedEvents.undo();
				htmlSelect.focus = originalHtmlSelectFocus;
				htmlSelect.F.off("change" + selectableEventClass);
			}
			observer.disconnect();
			elem.F.off("blur" + selectableEventClass);
			elem.F.off("keydown" + selectableEventClass);
			clearSearchText();
			if (!replaceHtmlSelect) {
				child.F.off("pointerdown" + selectableEventClass);
				child.F.off("pointerup" + selectableEventClass);
			}
		}
	});
}

// Returns the currently selected elements.
function getSelection() {
	let selectable = this.first;
	if (!selectable) return this;   // Nothing to do
	return selectable.F.querySelectorAll(":scope > :is(.selected, :checked)");
}

// Selects all items, if allowed.
function selectAll() {
	let selectable = this.first;
	if (!selectable) return this;   // Nothing to do
	let opt = F.loadOptions("selectable", selectable);
	opt && opt._selectAll();
}

// Deselects all items, if allowed.
function selectNone() {
	let selectable = this.first;
	if (!selectable) return this;   // Nothing to do
	let opt = F.loadOptions("selectable", selectable);
	opt && opt._selectNone();
}

// Selects a single item, deselecting all others.
function selectItem(item) {
	let selectable = this.first;
	if (!selectable) return this;   // Nothing to do
	let opt = F.loadOptions("selectable", selectable);
	opt && opt._selectItem(item);
}

// Deinitializes the plugin.
function deinit() {
	return this.forEach(node => {
		let opt = F.loadOptions("selectable", node);
		opt && opt._deinit();
		F.deleteOptions("selectable", node);
	});
}

F.registerPlugin("selectable", selectable, {
	defaultOptions: selectableDefaults,
	methods: {
		getSelection: getSelection,
		selectAll: selectAll,
		selectNone: selectNone,
		selectItem: selectItem,
		deinit: deinit
	},
	selectors: [
		".selectable",
		"select"
	]
});
