// ==================== Tabs plugin ====================

const tabHeadersClass = "ff-tab-headers";
const tabPagesClass = "ff-tab-pages";

// Defines default options for the tabs plugin.
let tabsDefaults = {
};

// Converts all div elements in each selected element into tab pages.
// The tab page headers are read from the div elements' title attribute.
function tabs(options) {
	return this.forEach(container => {
		if (container.querySelector(":scope > div." + tabHeadersClass)) return;   // Already done
		let opt = F.initOptions("tabs", container, {}, options);
		opt._addTab = addTab;

		let pageDivs = container.F.children.where("div");

		let headers = F.c("div");
		headers.classList.add(tabHeadersClass);
		container.append(headers);
		let pages = F.c("div");
		pages.classList.add(tabPagesClass);
		container.append(pages);

		let activePage = container.querySelector(":scope > div.active");
		pageDivs.forEach(page => addTab(page, activePage));

		function addTab(page, activePage) {
			let header = F.c("a");
			header.href = "javascript:";
			header.setAttribute("tabindex", "-1");   // remove from tab order
			header.textContent = page.getAttribute("title");
			if (!header.textContent)
				header.textContent = "~";
			headers.append(header);
			page.removeAttribute("title");
			if (page.dataset.titleHtml) {
				header.innerHTML = page.dataset.titleHtml;
				delete page.dataset.titleHtml;
			}
			if (page.dataset.headerClass) {
				header.F.classList.add(page.dataset.headerClass);
				delete page.dataset.headerClass;
			}
			pages.append(page);
			if (!activePage) {
				// No page preselected: look for already added active page
				activePage = container.querySelector(":scope > div." + tabPagesClass + " > .active");
			}
			if (!activePage || activePage === page) {
				// No page preselected and none already added: activate this first page
				header.classList.add("active");
				header.removeAttribute("tabindex");   // add to tab order
				page.classList.add("active");
			}
			else {
				page.classList.remove("active");   // in case of duplicates
			}
			let touchDown = false;
			header.F.on("pointerdown", event => {
				event.preventDefault();
				if (event.pointerType === "mouse" && event.button !== 0) {
					// Ignore other-than-left mouse button
					return;
				}
				touchDown = false;
				if (event.pointerType === "touch") {
					// Don't select the tab when touching, it might be a scroll gesture.
					// For touch input, only select the tab on pointerup.
					touchDown = true;
					return;
				}
				header.focus();
				header.blur();
				container.F.tabs.activeTab = page;
			});
			header.F.on("pointerup", event => {
				event.preventDefault();
				if (event.pointerType === "touch" && touchDown) {
					touchDown = false;
					header.focus();
					header.blur();
					container.F.tabs.activeTab = page;
				}
			});
			header.F.on("click", event => {
				event.preventDefault();
			});
			header.F.on("keydown", event => {
				if (event.key === "ArrowLeft" && !event.ctrlKey && !event.altKey) {
					event.preventDefault();
					selectTab(header.previousElementSibling);
				}
				if (event.key === "ArrowRight" && !event.ctrlKey && !event.altKey) {
					event.preventDefault();
					selectTab(header.nextElementSibling);
				}
				if (event.key === "Home" && !event.ctrlKey && !event.altKey) {
					event.preventDefault();
					selectTab(header.parentElement.firstElementChild);
				}
				if (event.key === "End" && !event.ctrlKey && !event.altKey) {
					event.preventDefault();
					selectTab(header.parentElement.lastElementChild);
				}
			});
		}

		function selectTab(header) {
			if (header) {
				header.focus();
				container.F.tabs.activeTabIndex = header.F.index;
			}
		}
	});
}

// Adds a new tab page and header from a page div element.
//
// page: The new tab page to add. It does not have to be added to the document yet.
function addTab(page) {
	let tabs = this.first;
	let opt = F.loadOptions("tabs", tabs);
	if (page instanceof ArrayList) {
		page = page.first;
	}
	opt && opt._addTab(page);
}

