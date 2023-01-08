// ==================== Table overflowColumns plugin ====================

const overflowCollapsibleColumnClass = "collapsible-column";
const overflowColumnClass = "overflow-column";
const overflowColumnsButtonClass = "overflow-button";
const overflowColumnsEventClass = ".ff-overflow-columns";

// Defines default options for the overflowColumns plugin.
let overflowColumnsDefaults = {
};

// Sets up the column overflow feature for tables.
function overflowColumns(options) {
	return this.forEach(table => {
		if (!table.F.hasEventListeners("click" + overflowColumnsEventClass)) {
			let opt = F.initOptions("overflowColumns", table, {}, options);
			opt._overflowTableColumns = overflowTableColumns;

			overflowTableColumns();

			table.F.on("click" + overflowColumnsEventClass, event => {
				let overflowButton = F.findEventTarget(event, "." + overflowColumnsButtonClass);
				if (overflowButton) {
					let row = event.target.closest("tr");
					showOverflowColumnsModal(row);
				}
			});
			table.F.on("change input", () => {
				// Input element width may have changed: update table overflow columns.
				// This needs only be done if the element is still in the original table, not in an
				// overflow modal. But in those cases the event wouldn't bubble through this table
				// anyway, so it doesn't need to be regarded here.
				// The selectable button is updated in the change event as well, so we need to delay
				// the layouting until after this is done.
				queueMicrotask(overflowTableColumns);
			});

			// Updates the overflow column visibilities for the table.
			function overflowTableColumns() {
				let columns = table.querySelectorAll("thead th");
				for (let i = 0; i < columns.length; i++) {
					let column = columns[i];
					if (column.classList.contains(overflowCollapsibleColumnClass)) {
						column.F.show();
						table.F.querySelectorAll("tbody tr td:nth-child(" + (i + 1) + ")").show();
					}
				}
				table.F.querySelectorAll("." + overflowColumnClass).hide();

				// Find all collapsible columns, from right to left
				let collapsibleColumns = new ArrayList();
				for (let i = columns.length - 1; i >= 0; i--) {
					let column = columns[i];
					if (column.classList.contains(overflowCollapsibleColumnClass))
						collapsibleColumns.add(column);
				}

				// Sort collapsible columns by their defined priority
				// (lower value comes first, unspecified columns are collapsed last)
				collapsibleColumns.sortBy(c => Number(c.dataset.collapsePriority || Number.MAX_SAFE_INTEGER));
				//console.log("collapsibleColumns:", collapsibleColumns.array);

				// Find the closest parent element that has a width, i.e. is like 'display: block'
				let widthParent = table.parentElement;
				let parentContentWidth = widthParent.F.contentWidth;
				while (isNaN(parentContentWidth)) {
					widthParent = widthParent.parentElement;
					if (!widthParent) return;   // No widths available (strange)
					parentContentWidth = widthParent.F.contentWidth;
				}

				// Collapse as many columns as necessary
				for (let column of collapsibleColumns) {
					//console.log("table widths:", table.F.borderWidth, parentContentWidth, widthParent);
					// See https://stackoverflow.com/q/60150110/143684
					if (table.F.borderWidth <= parentContentWidth)
						break;

					// Table still too wide, hide this column in all rows
					//await F.sleep(500);
					column.F.hide();
					let index = column.F.index;
					table.F.querySelectorAll("tbody tr td:nth-child(" + (index + 1) + ")").hide();
					table.F.querySelectorAll("." + overflowColumnClass).show();
				}
				//console.log("final table width:", table.F.borderWidth);
			}

			// Shows a modal that contains the hidden overflow fields from a table row.
			// The fields are put back to the table when the modal is closed.
			function showOverflowColumnsModal(row) {
				// Create temporary modal element
				let modal = F.c("div");
				modal.classList.add("modal");
				modal.F.style = { display: "flex", flexDirection: "column" };
				let modalContent = F.c("div");
				modalContent.F.style = { flexGrow: "1", overflowY: "auto" };
				modal.append(modalContent);

				let columns = table.querySelectorAll("thead th");

				// Move fields and other content from hidden columns into the modal
				let movedFields = [];
				let haveDialogContent = false;
				for (let i = 0; i < columns.length; i++) {
					let column = columns[i];
					if (column.classList.contains(overflowCollapsibleColumnClass) && !column.F.visible) {
						let cell = row.children[i];
						let content = cell.children.F;   // make static copy while we're moving elements (children is a live collection)
						let formRowDiv = F.c("div");
						formRowDiv.classList.add("form-row");

						if (content.length === 0) {
							// Content is no element: just copy cell text below column header text (if any is non-empty)
							let columnText = column.textContent;
							let text = row.children[i].textContent;
							if (columnText.trim() !== "" || text.trim() !== "") {
								haveDialogContent = true;
								let t = F.c("div");
								t.classList.add("label");
								t.textContent = columnText;
								formRowDiv.append(t);
								t = F.c("div");
								t.textContent = text;
								formRowDiv.append(t);
							}
						}
						else if (content.first.matches("input[type=checkbox]") ||
							content.first.matches("label.empty") && content.first.firstElementChild.matches("input[type=checkbox]")) {
							// Move checkbox with column header into a single label element
							movedFields.push({ content: content.array, parent: cell });
							haveDialogContent = true;
							let label = F.c("label");
							formRowDiv.append(label);
							content.appendTo(label);
							label.append(" " + column.textContent);
						}
						else {
							// Move content below column header text (if any is visible)
							let isAnyVisible = content.any(e => e.F.visible);
							if (isAnyVisible) {
								movedFields.push({ content: content.array, parent: cell });
								haveDialogContent = true;
								let label = F.c("div");
								label.classList.add("label");
								label.textContent = column.textContent;
								formRowDiv.append(label);

								// Some content elements need preparation before being relocated
								content.where("input[type=submit], button[type=submit]").forEach(child => {
									// Keep the button associated to its containing form, if any
									let form = child.closest("form");
									if (form)
										child.setAttribute("form", form.F.assignId("form"));
								});
								content.appendTo(formRowDiv);
							}
						}

						if (formRowDiv.children.length > 0)
							modalContent.append(formRowDiv);
					}
				}
				if (!haveDialogContent) {
					let div = F.c("div");
					div.textContent = "Keine weiteren Eigenschaften in dieser Zeile.";   // TODO: Localisation
					modalContent.append(div);
				}

				// Save space around first/last field
				modalContent.firstElementChild.classList.add("no-top-margin");
				modalContent.lastElementChild.classList.add("no-bottom-margin");

				// Add buttons below input fields
				let buttonsDiv = F.c("div");
				buttonsDiv.classList.add("buttons");
				modal.append(buttonsDiv);
				let closeButton = F.c("button");
				closeButton.type = "button";
				closeButton.classList.add("default");
				closeButton.textContent = "Schließen";   // TODO: Localisation (use from modal?)
				buttonsDiv.append(closeButton);
				closeButton.F.on("click", () => {
					modal.F.modal.close();
				});

				modal.F.on("close", function () {
					// Move elements from the modal back to their original place
					movedFields.forEach(item => {
						// item.content is an Array with the moved elements
						F(item.content).appendTo(item.parent);
					});

					// Clean up: Remove temporary modal element
					modal.remove();

					// Update columns for the column widths may have been changed with new data from the modal
					overflowTableColumns();
				});

				modal.F.modal();
				// TODO: Use static F.modal?
			}
		}
	});
}

