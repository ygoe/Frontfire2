// ==================== Tree plugin ====================

const treeClass = "ff-tree";
const treeEventClass = ".ff-tree";

// Defines default options for the tree view plugin.
let treeDefaults = {
	// The items of the tree view.
	items: [],

	// Indicates whether a single root item is shown that cannot be collapsed.
	singleRoot: false,

	// A function that returns the icon element for an item.
	iconGetter: undefined,

	// A function that returns the label text for an item.
	labelGetter: undefined,

	// A function that returns the CSS style text for an item.
	styleGetter: undefined,

	// The object key of the child items for an item.
	childrenKey: undefined,

	// A function that is called when an item was hovered or left. Parameters:
	// - item
	// - hoverState (true, false)
	itemHover: undefined,

	// A function that is called when an item was selected or deselected. Parameters:
	// - item
	// - selectedState (true, false)
	itemSelected: undefined,

	// A function that is called when an item was expanded or collapsed. Parameters:
	// - item
	// - expandedState (true, false)
	itemExpanded: undefined,

	// A function that is called when an item was double-clicked. Parameters:
	// - item
	itemDoubleClicked: undefined,

	// Indicates whether an expandable item will be expanded or collapsed when double-clicked.
	doubleClickExpand: true,

	// Indicates whether multiple items can be selected at the same time.
	multiSelect: false,

	// Enables drag&drop of items.
	dragdrop: false,

	// A function that indicates whether an item is a drop target itself. Parameters:
	// - item
	isDropTarget: undefined,

	// A function that is called while dragging items. Parameters:
	// - dragged items
	// - drop target element
	dragHandler: undefined,

	// A function that is called after a drag&drop operation was completed. Parameters:
	// - dragged items
	// - drop target item
	// - drop position
	dropHandler: undefined,

	// A function that is called when an unhandled key is pressed. Parameters:
	// - event
	keyHandler: undefined
};