// Removes a tab page and header.
//
// indexOrPage: The tab page to remove, either by index or the page.
function removeTab(indexOrPage) {
	let container = this.first;
	let headers = container.querySelector(":scope > div." + tabHeadersClass);
	let pages = container.querySelector(":scope > div." + tabPagesClass);
	let index = indexOrPage;
	if (!F.isSet(index)) {
		index = getActiveTabIndex.call(container.F);
		if (index === -1)
			return;   // No active tab
	}
	if (isNaN(index)) {
		index = indexOrPage.F.index;
	}
	let count = pages.childElementCount;
	if (index < 0)
		index += count;
	let header = headers.children[index];
	let page = pages.children[index];
	header.remove();
	page.remove();
	if (page.classList.contains("active")) {
		// Activate another tab
		let newIndex = Math.min(index, count - 2);
		if (newIndex >= 0)
			container.F.tabs.activeTabIndex = newIndex;
	}
}

// Moves a tab to another position.
function moveTab(indexOrPage, newIndex) {
	let container = this.first;
	let headers = container.querySelector(":scope > div." + tabHeadersClass);
	let pages = container.querySelector(":scope > div." + tabPagesClass);
	let index = indexOrPage;
	if (isNaN(index)) {
		index = indexOrPage.F.index;
	}
	if (index < 0)
		index += pages.childElementCount;
	let header = headers.children[index];
	let page = pages.children[index];
	if (newIndex < 0)
		newIndex += pages.childElementCount;
	let destHeader = headers.children[newIndex];
	let destPage = pages.children[newIndex];
	if (!destHeader) {
		if (newIndex > 0) {
			// Move to end
			header.F.insertAfter(headers.lastElementChild);
			page.F.insertAfter(pages.lastElementChild);
		}
		else {
			// Move to beginning
			header.F.insertBefore(headers.firstElementChild);
			page.F.insertBefore(pages.firstElementChild);
		}
	}
	else if (newIndex > index) {
		// Move after newIndex
		header.F.insertAfter(destHeader);
		page.F.insertAfter(destPage);
	}
	else if (newIndex < index) {
		// Move before newIndex
		header.F.insertBefore(destHeader);
		page.F.insertBefore(destPage);
	}
}

// Gets the title of a tab page in a tab container.
//
// indexOrPage: The tab page, either by index or the page.
// title: Sets the title.
function title(indexOrPage, title) {
	let container = this.first;
	let header = getTabHeader(container, indexOrPage);
	if (!header)
		return;   // Tab not found

	// Getter
	if (title === undefined) {
		return header.textContent;
	}

	// Setter
	header.textContent = title;
	if (!header.textContent)
		header.textContent = "~";
}

// Gets the title HTML of a tab page in a tab container.
//
// indexOrPage: The tab page, either by index or the page.
// title: Sets the title HTML code.
function titleHTML(indexOrPage, title) {
	let container = this.first;
	let header = getTabHeader(container, indexOrPage);

	// Getter
	if (title === undefined) {
		return header.innerHTML;
	}

	// Setter
	header.innerHTML = title;
}

// Gets the CSS class list of a tab header in a tab container.
//
// indexOrPage: The tab page, either by index or the page.
function headerClassList(indexOrPage) {
	let container = this.first;
	let header = getTabHeader(container, indexOrPage);
	return header.F.classList;
}

function getTabHeader(container, indexOrPage) {
	let headers = container.querySelector(":scope > div." + tabHeadersClass);
	let index = indexOrPage;
	if (isNaN(index)) {
		index = indexOrPage.F.index;
	}
	if (index < 0)
		index += pages.childElementCount;
	let header = headers.children[index];
	return header;
}

// Gets the active page in a tab container.
function getActiveTab() {
	return this.querySelector(":scope > div." + tabPagesClass + " > .active").first;
}

// Sets the active page in a tab container.
//
// page: The active page in each selected tab container.
function setActiveTab(page) {
	let container = this.first;
	if (!container) return;
	let headers = container.querySelector(":scope > div." + tabHeadersClass);
	let pages = container.querySelector(":scope > div." + tabPagesClass);
	let index = page.F.index;
	setActiveTabInternal(container, headers, pages, index, page);
}

