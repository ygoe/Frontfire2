// ==================== Menu plugin ====================

const submenuClass = "ff-submenu";
const submenuIndicatorClass = "ff-submenu-indicator";

// Converts each selected list element into a menu. Submenus are opened for nested lists.
function menu() {
	return this.forEach(menu => {
		let isVertical = menu.classList.contains("vertical");
		menu.F.children.where("li").forEach(item => {
			// Prepare top level separators
			if (item.textContent === "-") {
				item.textContent = "";
				item.classList.add("separator");
			}

			let itemHasSubmenu = item.querySelector("ul");
			let itemA = item.F.children.where("a").first;
			if (!itemA) return;   // Can't open a submenu without a link

			// Properly disable the hyperlink to remove it from tab order
			if (itemA.F.disabled)
				itemA.F.disabled = true;

			// Keyboard navigation in the menu
			itemA.F.on("keydown", event => {
				if (event.key === "ArrowUp" && isVertical ||
					event.key === "ArrowLeft" && !isVertical) {
					event.preventDefault();
					let prevItem = item;
					do {
						prevItem = prevItem.previousElementSibling ?? item.F.siblings.last;
						if (prevItem === item) {
							// This is the only enabled item, stop looping
							prevItem = null;
							break;
						}
					}
					while (prevItem !== item && skipMenuItem(prevItem));
					prevItem?.querySelector("a").focus();
				}
				else if (event.key === "ArrowDown" && isVertical ||
					event.key === "ArrowRight" && !isVertical) {
					event.preventDefault();
					let nextItem = item;
					do {
						nextItem = nextItem.nextElementSibling ?? item.F.siblings.first;
						if (nextItem === item) {
							// This is the only enabled item, stop looping
							nextItem = null;
							break;
						}
					}
					while (skipMenuItem(nextItem));
					nextItem?.querySelector("a").focus();
				}
				if (itemHasSubmenu) {
					if (event.key === "ArrowUp" && !isVertical ||
						event.key === "ArrowDown" && !isVertical ||
						event.key === "ArrowLeft" && isVertical ||
						event.key === "ArrowRight" && isVertical ||
						event.key === " ") {
						event.preventDefault();
						// Open submenu
						itemA.click();
					}
				}
			});

			if (itemHasSubmenu) {
				// Add submenu indicator
				item.dataset.ffHasSubmenu = "true";
				if (!item.querySelector("." + submenuIndicatorClass)) {
					let indicator = F.c("span");
					indicator.classList.add(submenuIndicatorClass);
					if (menu.classList.contains("submenu-arrow")) {
						if (isVertical)
							indicator.innerHTML = `<svg style="width: 5px; height: 8px;"><path d="M0,2L4,4.5L0,7Z"/></svg>`;
						else
							indicator.innerHTML = `<svg style="width: 5px; height: 5px;"><path d="M0,0L5,0L2.5,4Z"/></svg>`;
					}
					else if (menu.classList.contains("submenu-dots")) {
						if (isVertical)
							indicator.innerHTML = `<svg style="width: 5px; height: 8px;"><path d="M0,0h2v2h-2Z M0,3h2v2h-2Z M0,6h2v2h-2Z"/></svg>`;
						else
							indicator.innerHTML = `<svg style="width: 8px; height: 5px;"><path d="M0,0h2v2h-2Z M3,0h2v2h-2Z M6,0h2v2h-2Z"/></svg>`;
					}
					itemA.append(indicator);
				}

				let submenu = item.F.children.where("ul").first;
				if (submenu.classList.contains(submenuClass)) return;   // Already done
				submenu.classList.add(submenuClass, "dropdown");
				if (item.closest("nav"))
					submenu.classList.add("nav");

				// Open submenu on click
				let wasOpen = false;
				itemA.F.on("pointerdown", event => {
					wasOpen = item.classList.contains("open");
				});
				itemA.F.on("click", event => {
					if (wasOpen) {
						wasOpen = false;
						return;
					}
					event.preventDefault();
					if (itemA.F.disabled) return;
					let ddOpt = {};
					if (isVertical) {
						ddOpt["placement"] = "right-top";
					}
					submenu.F.dropdown(item, ddOpt);
					item.classList.add("open");
					submenu.F.once("close", () => {
						item.classList.remove("open");
					});
					submenu.querySelector("a")?.focus();
				});

				submenu.F.children.where("li").forEach(subitem => {
					// Prepare submenu separators
					if (subitem.textContent === "-") {
						subitem.textContent = "";
						subitem.classList.add("separator");
					}

					let subitemA = subitem.F.children.where("a").first;
					if (subitemA) {
						// Properly disable the hyperlink to remove it from tab order
						if (subitemA.F.disabled)
							subitemA.F.disabled = true;

						// Keyboard navigation in the submenu
						subitemA.F.on("keydown", event => {
							if (event.key === "Escape") {
								event.preventDefault();
								submenu.F.dropdown.close();
								itemA.focus();
							}
							else if (event.key === "ArrowUp") {
								event.preventDefault();
								let prevItem = subitem;
								do {
									prevItem = prevItem.previousElementSibling ?? subitem.F.siblings.last;
									if (prevItem === subitem) {
										// This is the only enabled item, stop looping
										prevItem = null;
										break;
									}
								}
								while (skipMenuItem(prevItem));
								prevItem?.querySelector("a").focus();
							}
							else if (event.key === "ArrowDown") {
								event.preventDefault();
								let nextItem = subitem;
								do {
									nextItem = nextItem.nextElementSibling ?? subitem.F.siblings.first;
									if (nextItem === subitem) {
										// This is the only enabled item, stop looping
										nextItem = null;
										break;
									}
								}
								while (skipMenuItem(nextItem));
								nextItem?.querySelector("a").focus();
							}
							else if (event.key === "ArrowLeft" && !isVertical) {
								event.preventDefault();
								let prevItem = item;
								do {
									prevItem = prevItem.previousElementSibling ?? item.F.siblings.last;
									if (prevItem === item) {
										// This is the only enabled item, stop looping
										prevItem = null;
										break;
									}
								}
								while (skipMenuItem(prevItem));
								if (prevItem) {
									submenu.F.dropdown.close();
									if (prevItem.dataset.ffHasSubmenu)
										prevItem.querySelector("a").click();
									else
										prevItem.querySelector("a").focus();
								}
							}
							else if (event.key === "ArrowRight" && !isVertical) {
								event.preventDefault();
								let nextItem = item;
								do {
									nextItem = nextItem.nextElementSibling ?? item.F.siblings.first;
									if (nextItem === item) {
										// This is the only enabled item, stop looping
										nextItem = null;
										break;
									}
								}
								while (skipMenuItem(nextItem));
								if (nextItem) {
									submenu.F.dropdown.close();
									if (nextItem.dataset.ffHasSubmenu)
										nextItem.querySelector("a").click();
									else
										nextItem.querySelector("a").focus();
								}
							}
						});
					}
				});

				// Close submenu when clicking on one of its items
				submenu.F.querySelectorAll("li > a:not(.stay-open)").forEach(a => {
					a.F.on("click", () => {
						submenu.F.dropdown.close();
					});
				});
			}
		});

		// Replace # href with a true no-op
		menu.F.querySelectorAll("li > a[href='#']").setAttribute("href", "javascript:");
	});
}

function skipMenuItem(item) {
	if (!item)
		return false;
	let itemA = item.F.children.where("a").first;
	if (!itemA)
		return true;
	if (itemA.F.disabled)
		return true;
	return false;
}

F.registerPlugin("menu", menu, {
	selectors: [".menu"]
});