// Updates the overflow column visibilities for a table. This needs to be called after updating the
// contents of the table, like adding/removing rows, changing data or showing additional columns.
// It is called automatically after the window has been resized.
function overflowColumnsUpdate() {
	this.forEach(table => {
		let opt = F.loadOptions("overflowColumns", table);
		opt && opt._overflowTableColumns();
	});
}

F.registerPlugin("overflowColumns", overflowColumns, {
	defaultOptions: overflowColumnsDefaults,
	methods: {
		update: overflowColumnsUpdate
	},
	selectors: [
		"table.overflow-columns"
	]
});

F(window).on("resize", () => {
	// Update the columns overflow for all initialized tables
	F("table.overflow-columns").overflowColumns.update();
});


// ==================== Table templateRows plugin ====================

// Defines default options for the templateRows plugin.
let templateRowsDefaults = {
	// The template element that contains a table row to use for all records.
	// Specified as CSS selector or Node.
	template: undefined,

	// A function that is called for each added row. It gets the following arguments:
	// - The <tr> element
	// - The record object
	// - The original table element as specified for the plugin (table or tbody).
	// If undefined, the standard Frontfire autostart is applied. If null, nothing happens.
	init: undefined,

	// The form field that contains all records as JSON string. If set, the table rows are created
	// at load time. Can be set later. Will be reused for saving table data to a JSON field for form
	// submit.
	jsonField: undefined
};