// Gets the index of the active page in a tab container.
function getActiveTabIndex() {
	return this.querySelector(":scope > div." + tabPagesClass + " > .active").index;
}

// Sets the active page in a tab container by its index.
//
// index: The index of the active page in each selected tab container.
function setActiveTabIndex(index) {
	this.forEach(container => {
		let headers = container.querySelector(":scope > div." + tabHeadersClass);
		let pages = container.querySelector(":scope > div." + tabPagesClass);
		if (index < 0)
			index += pages.childElementCount;
		let page = pages.children[index];
		setActiveTabInternal(container, headers, pages, index, page);
	});
}

function setActiveTabInternal(container, headers, pages, index, page) {
	if (page && !page.classList.contains("active")) {
		headers.F.children.setAttribute("tabindex", "-1");   // remove from tab order
		headers.F.children.classList.remove("active");
		headers.children[index].classList.add("active");
		headers.children[index].removeAttribute("tabindex");   // add to tab order
		pages.F.children.classList.remove("active");
		page.classList.add("active");
		container.F.trigger("activeTabChange");
	}
}

// Gets all page div elements.
function getPages() {
	let container = this.first;
	let pages = container.querySelector(":scope > div." + tabPagesClass);
	return new ArrayList(pages.children);
}

F.registerPlugin("tabs", tabs, {
	defaultOptions: tabsDefaults,
	methods: {
		addTab: addTab,
		removeTab: removeTab,
		moveTab: moveTab,
		title: title,
		titleHTML: titleHTML,
		headerClassList: headerClassList,
		activeTab: {
			get: getActiveTab,
			set: setActiveTab
		},
		activeTabIndex: {
			get: getActiveTabIndex,
			set: setActiveTabIndex
		},
		pages: {
			get : getPages
		}
	},
	selectors: [".tabs"]
});


// ==================== Template tabs plugin ====================

// Defines default options for the templateTabs plugin.
let templateTabsDefaults = {
	// The template element that contains a tab page to use for all records.
	// Specified as CSS selector or Node.
	template: undefined,

	// A function that is called for each added tab. It gets the following arguments:
	// - The tab page element
	// - The record object
	// - The original tabs container element as specified for the plugin.
	// If undefined, the standard Frontfire autostart is applied. If null, nothing happens.
	init: undefined,

	// The form field that contains all records as JSON string. If set, the tab pages are created
	// at load time. Can be set later. Will be reused for saving tabs data to a JSON field for form
	// submit.
	jsonField: undefined
};