// Shows a tree view on the element.
function tree(options) {
	let container = this.first;
	if (!container) return;   // Nothing to do
	if (container.classList.contains(treeClass)) return container.F.tree;   // Already created
	let opt = F.initOptions("tree", container, {}, options);
	opt._getSelectedItems = getSelectedItems;
	opt._selectItem = selectItem;
	opt._deselectItem = deselectItem;
	opt._isItemSelected = isItemSelected;
	opt._hoverItem = hoverItem;
	opt._isItemExpandedPublic = isItemExpandedPublic;
	opt._setItemExpanded = setItemExpanded;
	opt._updateItem = updateItem;
	opt._insertItem = insertItem;
	opt._removeItem = removeItem;
	opt._updateView = updateView;

	let focusedItem, focusedItemElement;
	let selectionStartElement;

	const minDragDistance = 4;
	let isPointerDown = false;
	let pointerDownPosition;
	let isDragging = false;
	let draggedItems, dragSelected;
	let dragIndicator;
	let dropTarget, dropPosition;
	let dragExpandTimeout, dragExpandTarget;

	container.classList.add(treeClass);
	if (container.tabIndex === -1)
		container.tabIndex = 0;

	container.F.on("blur" + treeEventClass, () => container.classList.remove("ff-focus-visible"));
	container.F.on("keydown" + treeEventClass, event => {
		if (event.key !== "Control" && event.key !== "Shift")
			container.classList.add("ff-focus-visible");
		if (event.key === "ArrowUp") {
			event.preventDefault();
			let prevElement = getPreviousVisibleItemElement(focusedItemElement);
			if (prevElement) {
				if (event.ctrlKey && !event.shiftKey) {
					// Just move focused item, can then be selected with Space
					const prevItem = prevElement.firstChild._item;
					setFocusedItem(prevItem, prevElement);
				}
				else {
					// Apply single or range selection (Ctrl+Shift is not supported here)
					clickItem(prevElement, event.shiftKey, event.ctrlKey);
				}
				scrollItemIntoView(prevElement);
			}
		}
		else if (event.key === "ArrowDown") {
			event.preventDefault();
			let nextElement = getNextVisibleItemElement(focusedItemElement);
			if (nextElement) {
				if (event.ctrlKey && !event.shiftKey) {
					// Just move focused item, can then be selected with Space
					const nextItem = nextElement.firstChild._item;
					setFocusedItem(nextItem, nextElement);
				}
				else {
					// Apply single or range selection (Ctrl+Shift is not supported here)
					clickItem(nextElement, event.shiftKey, event.ctrlKey);
				}
				scrollItemIntoView(nextElement);
			}
		}
		else if (event.key === "PageUp") {
			event.preventDefault();
			// TODO: for scrolling
		}
		else if (event.key === "PageDown") {
			event.preventDefault();
			// TODO: for scrolling
		}
		else if (event.key === " ") {
			event.preventDefault();
			// Select/deselect item (intended for use after moving focused item with Ctrl+Arrow)
			clickItem(focusedItemElement, /*shiftKey*/ false, /*ctrlKey*/ true);
		}
		else if (event.key === "ArrowLeft") {
			event.preventDefault();
			let expanded = isItemExpanded(focusedItemElement);
			if (!expanded || event.ctrlKey) {
				// Already collapsed or not expandable, go to parent
				// (with Ctrl key: always go to parent, never collapse)
				const parentElement = getParentItemElement(focusedItemElement);
				if (parentElement) {
					if (event.ctrlKey) {
						const parentItem = parentElement.firstChild._item;
						setFocusedItem(parentItem, parentElement);
					}
					else {
						clickItem(parentElement, /*shiftKey*/ false, /*ctrlKey*/ false);
					}
				}
			}
			else {
				// Collapse item
				toggleItemExpanded(focusedItemElement, false);
			}
		}
		else if (event.key === "ArrowRight") {
			event.preventDefault();
			let expanded = isItemExpanded(focusedItemElement);
			if (expanded) {
				// Already expanded, go to first child
				let nextElement = getNextVisibleItemElement(focusedItemElement);
				if (nextElement) {
					if (event.ctrlKey) {
						const nextItem = nextElement.firstChild._item;
						setFocusedItem(nextItem, nextElement);
					}
					else {
						clickItem(nextElement, event.shiftKey, event.ctrlKey);
					}
					scrollItemIntoView(nextElement);
				}
			}
			else {
				// Expand item if possible
				toggleItemExpanded(focusedItemElement, true);
			}
		}
		else if (event.key === "Enter") {
			event.preventDefault();
			// Expand/collapse item (does nothing if not supported, i.e. there's no expander icon)
			let expanded = isItemExpanded(focusedItemElement);
			if (typeof expanded === "boolean")
				toggleItemExpanded(focusedItemElement);
		}
		else {
			opt.keyHandler && opt.keyHandler(event);
		}
	});

	if (opt.items.length > 0)
		focusedItem = opt.items[0];

	updateView();

	function updateView() {
		// Remember the current scroll position and clear all elements
		const scroll = container.scrollY;
		container.replaceChildren();

		if (opt.singleRoot && opt.items.length > 0) {
			container.appendChild(createItemElement(opt.items[0], true));
		}
		else {
			for (let item of opt.items) {
				container.appendChild(createItemElement(item));
			}
		}

		// Restore scrolling
		container.scroll(container.scrollX, scroll);
	}

	function createItemElement(item, isRoot) {
		const element = document.createElement("div");
		element.classList.add("tree-item");
		if (isRoot)
			element.classList.add("single-root");

		const mainPart = document.createElement("div");
		mainPart._item = item;
		mainPart.classList.add("main-part");
		element.appendChild(mainPart);

		const expander = document.createElement("div");
		const expanderIcon = document.createElement("div");
		if (!isRoot) {
			expander.classList.add("expander");
			expanderIcon.classList.add("expander-icon");
			expander.appendChild(expanderIcon);
		}
		mainPart.appendChild(expander);

		const itemContent = document.createElement("div");
		itemContent.classList.add("content");
		mainPart.appendChild(itemContent);

		// Add hover events
		itemContent.addEventListener("pointerenter", () => {
			opt.itemHover && opt.itemHover(item, true);
		});
		itemContent.addEventListener("pointerleave", () => {
			isPointerDown = false;
			clearTimeout(dragExpandTimeout);
			draggedItems = dropTarget = dropPosition = undefined;
			itemContent.style.cursor = "";
			if (dragIndicator) {
				dragIndicator.remove();
				dragIndicator = undefined;
			}
			opt.itemHover && opt.itemHover(item, false);
		});

		// Add click event
		itemContent.addEventListener("click", e => {
			if (isDragging)
				return;   // Not a click but a completed drag
			clickItem(element, e.shiftKey, e.ctrlKey, e.detail);
		});

		// Add drag&drop events
		itemContent.addEventListener("pointerdown", e => {
			isDragging = false;
			isPointerDown = true;
			pointerDownPosition = [e.clientX, e.clientY];
		});
		itemContent.addEventListener("pointerup", () => {
			if (isDragging && dropTarget) {
				// Drop items, use dropTarget and dropPosition ("before"/"after"/"replace")
				const parentElement = getParentItemElement(dropTarget);
				const parentItem = parentElement?.firstChild._item;
				const parentChildren = parentItem ? parentItem[opt.childrenKey] : opt.items;
				const dropTargetItem = dropTarget.firstChild._item;
				let newIndex = parentChildren.indexOf(dropTargetItem);
				if (dropPosition === "after")
					newIndex++;
				for (let i = 0; i < draggedItems.length; i++) {
					const draggedItem = draggedItems[i];
					const draggedItemElement = findItemElement(draggedItem);
					const draggedParentElement = getParentItemElement(draggedItemElement);
					const draggedParent = draggedParentElement?.firstChild._item;
					const draggedParentChildren = draggedParent ? draggedParent[opt.childrenKey] : opt.items;
					// Remove the tree item
					removeItem(draggedItem);
					// Also remove the item from the data source
					const oldIndex = draggedParentChildren.indexOf(draggedItem);
					draggedParentChildren.splice(oldIndex, 1);
					if (draggedParent === parentItem && oldIndex < newIndex)
						newIndex--;
					// Insert it back to the target place
					parentChildren.splice(newIndex, 0, draggedItem);
					newIndex++;
					// Also create the new tree item for it
					insertItem(draggedItem, parentItem);
					// Remove replaced item
					if (dropPosition === "replace" && i === 0) {
						removeItem(dropTargetItem);
						parentChildren.splice(newIndex, 1);
					}
				}
				opt.dropHandler && opt.dropHandler(draggedItems, dropTargetItem, dropPosition);
				if (dragSelected) {
					// Restore selection of dragged items
					draggedItems.forEach((item, index) => {
						const dragItemElement = findItemElement(item);
						const dragItemContent = getItemContentForItemElement(dragItemElement);
						dragItemContent.classList.add("selected");
						opt.itemSelected && opt.itemSelected(item, true);
						if (index === 0)
							setFocusedItem(item, dragItemElement);
					});
				}
			}
			isPointerDown = false;
			clearTimeout(dragExpandTimeout);
			draggedItems = dropTarget = dropPosition = undefined;
			itemContent.style.cursor = "";
			if (dragIndicator) {
				dragIndicator.remove();
				dragIndicator = undefined;
			}
		});
		itemContent.addEventListener("pointermove", e => {
			if (isPointerDown) {
				if (!isDragging && opt.dragdrop) {
					let distance = Math.sqrt(Math.pow(e.clientX - pointerDownPosition[0], 2) + Math.pow(e.clientY - pointerDownPosition[1], 2));
					if (distance >= minDragDistance) {
						isDragging = true;
						itemContent.setPointerCapture(e.pointerId);
						itemContent.style.cursor = "grabbing";
						dragIndicator = document.createElement("div");
						dragIndicator.classList.add("tree-drag-indicator");
						if (container.F.dark)
							dragIndicator.classList.add("dark");
						dragIndicator.style.position = "fixed";
						dragIndicator.style.zIndex = "9999";
						document.body.appendChild(dragIndicator);

						// If clicking on a selected item, drag all selected items, otherwise only
						// the item that was clicked on
						dragSelected = itemContent.classList.contains("selected");
						if (dragSelected)
							draggedItems = getSelectedItems();
						else
							draggedItems = [itemContent.parentNode._item];
					}
				}
				if (isDragging) {
					// Find position of insertion marker
					let treeRect = container.getBoundingClientRect();
					let treeItemUnderPointer;
					for (let dy = 0; dy < 8; dy++) {
						// Always test near the right edge of the tree view because near the left
						// edge could be a gap next to the children container where the ancestor
						// items are detected. This also allows vertical dragging outside of the
						// actual tree view rectangle (thanks to pointer capture).
						// Attention must be paid to with width of scrollbars (40px should always
						// be wider than a scollbar).
						treeItemUnderPointer = document.elementsFromPoint(treeRect.right - 40, e.clientY - dy)
							.filter(e => e.classList.contains("tree-item") || e.classList.contains("children"))[0];
						if (!treeItemUnderPointer)
							return;   // Nothing of interest at this position
						if (treeItemUnderPointer.classList.contains("tree-item"))
							break;
						// Between items, look further up (continue loop)
					}
					if (treeItemUnderPointer.classList.contains("children"))
						return;   // No tree item rectangle to be found

					// Make sure we're not offering to move any items into their own children.
					// For this, see if any of the ancestors of the target is being dragged.
					if (dropTarget === null)
						dropTarget = undefined;
					let parent = treeItemUnderPointer;
					do {
						if (draggedItems.includes(parent.firstChild._item)) {
							// This item cannot be used as target
							itemContent.style.cursor = "not-allowed";
							dragIndicator.style.width = "0";
							dropTarget = null;   // Separate value from initial undefined
							break;
						}
						parent = getParentItemElement(parent);
					}
					while (parent);

					if (dropTarget !== null) {
						const pointerItemContent = getItemContentForItemElement(treeItemUnderPointer);
						//console.log(pointerItemContent.querySelector(".label").textContent);
						const itemRect = pointerItemContent.getBoundingClientRect();
						dragIndicator.style.width = itemRect.width + "px";
						dragIndicator.style.left = itemRect.left + "px";
						let cy, height;
						if (opt.isDropTarget && opt.isDropTarget(treeItemUnderPointer.firstChild._item)) {
							// Use the item as target to be replaced
							dropTarget = treeItemUnderPointer;
							dropPosition = "replace";
							cy = (itemRect.top + itemRect.bottom) / 2;
							height = itemRect.height;
						}
						else if (e.clientY < itemRect.top + itemRect.height / 2) {
							// Upper half of the hovered item
							dropTarget = treeItemUnderPointer;
							dropPosition = "before";
							const prevItemElement = getPreviousVisibleItemElement(treeItemUnderPointer);
							if (prevItemElement) {
								const prevItemContent = getItemContentForItemElement(prevItemElement);
								const prevRect = prevItemContent.getBoundingClientRect();
								cy = (itemRect.top + prevRect.bottom) / 2;
							}
							else {
								cy = itemRect.top;
							}
							height = 3;
						}
						else {
							// Lower half of the hovered item
							dropTarget = treeItemUnderPointer;
							dropPosition = "after";
							const nextItemElement = getNextVisibleItemElement(treeItemUnderPointer);
							if (nextItemElement) {
								const nextItemContent = getItemContentForItemElement(nextItemElement);
								const nextRect = nextItemContent.getBoundingClientRect();
								const childrenContainer = treeItemUnderPointer.firstChild.nextSibling;
								if (childrenContainer.style.display !== "none") {
									// Lower half of an expanded parent item: Change horizontal
									// placement to that of the first child to indicate that the new
									// position is before the first child (not after the parent)
									dropTarget = nextItemElement;
									dropPosition = "before";
									dragIndicator.style.width = nextRect.width + "px";
									dragIndicator.style.left = nextRect.left + "px";
								}
								cy = (itemRect.bottom + nextRect.top) / 2;
							}
							else {
								cy = itemRect.bottom;
							}
							height = 3;
						}

						if (opt.singleRoot && dropPosition === "before" && dropTarget.classList.contains("single-root")) {
							// Prohibit dragging before the single root item
							itemContent.style.cursor = "not-allowed";
							dragIndicator.style.width = "0";
							dropTarget = null;   // Separate value from initial undefined
						}
						else if (opt.dragHandler && !opt.dragHandler(draggedItems, dropTarget)) {
							// Dragging prohibited
							itemContent.style.cursor = "not-allowed";
							dragIndicator.style.width = "0";
							dropTarget = null;   // Separate value from initial undefined
						}
						else {
							itemContent.style.cursor = "grabbing";
							dragIndicator.style.top = (cy - height / 2) + "px";
							dragIndicator.style.height = height + "px";
							dragIndicator.classList.toggle("replace", dropPosition === "replace");
						}
					}

					// When entering and hovering another expandable item for a moment, expand it
					if (treeItemUnderPointer !== dragExpandTarget) {
						clearTimeout(dragExpandTimeout);
						dragExpandTarget = undefined;
						if (isItemExpanded(treeItemUnderPointer) === false) {
							dragExpandTarget = treeItemUnderPointer;
							dragExpandTimeout = setTimeout(() => toggleItemExpanded(dragExpandTarget, true), 1000);
						}
					}
					// TODO: When near the top/bottom end of the tree view, scroll up/down slowly (speed depending on nearness to the edge)
					// - also implement that in the dashboard drag code
				}
			}
		});

		const icon = document.createElement("div");
		icon.classList.add("icon");
		itemContent.appendChild(icon);

		const label = document.createElement("div");
		label.classList.add("label");
		itemContent.appendChild(label);

		updateItemContent(itemContent, item);

		const childrenContainer = document.createElement("div");
		childrenContainer.classList.add("children");
		if (!isRoot)
			childrenContainer.style.display = "none";
		element.appendChild(childrenContainer);
		const childItems = opt.childrenKey ? item[opt.childrenKey] : null;
		if (childItems && childItems.length > 0) {
			expander.style.visibility = "visible";
			for (let childItem of childItems) {
				childrenContainer.appendChild(createItemElement(childItem));
			}
		}
		expander.addEventListener("click", e => {
			//e.stopPropagation();
			toggleItemExpanded(element);
		});

		if (item === focusedItem) {
			focusedItemElement = element;
			focusedItemElement.classList.add("focused");
		}

		return element;
	}

	function insertItem(item, parent) {
		const childItems = opt.childrenKey ? (parent ? parent[opt.childrenKey] : opt.items) : null;
		if (!childItems)
			return;
		let parentElement = findItemElement(parent);
		const index = childItems.indexOf(item);
		const childrenContainer = parentElement?.querySelector(".children") ?? container;
		const insertBeforeChild = index < childrenContainer.children.length ? childrenContainer.children[index] : null;
		childrenContainer.insertBefore(createItemElement(item), insertBeforeChild);
	}

	function removeItem(item) {
		const itemElement = findItemElement(item);
		if (!itemElement)
			return;
		let parentElement = getParentItemElement(itemElement);
		itemElement.remove();
		if (!parentElement)
			parentElement = container.firstChild;

		// If the focused item is removed, move the focus to its parent
		if (itemElement.contains(focusedItemElement)) {
			const parentItem = parentElement.firstChild._item;
			setFocusedItem(parentItem, parentElement);
		}
		// Same for selection start element
		if (itemElement.contains(selectionStartElement)) {
			selectionStartElement = parentElement;
		}
	}

	// Scrolls the item into view if necessary.
	function scrollItemIntoView(itemElement) {
		const pos = getElementVerticalPosition(itemElement);
		const viewportPos = pos - container.scrollTop;
		const itemContent = getItemContentForItemElement(itemElement);
		if (viewportPos < 0 || viewportPos + itemContent.offsetHeight > container.clientHeight)
			container.scrollTo({ top: pos - container.clientHeight / 2, behavior: "smooth" });
	}

	function clickItem(itemElement, shiftKey, ctrlKey, count) {
		const item = itemElement.firstChild._item;
		const itemContent = getItemContentForItemElement(itemElement);

		// Move focus to clicked element
		setFocusedItem(item, itemElement);

		// Update selection
		if (shiftKey && opt.multiSelect) {
			// Set selection range end
			// With ctrlKey: Extend selection range (don't deselect anything)
			const direction = getElementVerticalPosition(itemElement, selectionStartElement);
			const selectedElements = new Set();
			const newlySelectedElements = [];
			let el = selectionStartElement;
			let elItemContent = getItemContentForItemElement(el);
			if (!elItemContent.classList.contains("selected")) {
				newlySelectedElements.push(el);
				elItemContent.classList.add("selected");
			}
			selectedElements.add(el);
			if (itemElement !== selectionStartElement) {
				while (true) {
					if (direction > 0)
						el = getNextVisibleItemElement(el);
					else
						el = getPreviousVisibleItemElement(el);
					elItemContent = getItemContentForItemElement(el);
					if (!elItemContent.classList.contains("selected")) {
						newlySelectedElements.push(el);
						elItemContent.classList.add("selected");
					}
					selectedElements.add(el);
					if (el === itemElement)
						break;
				}
			}
			if (!ctrlKey) {
				container.F.querySelectorAll(".selected").forEach(selectedItemContent => {
					const element = selectedItemContent.parentNode.parentNode;
					if (!selectedElements.has(element)) {
						selectedItemContent.classList.remove("selected");
						if (opt.itemSelected)
							opt.itemSelected(selectedItemContent.parentNode._item, false);
					}
				});
			}
			if (opt.itemSelected)
				newlySelectedElements.forEach(e => opt.itemSelected(e.firstChild._item, true));
		}
		else if (ctrlKey && opt.multiSelect) {
			// Toggle single item
			selectionStartElement = itemElement;
			itemContent.classList.toggle("selected");
			opt.itemSelected && opt.itemSelected(item, itemContent.classList.contains("selected"));
		}
		else {
			// Select single
			selectionStartElement = itemElement;
			itemContent.classList.add("selected");
			Array.from(container.getElementsByClassName("selected")).forEach(selectedItemContent => {
				if (selectedItemContent !== itemContent) {
					selectedItemContent.classList.remove("selected");
					opt.itemSelected && opt.itemSelected(selectedItemContent.parentNode._item, false);
				}
			});
			opt.itemSelected && opt.itemSelected(item, true);

			if (count === 2) {
				// Double click
				let expanded = isItemExpanded(itemElement);
				if (typeof expanded === "boolean") {
					if (opt.doubleClickExpand)
						toggleItemExpanded(itemElement);
				}
				else {
					opt.itemDoubleClicked && opt.itemDoubleClicked(item);
				}
			}
		}
	}

	function updateItemContent(itemContent, item) {
		const icon = itemContent.getElementsByClassName("icon")[0];
		const itemIcon = opt.iconGetter ? opt.iconGetter(item) : null;
		if (typeof itemIcon === "string") {
			icon.innerHTML = itemIcon;
		}
		else if (itemIcon) {
			icon.innerHTML = "";
			icon.appendChild(itemIcon);
		}
		else {
			icon.innerHTML = "&#x25A0;";
		}

		const label = itemContent.getElementsByClassName("label")[0];
		label.textContent = opt.labelGetter ? opt.labelGetter(item) : "Item";

		if (opt.styleGetter)
			itemContent.setAttribute("style", opt.styleGetter(item));
	}

	// Returns true/false for current expanded state; undefined if not expandable.
	function isItemExpanded(itemElement) {
		if (!itemElement)
			return;   // Item not found
		const expanderIcon = itemElement.firstChild?.getElementsByClassName("expander-icon")[0];   // only own expander from mainPart, not children
		if (!expanderIcon)
			return;   // Item has no expander, must be (expanded) root item
		const expander = expanderIcon.parentElement;
		if (expander.style.visibility !== "visible")
			return;   // Item cannot be expanded
		return expanderIcon.classList.contains("expanded");
	}

	// Returns true/false for new expanded state; undefined if not expandable.
	function toggleItemExpanded(itemElement, force) {
		if (!itemElement)
			return;
		const expanderIcon = itemElement.firstChild?.getElementsByClassName("expander-icon")[0];   // only own expander from mainPart, not children
		if (!expanderIcon)
			return;   // Item has no expander, nothing to do
		const childrenContainer = itemElement.firstChild.nextSibling;
		const item = itemElement.firstChild._item;
		if (force === true || force !== false && childrenContainer.style.display === "none") {
			// Currently collapsed: expand now
			expanderIcon.classList.add("expanded");
			childrenContainer.style.display = "";
			opt.itemExpanded && opt.itemExpanded(item, true);
			return true;
		}
		else {
			// Currently expanded: collapse now
			expanderIcon.classList.remove("expanded");
			childrenContainer.style.display = "none";
			opt.itemExpanded && opt.itemExpanded(item, false);

			// Deselect all now collapsed items
			Array.from(childrenContainer.getElementsByClassName("selected")).forEach(selectedItemContent => {
				selectedItemContent.classList.remove("selected");
				opt.itemSelected && opt.itemSelected(selectedItemContent.parentNode._item, false);
			});

			// If the focused item is now collapsed, move the focus to the current item
			if (itemElement.contains(focusedItemElement)) {
				setFocusedItem(item, itemElement);
			}
			// Same for selection start element
			if (itemElement.contains(selectionStartElement)) {
				selectionStartElement = itemElement;
			}
			return false;
		}
	}

	function getSelectedItems() {
		const selectedItems = [];
		Array.from(container.getElementsByClassName("selected")).forEach(selectedItemContent => {
			selectedItems.push(selectedItemContent.parentNode._item);
		});
		return selectedItems;
	}

	function setFocusedItem(item, element) {
		focusedItemElement && focusedItemElement.classList.remove("focused");
		focusedItem = item;
		focusedItemElement = element;
		focusedItemElement.classList.add("focused");
	}

	function getItemContentForItemElement(itemElement) {
		return itemElement.firstChild.firstChild.nextSibling;
	}

	function getParentItemElement(itemElement) {
		if (itemElement.parentNode !== container)
			return itemElement.parentNode.parentNode;
		return null;
	}

	function getNextVisibleItemElement(itemElement) {
		const childrenContainer = itemElement.firstChild.nextSibling;
		if (childrenContainer.style.display !== "none") {
			return childrenContainer.firstChild;
		}
		else if (itemElement.nextSibling) {
			return itemElement.nextSibling;
		}
		else {
			// Walk up parents and find next sibling on the way
			let parentElement = getParentItemElement(itemElement);
			while (parentElement) {
				if (parentElement.nextSibling)
					return parentElement.nextSibling;
				parentElement = getParentItemElement(parentElement);
			}
			return null;
		}
	}

	function getPreviousVisibleItemElement(itemElement) {
		if (!itemElement.previousSibling) {
			if (itemElement.parentNode === container)
				return null;
			return itemElement.parentNode.parentNode;
		}
		else {
			// Find last descendent of previous sibling
			itemElement = itemElement.previousSibling;
			while (true) {
				const childrenContainer = itemElement.firstChild.nextSibling;
				if (childrenContainer.style.display === "none")
					return itemElement;
				itemElement = childrenContainer.lastChild;
			}
		}
	}

	function getElementVerticalPosition(itemElement, baseElement) {
		let pos = 0;
		do {
			pos += itemElement.offsetTop;
			itemElement = itemElement.offsetParent;
		}
		while (itemElement);
		itemElement = baseElement || container;
		do {
			pos -= itemElement.offsetTop;
			itemElement = itemElement.offsetParent;
		}
		while (itemElement);
		return pos;
	}

	function findItemElement(item, baseElement) {
		if (baseElement === undefined)
			baseElement = container;
		for (let i = 0; i < baseElement.children.length; i++) {
			const itemElement = baseElement.children[i];
			if (itemElement.firstChild._item === item)
				return itemElement;
			const childrenContainer = itemElement.firstChild.nextSibling;
			const childSearch = findItemElement(item, childrenContainer);
			if (childSearch)
				return childSearch;
		}
		return null;
	}

	// Selects an item and makes sure it's visible.
	function selectItem(item, focus, keepOtherSelected) {
		const itemElement = findItemElement(item);
		if (!itemElement)
			return;

		// Expand tree to item
		let parentElement = getParentItemElement(itemElement);
		while (parentElement) {
			toggleItemExpanded(parentElement, true);
			parentElement = getParentItemElement(parentElement);
		}

		// Scroll into view
		scrollItemIntoView(itemElement);

		// Select item
		selectionStartElement = itemElement;
		const itemContent = getItemContentForItemElement(itemElement);
		itemContent.classList.add("selected");
		if (!keepOtherSelected) {
			Array.from(container.getElementsByClassName("selected")).forEach(selectedItemContent => {
				if (selectedItemContent !== itemContent) {
					selectedItemContent.classList.remove("selected");
					opt.itemSelected && opt.itemSelected(selectedItemContent.parentNode._item, false);
				}
			});
		}
		if (focus)
			setFocusedItem(item, itemElement);
		opt.itemSelected && opt.itemSelected(item, true);
	}

	// Deselects an item.
	function deselectItem(item, focus) {
		const itemElement = findItemElement(item);
		if (!itemElement)
			return;

		const itemContent = getItemContentForItemElement(itemElement);
		itemContent.classList.remove("selected");
		if (focus)
			setFocusedItem(item, itemElement);
		opt.itemSelected && opt.itemSelected(item, false);
	}

	// Determines whether an item is selected.
	function isItemSelected(item) {
		const itemElement = findItemElement(item);
		if (!itemElement)
			return;

		const itemContent = getItemContentForItemElement(itemElement);
		return itemContent.classList.contains("selected");
	}

	// Sets or gets the hovered state of an item.
	// NOTE: This state is used for highlighting items in the tree, it cannot be used to determine
	// whether the user has currently placed the mouse cursor over an item. Use the callback
	// function in options.itemHover for this purpose instead.
	function hoverItem(item, isHovered) {
		const itemElement = findItemElement(item);
		if (!itemElement)
			return;
		const itemContent = getItemContentForItemElement(itemElement);
		if (isHovered !== undefined)
			itemContent.classList.toggle("hover", isHovered);
		else
			return itemContent.classList.contains("hover");
	}

	// Gets the expanded state of an item.
	function isItemExpandedPublic(item) {
		return isItemExpanded(findItemElement(item));
	}

	// Expands or collapses an item.
	function setItemExpanded(item, expanded) {
		return toggleItemExpanded(findItemElement(item), !!expanded);
	}

	// Updates the item in the tree view.
	function updateItem(item) {
		const itemElement = findItemElement(item);
		if (!itemElement)
			return;
		const itemContent = getItemContentForItemElement(itemElement);
		updateItemContent(itemContent, item);
	}

	// Return current plugin instance
	return container.F.tree;
}

