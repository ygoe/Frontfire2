// ==================== Accordion plugin ====================

const accordionClass = "ff-accordion";
const accordionContentClass = "ff-accordion-content";

// Defines default options for the accordion plugin.
let accordionDefaults = {
	// Exclusive mode allows only one item to be expanded at a time.
	exclusive: false,

	// Offset to consider when scrolling to an item, when there are fixed elements at the top.
	scrollOffset: 0,

	// Element whose height to consider when scrolling to an item. Both offsets are added.
	scrollOffsetElement: null
};

// Converts all div elements in each selected element into accordion pages.
function accordion(options) {
	return this.forEach(accordion => {
		if (accordion.classList.contains(accordionClass)) return;   // Already done
		accordion.classList.add(accordionClass);
		let opt = F.initOptions("accordion", accordion, {}, options);

		let items = accordion.querySelectorAll(":scope > div");
		items.forEach(item => {
			let header = item.querySelector(":scope > div:nth-of-type(1)");
			let content = item.querySelector(":scope > div:nth-of-type(2)");

			header.classList.add("ff-accordion-header");
			header.setAttribute("tabindex", "0");

			content.classList.add(accordionContentClass);

			header.F.on("click", () => {
				if (content.clientHeight) {
					accordion.F.accordion.collapse(item);
				}
				else {
					accordion.F.accordion.expand(item);
				}
			});
			header.F.on("keydown", event => {
				if (event.key === "Enter") {
					event.preventDefault();
					header.click();
				}
			});

			let id = item.getAttribute("id");
			if (F.isSet(id) && location.hash === "#" + id) {
				// Manually set item expanded
				item.classList.add("expanded");
				content.style.height = "auto";
				F.onReady(() => {
					let offset = opt.scrollOffset || 0;
					if (opt.scrollOffsetElement) {
						offset += F(opt.scrollOffsetElement).height;
					}
					// Only scroll if there is an offset, the browser will already scroll directly to the element
					if (offset !== 0) {
						queueMicrotask(() => {
							window.scrollTo({ top: item.F.top - offset });
						});
					}
				});
			}
			else {
				accordion.F.accordion.collapse(item);
			}
		});
	});
}

function collapse(indexOrItem) {
	return this.forEach(accordion => {
		let items = accordion.querySelectorAll(":scope > div");
		if (indexOrItem === undefined) {
			// Collapse all items
			items.forEach(item => {
				accordion.F.accordion.collapse(item);
			});
			return;
		}

		let item = indexOrItem;
		if (!isNaN(item)) {
			item = items[+indexOrItem];
		}
		let content = item.querySelector("div." + accordionContentClass);
		if (!content.classList.contains("ff-fixed-height")) {
			content.style.height = content.scrollHeight + "px";   // explicitly set to current value
			F.forceReflow();   // TODO: avoid this
			content.style.height = "0";   // now animate to 0
			content.classList.add("ff-fixed-height");
			item.classList.remove("expanded");

			accordion.F.trigger("itemCollapse", { bubbles: true }, { item: item });
		}

		let id = item.getAttribute("id");
		if (F.isSet(id) && location.hash === "#" + id) {
			history.replaceState(null, null, location.pathname + location.search);
		}
	});
}

function expand(indexOrItem) {
	return this.forEach(accordion => {
		let opt = F.loadOptions("accordion", accordion);
		let items = accordion.querySelectorAll(":scope > div");
		if (indexOrItem === undefined) {
			// Expand all items
			if (!opt?.exclusive) {
				items.forEach(item => {
					accordion.F.accordion.expand(item);
				});
			}
			return;
		}

		let item = indexOrItem;
		if (!isNaN(item)) {
			item = items[+indexOrItem];
		}
		let content = item.querySelector("div." + accordionContentClass);
		if (content.clientHeight) {
			return;   // Already expanded
		}
		content.style.height = content.scrollHeight + "px";   // animate to desired height
		function onTransitionEnd(event) {
			if (event.propertyName == "height") {
				content.style.height = "auto";   // allow free layout again after animation has completed
				content.F.off("transitionend", onTransitionEnd);
				content.classList.remove("ff-fixed-height");
			}
		}
		content.F.on("transitionend", onTransitionEnd);
		item.classList.add("expanded");

		accordion.F.trigger("itemExpand", { bubbles: true }, { item: item });

		let previousItemCollapsedHeight = 0;
		if (opt?.exclusive) {
			let passedExpandedItem = false;
			items.forEach(obj => {
				if (obj !== item) {
					if (!passedExpandedItem)
						previousItemCollapsedHeight += obj.F.querySelector("div." + accordionContentClass).height;
					accordion.F.accordion.collapse(obj);
				}
				else {
					passedExpandedItem = true;
				}
			});
		}

		// If a previous item was collapsed, scroll so that the expanded header stays where it is on the screen
		//if (previousItemCollapsedHeight) {
		//	window.scrollTo({ top: window.scrollY - previousItemCollapsedHeight, behavior: "smooth" });
		//}

		// TODO: At least keep the expanded header visible if a previous item was collapsed

		// TODO: Maybe also scroll to make the new content section visible as much as possible, while not pushing its header out of view (option)

		let id = item.getAttribute("id");
		if (F.isSet(id)) {
			history.replaceState(null, null, "#" + id);
		}
	});
}

F.registerPlugin("accordion", accordion, {
	defaultOptions: accordionDefaults,
	methods: {
		collapse: collapse,
		expand: expand
	},
	selectors: [".accordion"]
});