// Sets up template tab pages for a tab container.
function templateTabs(options) {
	let tabs = this.first;
	if (!tabs) return;   // Nothing to do
	let opt = F.loadOptions("templateTabs", tabs);
	if (opt) return tabs.F.templateTabs;   // Already created

	opt = F.initOptions("templateTabs", tabs, {}, options);
	opt._addTab = addTab;
	opt._addTabs = addTabs;
	opt._loadJSON = loadJSON;
	opt._getRecord = getRecord;
	opt._getRecords = getRecords;
	opt._saveJSON = saveJSON;

	// Load initially provided JSON data
	if (opt.jsonField)
		loadJSON();

	function createTab(record) {
		let template = F(opt.template).first;
		if (!template)
			throw new Error("Tab page template not found: " + opt.template);
		let tabPage = F.c("div");
		let tabContent = template.content.children.F.clone();
		tabPage.F.append(tabContent);
		if (record) {
			tabPage.querySelectorAll("[data-name]").forEach(field => {
				let fieldName = field.dataset.name;
				if (F.isSet(record[fieldName])) {
					if (field.F.nodeNameLower === "span") {
						field.textContent = record[fieldName];
					}
					else if (field.F.nodeNameLower === "table") {
						field.F.templateRows();
						field.F.templateRows.addRows(record[fieldName]);
					}
					else if (field.matches("input[type=radio]")) {
						// TODO: Assign unique name attributes to preserve the radio groups, add the form="" attribute to exclude the fields from submit, check the correct field
					}
					else {
						field.F.value(record[fieldName]);
					}
				}
			});
			F.internalData.set(tabPage, "template-data", record);
		}
		// Tab page must be added to the tab so that the init function can set the tab title
		// (which it should do because nobody else does it)
		tabs.F.tabs.addTab(tabPage);
		if (opt.init) {
			opt.init(tabPage, record, tabs);
		}
		else if (opt.init === undefined) {
			tabPage.F.autostart();
		}
		return tabPage;
	}

	function addTab(record) {
		return createTab(record);
	}

	function addTabs(records) {
		return records.map(record => addTab(record));
	}

	function loadJSON(jsonField) {
		if (jsonField)
			opt.jsonField = jsonField;
		let recordsJson = F(opt.jsonField).value();
		if (!recordsJson) return [];
		let records = JSON.parse(recordsJson);
		return addTabs(records);
	}

	function getRecord(tab) {
		let record = F.internalData.get(tab, "template-data", {}, true);
		let fields = tab.querySelectorAll("[data-name]").F.except(tab.F.querySelectorAll("table[data-name] [data-name]"));
		fields.forEach(field => {
			let fieldName = field.dataset.name;
			if (field.F.nodeNameLower === "span") {
				// do nothing (readonly)
			}
			else if (field.F.nodeNameLower === "table") {
				record[fieldName] = field.F.templateRows.getRecords();
			}
			else if (field.matches("input[type=radio]")) {
				if (field.checked)
					record[fieldName] = field.value;
			}
			else {
				record[fieldName] = field.F.value();   // for type=number: Number or null (empty) or NaN (invalid input)
			}
		});
		return record;
	}

	function getRecords() {
		let records = [];
		tabs.F.tabs.pages.forEach(tab => {
			let fields = tab.querySelectorAll("[data-name]").F.except(tab.F.querySelectorAll("table[data-name] [data-name]"));
			if (fields.length > 0)
				records.push(getRecord(tab));
		});
		return records;
	}

	function saveJSON(jsonField) {
		if (!jsonField)
			jsonField = opt.jsonField;
		if (!jsonField)
			throw new Error("No target JSON field specified.");
		let records = getRecords();
		let recordsJson = JSON.stringify(records);
		F(jsonField).value(recordsJson);
	}

	// Return current plugin instance
	return tabs.F.templateTabs;
}

// Adds a new tab page with the specified record data.
function templateAddTab(record) {
	return templateCallMethod(this, "addTab", [record])
}

// Adds new tab pages with the specified record data.
function templateAddTabs(records) {
	return templateCallMethod(this, "addTabs", [records])
}

// Adds new tab pages with the data from the specified JSON form field, and remembers the field
// for later updating.
function templateLoadJSON(jsonField) {
	return templateCallMethod(this, "loadJSON", [jsonField])
}

// Returns the object with the data from the specified tab page fields.
function templateGetRecord(tab) {
	return templateCallMethod(this, "getRecord", [tab])
}

// Returns an Array of objects with the data from the tab page fields.
function templateGetRecords() {
	return templateCallMethod(this, "getRecords", [])
}

// Saves the data from the tab page fields as JSON to a form field.
function templateSaveJSON(jsonField) {
	return templateCallMethod(this, "saveJSON", [jsonField])
}

// Helper function for plugin methods.
function templateCallMethod(self, name, args) {
	let tabs = self.first;
	if (!tabs) return;   // Nothing to do
	let opt = F.loadOptions("templateTabs", tabs);
	if (!opt) return;   // Templates not initialized
	return opt["_" + name].apply(null, args);
}

F.registerPlugin("templateTabs", templateTabs, {
	defaultOptions: templateTabsDefaults,
	methods: {
		addTab: templateAddTab,
		addTabs: templateAddTabs,
		loadJSON: templateLoadJSON,
		getRecord: templateGetRecord,
		getRecords: templateGetRecords,
		saveJSON: templateSaveJSON
	}
});