// Gets all selected items in the visual order.
function getSelectedItems() {
	return callMethod(this, "getSelectedItems", [])
}

// Selects an item and makes sure it's visible.
function selectItem(item, focus, keepOtherSelected) {
	return callMethod(this, "selectItem", [item, focus, keepOtherSelected])
}

// Deselects an item.
function deselectItem(item, focus) {
	return callMethod(this, "deselectItem", [item, focus])
}

// Determines whether an item is selected.
function isItemSelected(item) {
	return callMethod(this, "isItemSelected", [item])
}

// Sets or gets the hovered state of an item.
// NOTE: This state is used for highlighting items in the tree, it cannot be used to determine
// whether the user has currently placed the mouse cursor over an item. Use the callback
// function in options.itemHover for this purpose instead.
function hoverItem(item, isHovered) {
	return callMethod(this, "hoverItem", [item, isHovered])
}

// Gets the expanded state of an item.
function isItemExpanded(item) {
	return callMethod(this, "isItemExpandedPublic", [item])
}

// Expands or collapses an item.
function setItemExpanded(item, expanded) {
	return callMethod(this, "setItemExpanded", [item, expanded])
}

// Updates the item in the tree view.
function updateItem(item) {
	return callMethod(this, "updateItem", [item])
}

// Inserts a new item into the tree view. The item must already exist in its parent collection.
function insertItem(item, parent) {
	return callMethod(this, "insertItem", [item, parent])
}