// Sets up template data rows for a table.
function templateRows(options) {
	let table = this.first;
	if (!table) return;   // Nothing to do
	let opt = F.loadOptions("templateRows", table);
	if (opt) return table.F.templateRows;   // Already created

	opt = F.initOptions("templateRows", table, {}, options);
	opt._addRow = addRow;
	opt._addRows = addRows;
	opt._loadJSON = loadJSON;
	opt._getRecord = getRecord;
	opt._getRecords = getRecords;
	opt._saveJSON = saveJSON;

	// Find rows container
	// We assume we come here with a <table> or <tbody> element. Use the tbody. For a table, try
	// to find the first tbody and use that if it exists; otherwise, stick with the table.
	let rowsContainer = table;
	if (rowsContainer.F.nodeNameLower === "table") {
		let tbody = rowsContainer.querySelector("tbody");
		if (tbody)
			rowsContainer = tbody;
	}

	// Load initially provided JSON data
	if (opt.jsonField)
		loadJSON();

	function createRow(record) {
		let template = F(opt.template).first;
		if (!template)
			throw new Error("Table row template not found: " + opt.template);
		let row = template.content.firstElementChild.cloneNode(true);
		if (record) {
			row.querySelectorAll("[data-name]").forEach(field => {
				let fieldName = field.dataset.name;
				if (F.isSet(record[fieldName])) {
					if (field.F.nodeNameLower === "span") {
						field.textContent = record[fieldName];
					}
					else if (field.matches("input[type=radio]")) {
						// TODO: Assign unique name attributes to preserve the radio groups, add the form="" attribute to exclude the fields from submit, check the correct field
					}
					else {
						field.F.value(record[fieldName]);
					}
				}
			});
			F.internalData.set(row, "template-data", record);
		}
		return row;
	}

	function initRow(row, record) {
		if (opt.init) {
			opt.init(row, record, table);
		}
		else if (opt.init === undefined) {
			row.F.autostart();
		}
	}

	function addRow(record) {
		let row = createRow(record);
		rowsContainer.append(row);
		initRow(row, record);
		rowsContainer.closest("table.overflow-columns")?.F.overflowColumns.update();
		return row;
	}

	function addRows(records) {
		// Collect all rows in a document fragment to minimise the number of DOM changes
		let fragment = new DocumentFragment();
		let rows = [];
		records.forEach(record => {
			let row = createRow(record);
			fragment.append(row);
			rows.push([row, record]);
		});
		rowsContainer.append(fragment);
		rows.forEach(entry => initRow(entry[0], entry[1]));
		rowsContainer.closest("table.overflow-columns")?.F.overflowColumns.update();
		return Array.from(fragment.children);
	}

	function loadJSON(jsonField) {
		if (jsonField)
			opt.jsonField = jsonField;
		let recordsJson = F(opt.jsonField).value();
		if (!recordsJson) return [];
		let records = JSON.parse(recordsJson);
		return addRows(records);
	}

	function getRecord(row) {
		let record = F.internalData.get(row, "template-data", {}, true);
		let fields = row.querySelectorAll("[data-name]");
		fields.forEach(field => {
			let fieldName = field.dataset.name;
			if (field.F.nodeNameLower === "span") {
				// do nothing (readonly)
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
		return rowsContainer.F.children
			.having("[data-name]")
			.select(row => getRecord(row))
			.array;
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
	return table.F.templateRows;
}

// Appends a new table row with the specified record data.
function templateAddRow(record) {
	return templateCallMethod(this, "addRow", [record])
}

// Appends new table rows with the specified record data.
function templateAddRows(records) {
	return templateCallMethod(this, "addRows", [records])
}

// Appends new table rows with the data from the specified JSON form field, and remembers the field
// for later updating.
function templateLoadJSON(jsonField) {
	return templateCallMethod(this, "loadJSON", [jsonField])
}

// Returns the object with the data from the specified table row fields.
function templateGetRecord(row) {
	return templateCallMethod(this, "getRecord", [row])
}

// Returns an Array of objects with the data from the table row fields.
function templateGetRecords() {
	return templateCallMethod(this, "getRecords", [])
}

// Saves the data from the table row fields as JSON to a form field.
function templateSaveJSON(jsonField) {
	return templateCallMethod(this, "saveJSON", [jsonField])
}

// Helper function for plugin methods.
function templateCallMethod(self, name, args) {
	let table = self.first;
	if (!table) return;   // Nothing to do
	let opt = F.loadOptions("templateRows", table);
	if (!opt) return;   // Templates not initialized
	return opt["_" + name].apply(null, args);
}

F.registerPlugin("templateRows", templateRows, {
	defaultOptions: templateRowsDefaults,
	methods: {
		addRow: templateAddRow,
		addRows: templateAddRows,
		loadJSON: templateLoadJSON,
		getRecord: templateGetRecord,
		getRecords: templateGetRecords,
		saveJSON: templateSaveJSON
	}
});


// ==================== Table first/last row/column update functions ====================

// Sets the first-column and last-column class to the first/last visible column in a table, if
// following columns are hidden. This ensures (together with CSS rules) that the border and padding
// of the last visible column is correct.
F.prototype.updateFirstLastColumn = function () {
	return this.forEach(table => {
		// TODO: Ignore nested tables
		table.querySelectorAll("tr").forEach(tr => {
			let lastColumn, lastVisibleColumn, seenFirstVisibleColumn, isFirstColumn = true;
			tr.querySelectorAll("th, td").forEach(td => {
				td.classList.remove("first-column", "last-column", "hidden-column");
				lastColumn = td;
				if (td.F.visible) {
					if (!seenFirstVisibleColumn) {
						seenFirstVisibleColumn = true;
						if (!isFirstColumn)
							td.classList.add("first-column");
					}
					lastVisibleColumn = td;
				}
				else {
					td.classList.add("hidden-column");
				}
				isFirstColumn = false;
			});
			if (lastColumn && lastVisibleColumn && lastColumn !== lastVisibleColumn)
				lastVisibleColumn.classList.add("last-column");
		});
	});
};

// Sets the first-row and last-row class to the first/last visible row in a table, if preceding/
// following rows are hidden. This ensures (together with CSS rules) that the border and padding of
// the first and last visible row is correct.
F.prototype.updateFirstLastRow = function () {
	return this.forEach(table => {
		let lastRow, lastVisibleRow, seenFirstVisibleRow, isFirstRow = true;
		// TODO: Ignore nested tables
		table.querySelectorAll("tr").forEach(tr => {
			tr.classList.remove("first-row", "last-row", "hidden-row");
			lastRow = tr;
			if (tr.F.visible) {
				if (!seenFirstVisibleRow) {
					seenFirstVisibleRow = true;
					if (!isFirstRow)
						tr.classList.add("first-row");
				}
				lastVisibleRow = tr;
			}
			else {
				tr.classList.add("hidden-row");
			}
			isFirstRow = false;
		});
		if (lastRow && lastVisibleRow && lastRow !== lastVisibleRow)
			lastVisibleRow.classList.add("last-row");
	});
};