// Removes the item from the tree view.
function removeItem(item) {
	return callMethod(this, "removeItem", [item])
}

// Updates the entire tree view from the data source, resetting the view state.
function updateView() {
	return callMethod(this, "updateView", [])
}

// Helper function for plugin methods.
function callMethod(self, name, args) {
	let container = self.first;
	if (!container) return;   // Nothing to do
	let opt = F.loadOptions("tree", container);
	if (!opt) return;   // Tree not initialized
	return opt["_" + name].apply(null, args);
}

// Deinitializes the plugin.
function deinit() {
	return this.forEach(elem => {
		if (!elem.classList.contains(treeClass)) return;
		elem.classList.remove(treeClass);
		elem.classList.remove("ff-focus-visible")
		elem.off(treeEventClass);
		elem.replaceChildren();
		F.deleteOptions("tree", elem);
	});
}

F.registerPlugin("tree", tree, {
	defaultOptions: treeDefaults,
	methods: {
		getSelectedItems: getSelectedItems,
		selectItem: selectItem,
		deselectItem: deselectItem,
		isItemSelected: isItemSelected,
		hoverItem: hoverItem,
		isItemExpanded: isItemExpanded,
		setItemExpanded: setItemExpanded,
		updateItem: updateItem,
		insertItem: insertItem,
		removeItem: removeItem,
		updateView: updateView,
		deinit: deinit
	}
});
