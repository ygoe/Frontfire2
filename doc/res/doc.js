// ==================== Debug config ====================
const logParser = false;


// ==================== Frontfire autostart ====================

// Run autostart now because in the documentation, the Frontfire script might be included at the top
// of <body> and most elements are not set up yet.
F("html").autostart();


// ==================== Dark theme ====================

// Set up dark theme toggle switch
F("header").append('<div class="spacer">');
let darkThemeBox = F(`<div id="dark-theme-box">
	<svg class="light-icon" viewBox="0 0 15 15"><path d="M6.75 12L6.75 15L8.25 15L8.25 12L6.75 12ZM3.79 10.15L1.67 12.27L2.73 13.33L4.85 11.21L3.79 10.15ZM10.15 11.21L12.27 13.33L13.33 12.27L11.21 10.15L10.15 11.21ZM7.5 4.25C9.29 4.25 10.75 5.71 10.75 7.5C10.75 9.29 9.29 10.75 7.5 10.75C5.71 10.75 4.25 9.29 4.25 7.5C4.25 5.71 5.71 4.25 7.5 4.25ZM3 6.75L-0 6.75L-0 8.25L3 8.25L3 6.75ZM12 8.25L15 8.25L15 6.75L12 6.75L12 8.25ZM11.21 4.85L13.33 2.73L12.27 1.67L10.15 3.79L11.21 4.85ZM4.85 3.79L2.73 1.67L1.67 2.73L3.79 4.85L4.85 3.79ZM8.25 3L8.25 -0L6.75 0L6.75 3L8.25 3Z"/></svg>
	<span id="dark-theme-switch"></span>
	<svg class="dark-icon" viewBox="0 0 15 15"><path d="M13.61 12.99C12.27 14.24 10.47 15 8.5 15C4.36 15 1 11.64 1 7.5C1 3.36 4.36 0 8.5 0C9.06 0 9.6 0.06 10.12 0.18C8.24 1.43 7 3.57 7 6C7 9.73 9.93 12.79 13.61 12.99Z"/></svg>
</div>`);
F("header").append(darkThemeBox);

F("#dark-theme-switch").toggleSwitch();
let darkThemeSwitch = F("#dark-theme-switch").toggleSwitch;
let darkSchemeMql = window.matchMedia("(prefers-color-scheme: dark)");

// Disable dark theme transitions until after the page has been set up
F("html").classList.add("no-transitions");
setTimeout(() => F("html").classList.remove("no-transitions"), 100);

// Handle user selection
F("#dark-theme-switch").on("change", () => {
	applyTheme(darkThemeSwitch.state);
	// Only save selection if it's different from the system theme; otherwise, delete it
	let newTheme = darkThemeSwitch.state === darkSchemeMql.matches ? null : darkThemeSwitch.state ? "dark" : "light";
	setLocalStorage("color-theme", newTheme);
});

// Listen to system dark theme changes
darkSchemeMql.addEventListener("change", onDarkSchemeChanged);
function onDarkSchemeChanged(e) {
	applyTheme(e.matches);
	// Always clear user selection after live system change
	setLocalStorage("color-theme", null);
}

// Initialise dark theme from user selection/system theme
let colorTheme = getLocalStorage("color-theme");
if (colorTheme !== null && colorTheme === (darkSchemeMql.matches ? "dark" : "light")) {
	// Set user selection now matches system theme, system theme must have been changed since last
	// user selection on this page: clear user selection
	setLocalStorage("color-theme", null);
	colorTheme = null;
}
if (colorTheme !== null) {
	// Apply user selection
	applyTheme(colorTheme === "dark");
}
else {
	// No user selection available: apply system theme
	applyTheme(darkSchemeMql.matches);
}

function applyTheme(dark) {
	darkThemeSwitch.state = dark;
	F("html").classList.toggle("dark", dark);
	F("html").on("transitionend!", () => F("meta[name=theme-color]").setAttribute("content", F("header").computedStyle.backgroundColor));
	F("html").trigger("darkthemechange");
}

function setLocalStorage(key, value) {
	try {
		if (F.isSet(value))
			localStorage.setItem(key, value);
		else
			localStorage.removeItem(key);
	}
	catch (error) {
		console.error(error);
	}
}

function getLocalStorage(key) {
	try {
		return localStorage.getItem(key);
	}
	catch (error) {
		console.error(error);
	}
	return null;
}


// ==================== Side navigation ====================

// Create the side navigation
const aside = document.querySelector("aside");
const asideLinks = new Map();
if (aside) {
	document.querySelectorAll("section:not(.intro)").forEach(section => {
		let group = document.createElement("div");
		group.classList.add("group");
		let heading = document.createElement("div");
		heading.classList.add("heading");
		let h2 = section.querySelector("h2");
		let a = document.createElement("a");
		a.href = "#" + h2.id;
		a.textContent = h2.textContent;
		heading.append(a);
		group.append(heading);
		asideLinks.set(h2.id, heading);

		section.querySelectorAll(".member").forEach(member => {
			let h3 = member.querySelector("h3");
			let isInherited = !!member.querySelector("p.inherited");
			let link = document.createElement("div");
			link.classList.add("link");
			if (isInherited)
				link.classList.add("inherited");
			link.dataset.id = h3.id;
			let a = document.createElement("a");
			a.href = "#" + h3.id;
			a.textContent = h3.textContent;
			link.append(a);
			group.append(link);
			asideLinks.set(h3.id, link);
		});

		aside.append(group);
	});

	if (asideLinks.size === 0) {
		// No API reference, use regular headers
		let group = document.createElement("div");
		group.classList.add("group");
		let heading = document.createElement("div");
		heading.classList.add("heading");
		heading.textContent = "Contents";
		group.append(heading);

		document.querySelectorAll("h2, h3, h4").forEach(h => {
			if (h.closest(".example"))
				return;   // Ignore example code
			if (h.classList.contains("no-toc"))
				return;

			let link = document.createElement("div");
			link.classList.add("link");
			if (h.nodeName.toLowerCase() === "h4")
				link.classList.add("indented-2");
			else if (h.nodeName.toLowerCase() === "h3")
				link.classList.add("indented");
			else
				link.classList.add("spaced");
			if (h.id) {
				link.dataset.id = h.id;
				let a = document.createElement("a");
				a.href = "#" + h.id;
				a.textContent = h.textContent;
				link.append(a);
				asideLinks.set(h.id, link);
			}
			else {
				link.textContent = h.textContent;
			}
			group.append(link);
		});

		aside.append(group);
	}
}


// ==================== Copy to clipboard ====================

F("div.member :is(h3, h4)").forEach(h => {
	let text = h.textContent;
	let copyButton = F.c("a");
	copyButton.classList.add("copy-button");
	copyButton.href = "#";
	copyButton.title = "Copy name";
	copyButton.innerHTML = `<svg style="width: 16px; height: 16px;" viewBox="0 0 16 16"><path d="M6,5L3.75,5C2.784,5 2,5.784 2,6.75L2,12.25C2,13.216 2.784,14 3.75,14L7.25,14C8.216,14 9,13.216 9,12.25L9,12L8.52,12C7.129,12 6,10.871 6,9.48L6,5ZM14,3.75C14,2.784 13.216,2 12.25,2L8.75,2C7.784,2 7,2.784 7,3.75L7,9.25C7,10.216 7.784,11 8.75,11L12.25,11C13.216,11 14,10.216 14,9.25L14,3.75Z"/></svg>`;
	copyButton.F.on("click", event => {
		event.preventDefault();
		event.stopPropagation();
		let localText = text;
		if (event.shiftKey && localText.startsWith("--"))
			localText = "var(" + localText + ")";
		if (F.copyText(localText)) {
			// Let the icon turn green and explode as confirmation
			copyButton.querySelector("svg").F.animateFromTo({
				fill: ["limegreen", "limegreen"],
				transform: ["scale(1)", "scale(5)"],
				opacity: [1, 0]
			}, 700, "ease", false);
		}
		else {
			F.modal("Copy failed");
		}
	});
	h.append(copyButton);
});


// ==================== Member search ====================

let updateHashTimeout;

// Update the search results when the text changes
const searchText = document.getElementById("search-text");
if (searchText) {
	searchText.addEventListener("input", e => {
		updateSearchResults();
	});

	// Start search by typing a letter on the page
	document.addEventListener("keydown", e => {
		if (e.target !== searchText && e.key.trim().length === 1 && !e.altKey && !e.ctrlKey) {
			searchText.select();
			searchText.focus();
		}
	});

	// Scroll the page with arrow keys from the search input field
	searchText.addEventListener("keydown", e => {
		const header = document.querySelector("header");
		const headerHeight = header ? header.offsetHeight : 0;
		if (e.key === "ArrowDown") {
			e.preventDefault();
			window.scrollBy({ top: 100, behavior: "smooth" });
		}
		if (e.key === "ArrowUp") {
			e.preventDefault();
			window.scrollBy({ top: -100, behavior: "smooth" });
		}
		if (e.key === "PageDown") {
			e.preventDefault();
			window.scrollBy({ top: window.innerHeight - headerHeight - 100, behavior: "smooth" });
		}
		if (e.key === "PageUp") {
			e.preventDefault();
			window.scrollBy({ top: -(window.innerHeight - headerHeight - 100), behavior: "smooth" });
		}
		if (e.key === "Escape") {
			e.preventDefault();
			// Restore scroll position for the first visible member h3
			const h = Array.from(document.querySelectorAll("h3[id]")).find(e => e.offsetTop > 0 && e.getBoundingClientRect().top > headerHeight);
			const offset = h ? h.getBoundingClientRect().top : 0;
			searchText.blur();
			searchText.value = "";
			updateSearchResults();
			if (h)
				window.scrollTo({ top: h.offsetTop - offset });
		}
	});

	// Set search text from URL parameter
	const urlParams = new URLSearchParams(location.search);
	searchText.value = urlParams.get("s");

	updateSearchResults();
}

function updateSearchResults() {
	let resultsCount = 0;
	let search = searchText.value.trim();
	let atStart = false;
	let useAliases = true;
	let searchPlugin = false;
	if (search.startsWith("^")) {
		search = search.substring(1).trimStart();
		atStart = true;
		useAliases = false;
	}
	else if (search.startsWith("=")) {
		search = search.substring(1).trimStart();
		useAliases = false;
	}
	else if (search.startsWith("@")) {
		search = search.substring(1).trimStart();
		searchPlugin = true;
	}

	// Show or hide member elements in the content and links in the side panel
	document.querySelectorAll(".member").forEach(member => {
		let show = !search;
		let h3 = member.querySelector("h3");
		if (!show) {
			if (searchPlugin) {
				let source = member.querySelector("span.source a");
				if (source?.textContent.toLowerCase().includes(search.toLowerCase()))
					show = true;
			}
			else {
				if (h3.textContent.toLowerCase()[atStart ? "startsWith" : "includes"](search.toLowerCase()))
					show = true;
				if (useAliases && member.dataset.aliases && member.dataset.aliases.toLowerCase().includes(search.toLowerCase()))
					show = true;
			}
		}
		if (show)
			resultsCount++;

		// Show or hide member element in the content
		member.style.display = show ? "" : "none";

		// Show or hide link in the side panel
		let link = asideLinks.get(h3.id);
		link.style.display = show ? "" : "none";

		// Add search match highlighting to link in the side panel
		let a = link.querySelector("a");
		if (search && show && !searchPlugin) {
			a.innerHTML = a.textContent.replace(new RegExp((atStart ? "^" : "") + "(" + F.regExpEscape(search) + ")", "gi"), "<span class='match'>$1</span>");
		}
		else {
			a.textContent = a.textContent;
		}
	});

	// Hide sections in the content that have no visible members
	document.querySelectorAll("section").forEach(section => {
		section.style.display = "none";
		let firstVisible = true;
		section.querySelectorAll(".member").forEach(member => {
			if (member.style.display !== "none") {
				member.classList.toggle("not-first", !firstVisible);
				firstVisible = false;
				section.style.display = "";
			}
		});
	});

	// Hide groups in the side panel that have no visible members
	document.querySelectorAll("aside .group").forEach(section => {
		section.style.display = "none";
		section.querySelectorAll(".link").forEach(member => {
			if (member.style.display !== "none") {
				section.style.display = "";
			}
		});
	});

	let intro = document.querySelector("section.intro");
	if (intro)
		intro.style.display = search ? "none" : "";

	let resultsCountDiv = document.getElementById("results-count");
	if (resultsCountDiv) {
		resultsCountDiv.style.display = search && resultsCount > 0 ? "block" : "none";   // hidden by stylesheet
		resultsCountDiv.textContent = resultsCount > 1 ? resultsCount + " search results" : resultsCount > 0 ? resultsCount + " search result" : "";
	}
	let noResults = document.getElementById("no-results");
	if (noResults)
		noResults.style.display = resultsCount > 0 ? "none" : "block";   // hidden by stylesheet

	clearTimeout(updateHashTimeout);
	updateHashTimeout = setTimeout(updateHash, 50);
}


// ==================== Reference links ====================

// Insert links to the CSS classes and variables reference
F("code.css-class").forEach(code => {
	let hrefBase = location.pathname.includes("frontfire-ui-classes.html") ? "" : "frontfire-ui-classes.html";
	let a = F.c("a");
	a.href = hrefBase + "#" + code.textContent;
	a.textContent = code.textContent;
	code.replaceChildren(a);
});
F("code.css-var").forEach(code => {
	let hrefBase = location.pathname.includes("frontfire-ui-variables.html") ? "" : "frontfire-ui-variables.html";
	let a = F.c("a");
	a.href = hrefBase + "#" + code.textContent.replace(/^--/, "");
	a.textContent = code.textContent;
	code.replaceChildren(a);
});


// ==================== Scrolling ====================

// Scroll to other members
function gotoMember(name, smooth) {
	const aside = document.querySelector("aside");
	const header = document.querySelector("header");
	const searchBox = document.querySelector("#search-box");
	let headerHeight = 0;
	if (aside && aside.F.visible || !searchBox) {
		if (header.F.computedStyle.position === "fixed")
			headerHeight = header.offsetHeight;
	}
	else {
		if (searchBox.F.computedStyle.position === "fixed")
			headerHeight = searchBox.offsetHeight;
	}
	let h = document.getElementById(name);
	if (h?.matches("h1, h2, h3, h4, h5, h6")) {
		if (h.offsetTop === 0) {
			// The target is not visible under the current search, reset that
			searchText.value = "";
			updateSearchResults();
		}
		window.scrollTo({ top: h.offsetTop - 15 - headerHeight, behavior: smooth ? "smooth" : "auto" });
		return true;
	}
	return false;
}

document.querySelectorAll("a[href]").forEach(prepareScrollLink);

function prepareScrollLink(a) {
	const match = a.getAttribute("href").match(/^#([0-9A-Za-z_-]+)$/);
	if (match)
		a.addEventListener("click", e => {
			e.preventDefault();

			if (!gotoMember(match[1], true)) return;   // Target not found

			let baseUrl = location.href.replace(/#.*$/, "").replace(/\?.*$/, "");
			let state = {};

			let queryString = "";
			if (searchText && searchText.value) {
				state.search = searchText.value;
				queryString = "?s=" + encodeURIComponent(searchText.value);
			}

			let hashString = "#" + match[1];
			state.id = match[1];

			// Push state when following internal links
			history.pushState(state, "", baseUrl + queryString + hashString);
			//console.log("PUSH: " + JSON.stringify(state));
			F("aside .link").classList.remove("active");
			let parentLink = a.closest(".link");
			if (parentLink)
				parentLink.classList.add("active");
		});
}

// Update location hash while scrolling (deferred)
function updateHash() {
	const header = document.querySelector("header");
	const headerHeight = header ? header.offsetHeight : 0;
	let lastHead;
	for (let head of document.querySelectorAll(":is(h2, h3, h4)[id]")) {
		if (head.offsetTop > 0) {
			// Stop if the header is too far down
			if (head.offsetTop > window.scrollY + headerHeight + 75)
				break;
			// Stop if the previous header is also visible
			if (lastHead && lastHead.offsetTop > window.scrollY + headerHeight + 10)
				break;
			lastHead = head;
		}
	}

	let baseUrl = location.href.replace(/#.*$/, "").replace(/\?.*$/, "");
	let state = {};

	let queryString = "";
	if (searchText && searchText.value) {
		state.search = searchText.value;
		queryString = "?s=" + encodeURIComponent(searchText.value);
	}

	let activeLink;
	let hashString = "";
	if (lastHead) {
		state.id = lastHead.id;
		hashString = "#" + lastHead.id;
		activeLink = asideLinks.get(lastHead.id);
	}

	// Don't replace the state before we actually created a useful state
	if (history.state || state.search || state.id) {
		history.replaceState(state, "", baseUrl + queryString + hashString);
		//console.log("REPLACE: " + JSON.stringify(state));
	}

	document.querySelectorAll("aside .heading, aside .link").forEach(link => {
		link.classList.toggle("active", link === activeLink);
	});
}

// Create h1 copy for the header
let headerGrid = F("header > a > span").first;
let headerH1Copy = F.c("span");
headerH1Copy.classList.add("h1copy");
headerH1Copy.innerHTML = F("h1").first.innerHTML;
headerGrid.append(headerH1Copy);

document.addEventListener("scroll", () => {
	clearTimeout(updateHashTimeout);
	updateHashTimeout = setTimeout(updateHash, 50);
	headerGrid.classList.toggle("shift", window.scrollY > 10);
});
setTimeout(updateHash, 200);

// Restore scrolling from hash on load
if (location.hash) {
	setTimeout(() => {
		gotoMember(location.hash.substring(1), false);

		// Scroll side panel to make active entry visible
		setTimeout(() => {
			const aside = document.querySelector("aside");
			if (aside) {
				let activeLink = aside.querySelector(".heading.active, .link.active");
				if (activeLink && activeLink.offsetTop > aside.offsetHeight / 2) {
					aside.scrollTo({ top: activeLink.offsetTop - aside.offsetHeight / 2 });
				}
			}
		}, 100);
	}, 0);
}

if (!location.pathname.match(/(index.html|\/)$/))
	history.scrollRestoration = "manual";
window.addEventListener("popstate", event => {
	//console.log("POP: " + JSON.stringify(event.state));
	if (searchText) {
		searchText.value = event.state?.search || "";
		updateSearchResults();
	}
	if (event.state?.id)
		gotoMember(event.state.id, true);
	else
		window.scrollTo({ top: 0, behavior: "smooth" });
});


// ==================== Version ====================

// Show actual version in the example code
let versionId = document.getElementById("version-id");
if (versionId)
	document.querySelectorAll(".version-id").forEach(v => v.textContent = versionId.textContent);


// ==================== Live test results ====================

F("div.member span.live-test").forEach(el => {
	let method = el.closest("div.member").querySelector("h3").id;
	let result = F[method]();
	if (result) {
		el.textContent = "true";
		el.classList.add("true");
	}
	else {
		el.textContent = "false";
		el.classList.add("false");
	}
});


// ==================== CSS color previews ====================

// Find CSS variable entries of the type color with a defined default value
F("div.member > p").forEach(memberP => {
	let type = memberP.querySelector(":scope > span.type + a")?.textContent;
	if (type === "color") {
		memberP.innerHTML = memberP.innerHTML.replace(/ (#[0-9a-f]{6}|(rgb|hsl)\([0-9., ]+\))/g, ' <span class="color-preview" style="background-color: $1"></span>$1');
	}
});


// ==================== Source code views ====================

// Syntax highlighting in code blocks
F("div.code").except(F("div.example div.code")).forEach(code => syntaxHighlight(code));
// Pay attention to the right order because every element is only highlighted once!
// And in the supported HTML elements of CSS classes
F("code[data-lang]").forEach(code => syntaxHighlight(code));
// And in all code elements in an API member
F("div.member .elements").nextElementSiblings.where("code").forEach(code => syntaxHighlight(code, "html"));
// And in all code elements with a defined language
F("div.member code:not(.css-class):not(.css-var)").forEach(code => syntaxHighlight(code));

// Also add links to CSS variables in style-value code
// (already highlighted in HTML, so we use a very basic pattern matching here)
F("code[data-lang=style-value]").forEach(code => {
	let hrefBase = location.pathname.includes("frontfire-ui-variables.html") ? "" : "frontfire-ui-variables.html";
	code.innerHTML = code.innerHTML.replace(
		/--[a-z0-9-]+/g,
		match => '<a href="' + hrefBase + '#' + match.replace(/^--/, "") + '">' + match + '</a>');
	code.querySelectorAll("a[href]").forEach(prepareScrollLink);
});

// Show source code of examples below their live element
F(".example").forEach(example => addExampleCode(example));
// Now catch up on the autostart that has been deferred to not mess up the example source codes
F(".example").frontfire();

function addExampleCode(example) {
	// Create code container
	let code = F.c("div");
	code.classList.add("code", "example-code");

	// Fetch the example's HTML and clean it up for displaying
	let html = example.innerHTML;
	// Remove leading empty lines and trailing whitespace
	html = html.replace(/^\s*\n/, "").trimEnd();
	// Remove the minimum number of common indents
	let lines = html.split("\n");
	let indents = lines.L
		.where(line => line.trim() !== "")
		.min(line => line.replace(/\S.*$/, "").length);
	html = lines.L.select(line => line.substring(indents)).join("\n");
	// Simplify boolean attributes (non-exhaustive but sufficient list)
	html = html.replace(/(?<=<[^>]+ (autofocus|checked|disabled|multiple|readonly|required|selected))=""/g, "");
	// Wrap attributes
	if (example.dataset.find)
		html = html.replace(
			new RegExp(example.dataset.find, "g"),
			example.dataset.replace
				.replace(/\\n/g, "\n")
				.replace(/\\t/g, "\t"));

	// Highlight code of special interest for an example
	if (example.dataset.sourceHighlight) {
		html = html.replace(new RegExp(example.dataset.sourceHighlight, "g"), "\x01$&\x01")
	}

	// Apply syntax highlighting
	code.textContent = html;
	code.dataset.lang = "html";
	syntaxHighlight(code);
	html = code.innerHTML;

	// Highlight code of special interest for an example
	if (example.dataset.sourceHighlight) {
		// TODO: This may end foreign <span> elements prematurely, better use a span-tracking parser instead of blind find&replace
		html = html.replace(/\x01(.*?)\x01/g, "<span class='highlight'>$1</span>")
	}

	code.innerHTML = html;

	// Create group container
	let insertAfter = example;
	if (example.parentElement.matches(".example-group")) {
		// There is already a group, keep it and remove the old code container
		example.nextElementSibling.remove();
	}
	else if (example.parentElement.parentElement.matches(".example-group")) {
		// In a resizable container, look one lever further up
		example.parentElement.nextElementSibling.remove();
		insertAfter = example.parentElement;
	}
	else {
		let group = F.c("div");
		group.classList.add("example-group");
		if (example.classList.contains("full-width"))
			group.classList.add("full-width");

		// Wrap the example element with the group container
		example.F.wrap(group);
	}

	// Insert the code container after the example
	insertAfter.after(code);
}

function makeExampleResizable(example) {
	let container = F.c("div");
	container.classList.add("example-resize-container");
	example.F.wrap(container);

	let handle = F.c("div");
	handle.classList.add("example-resize-handle");
	handle.innerHTML = `<svg width="3" height="21"><rect x="0" y="0" width="3" height="3"/><rect x="0" y="6" width="3" height="3"/><rect x="0" y="12" width="3" height="3"/><rect x="0" y="18" width="3" height="3"/></svg>`;
	container.append(handle);

	let pointerId, pointerDownX, initialWidth;
	let tooltip;
	handle.F.on("pointerdown", event => {
		if (event.pointerType === "mouse" && event.button !== 0)
			return;   // Ignore other-than-left mouse button
		pointerId = event.pointerId;
		pointerDownX = event.clientX;
		initialWidth = example.F.width;
		handle.setPointerCapture(pointerId);
		event.preventDefault();
		showTooltip(event.clientY);
	});
	handle.F.on("pointerup pointercancel", event => {
		if (event.pointerId === pointerId) {
			pointerId = undefined;
			hideTooltip();
		}
	});
	handle.F.on("pointermove", event => {
		if (event.pointerId === pointerId) {
			event.preventDefault();
			let dx = event.clientX - pointerDownX;
			let minWidth = 230;   // results in content width of 200px
			let maxWidth = example.parentElement.F.width - handle.F.width;
			let newWidth = F.clamp(initialWidth + dx, minWidth, maxWidth);
			if (example.classList.contains("narrow") || newWidth < maxWidth) {
				example.style.maxWidth = newWidth + "px";
			}
			else {
				// Set to maximum width, remove the width limit (undo resize)
				example.style.maxWidth = "";
			}
			showTooltip(event.clientY);
			// Let the content know that the available width has changed so that it can relayout
			F(window).trigger("resize");
		}
	});

	function showTooltip(y) {
		if (!tooltip) {
			tooltip = F.c("div");
			tooltip.F.style = {
				position: "fixed",
				padding: "1px 4px 2px",
				background: "rgb(0, 0, 0, 0.7)",
				color: "white",
				fontSize: "0.8em",
				whiteSpace: "pre-wrap"
			};
			document.body.append(tooltip);
		}
		tooltip.textContent = Math.round(example.F.contentWidth) + "px";
		let handleRect = handle.getBoundingClientRect();
		if (y < handleRect.top)
			y = handleRect.top;
		if (y + tooltip.F.height > handleRect.bottom)
			y = handleRect.bottom - tooltip.F.height;
		tooltip.F.style = {
			top: y + "px",
			left: handleRect.right + "px"
		};
	}

	function hideTooltip() {
		if (tooltip) {
			tooltip.remove();
			tooltip = undefined;
		}
	}
}

F(".example.resizable").forEach(example => makeExampleResizable(example));


// ==================== Syntax highlighting ====================

// Applies syntax highlighting on an element's text content.
// With additional highlighting for example result lines starting with "→".
function syntaxHighlight(element, overrideLang) {
	if (element.dataset.syntaxHighlighted)
		return;
	element.dataset.syntaxHighlighted = "true";

	switch (overrideLang || element.dataset.lang) {
		case "":
			// No highlighting, preserves existing HTML markup
			break;
		case "css":
			element.innerHTML = syntaxHighlightCSS(element.textContent);
			break;
		case "html":
			element.innerHTML = syntaxHighlightHTML(element.textContent);
			break;
		case "style":
			element.innerHTML = syntaxHighlightCSS(element.textContent, null, "declaration");
			break;
		case "style-value":
			element.innerHTML = syntaxHighlightCSS(element.textContent, null, "style-value");
			break;
		case "js":
		default:
			element.innerHTML = syntaxHighlightJavaScript(element.textContent);
			break;
	}

	if (element.matches("div"))
		setIndentedWrapping(element);
}

function getClassForSyntaxState(state) {
	switch (state) {
		case "comment":
		case "comment-end":
		case "line-comment":
		case "comment-declaration":
		case "comment-declaration-end":
			return "comment";
		case "dq-string":
		case "sq-string":
		case "bt-string":
		case "string-end":
			return "string";
		case "tag":
		case "tag-end":
			return "tag";
		case "doctype":
		case "doctype-end":
			return "doctype";
		case "entity":
		case "entity-end":
			return "entity";
		case "type":
		case "keyword":
		case "result":
		case "attribute":
		case "type-selector":
		case "id-selector":
		case "attribute-selector":
		case "attribute-selector-value":
		case "class-selector":
		case "at-rule":
			return state;
		default:
			return "";
	}
}

// Applies CSS syntax highlighting on a text.
// The colours are assigned in CSS classes for each parser state.
function syntaxHighlightCSS(code, inlineData, startState) {
	let pos = 0;
	let html = "";
	let state = startState || "";
	let className = "";
	let keywords = ["calc", "clamp", "hsl", "hsla", "inherit", "initial", "max", "min", "rgb", "rgba", "round", "unset", "var", "!important"];
	while (pos < code.length) {
		let newState = state;
		let skip = 1;
		let revertToState = null;
		if (inlineData &&
			state.match(inlineData.endStatePattern) &&
			code.substring(pos, pos + inlineData.end.length) === inlineData.end) {
			inlineData.skip = pos;
			return html;
		}
		let colorMatch = code.substring(pos, pos + 13).match(/^\/\*\*(#[0-9A-Fa-f]+)\*\*\//);
		if (colorMatch) {
			html += `<span class="color-preview" style="background-color: ${colorMatch[1]}"></span>`;
			pos += colorMatch[0].length;
		}
		switch (state) {
			case "":
				if (code.substring(pos, pos + 2) === "/*") {
					newState = "comment";
					skip = 2;
				}
				else if (code.substring(pos, pos + 1) === "@") {
					newState = "at-rule";
				}
				else if (code.substring(pos, pos + 1) === "#") {
					newState = "id-selector-start";
				}
				else if (code.substring(pos, pos + 1) === ".") {
					newState = "class-selector-start";
				}
				else if (code.substring(pos, pos + 1) === "[") {
					newState = "attribute-selector-start";
				}
				else if (code.substring(pos, pos + 1) === ":") {
					newState = "pseudo-selector";
				}
				else if (code.substring(pos, pos + 1) === "{") {
					newState = "declaration";
				}
				else if (code.substring(pos, pos + 1).match(/[*0-9A-Za-z_-]/)) {
					newState = "type-selector";
				}
				break;
			case "comment":
				if (code.substring(pos, pos + 2) === "*/") {
					newState = "comment-end";
					skip = 2;
				}
				break;
			case "comment-end":
				newState = "";
				skip = 0;
				break;
			case "comment-declaration":
				if (code.substring(pos, pos + 2) === "*/") {
					newState = "comment-declaration-end";
					skip = 2;
				}
				break;
			case "comment-declaration-end":
				newState = "declaration";
				skip = 0;
				break;
			case "at-rule":
				if (code.substring(pos, pos + 1) === "{") {
					newState = "";
				}
				break;
			case "type-selector":
				if (code.substring(pos, pos + 1).match(/[^*0-9A-Za-z_-]/)) {
					newState = "";
					skip = 0;
				}
				break;
			case "id-selector-start":
				newState = "id-selector";
				skip = 0;
				break;
			case "id-selector":
				if (code.substring(pos, pos + 1).match(/[^0-9A-Za-z_-]/)) {
					newState = "";
					skip = 0;
				}
				break;
			case "class-selector-start":
				newState = "class-selector";
				skip = 0;
				break;
			case "class-selector":
				if (code.substring(pos, pos + 1).match(/[^0-9A-Za-z_-]/)) {
					newState = "";
					skip = 0;
				}
				break;
			case "attribute-selector-start":
				newState = "attribute-selector";
				skip = 0;
				break;
			case "attribute-selector":
				if (code.substring(pos, pos + 1) === "]") {
					newState = "";
				}
				else if (code.substring(pos, pos + 1) === "=") {
					newState = "attribute-selector-value-start";
				}
				else if (code.substring(pos, pos + 2) === "~=" ||
					code.substring(pos, pos + 2) === "|=" ||
					code.substring(pos, pos + 2) === "^=" ||
					code.substring(pos, pos + 2) === "$=" ||
					code.substring(pos, pos + 2) === "*=") {
					newState = "attribute-selector-value-start";
					skip = 2;
				}
				break;
			case "attribute-selector-value-start":
				newState = "attribute-selector-value";
				skip = 0;
				break;
			case "attribute-selector-value":
				// Quoted values are not supported here
				if (code.substring(pos, pos + 1) === "]") {
					newState = "";
				}
				break;
			case "pseudo-selector":
				if (code.substring(pos, pos + 1).match(/[^:0-9A-Za-z_-]/)) {
					newState = "";
					skip = 0;
				}
				break;
			case "declaration":
				if (code.substring(pos, pos + 2) === "/*") {
					newState = "comment-declaration";
					skip = 2;
				}
				else if (code.substring(pos, pos + 1) === "}") {
					newState = "";
				}
				else if (code.substring(pos, pos + 1) === "@") {
					newState = "at-rule";
				}
				else if (!code.substring(pos, pos + 1).match(/\s/)) {
					newState = "style-property";
				}
				break;
			case "at-rule":
				if (code.substring(pos, pos + 1) === "{") {
					newState = "declaration";
				}
				else if (code.substring(pos, pos + 1).match(/\s/)) {
					newState = "";
				}
				break;
			case "style-property":
				if (code.substring(pos, pos + 1) === "}") {
					// Invalid syntax, continue anyway
					newState = "";
				}
				else if (code.substring(pos, pos + 1) === ":") {
					newState = "style-value";
				}
				else if (code.substring(pos, pos + 1).match(/\s|;/)) {
					newState = "declaration";
				}
				break;
			case "style-value":
				if (code.substring(pos, pos + 1) === "}") {
					newState = "";
				}
				else if (code.substring(pos, pos + 1) === ";") {
					newState = "declaration";
				}
				else if (code.substring(pos, pos + 1) === '"') {
					newState = "dq-string";
				}
				else if (code.substring(pos, pos + 1) === "'") {
					newState = "sq-string";
				}
				else if (pos === 0 || code.substring(pos - 1, pos).match(/\s|\W/)) {
					for (let i = 0; i < keywords.length; i++) {
						let kw = keywords[i];
						if (code.substring(pos, pos + kw.length) === kw &&
							(pos + kw.length === code.length || code.substring(pos + kw.length, pos + kw.length + 1).match(/\s|[^0-9A-Za-z_-]/))) {
							newState = "keyword";
							skip = kw.length;
							revertToState = state;
							break;
						}
					}
				}
				break;
			case "dq-string":
				if (code.substring(pos, pos + 1) === '"' && code.substring(pos - 1, pos) !== "\\") {
					newState = "style-end";
				}
				break;
			case "sq-string":
				if (code.substring(pos, pos + 1) === "'" && code.substring(pos - 1, pos) !== "\\") {
					newState = "style-end";
				}
				break;
			case "string-end":
				newState = "style-value";
				skip = 0;
				break;
		}

		if (newState !== state) {
			let newClassName = getClassForSyntaxState(newState);
			let classHtml = "";
			if (newClassName !== className) {
				if (className)
					classHtml += '</span>';
				className = newClassName;
				if (className)
					classHtml += '<span class="syntax-' + className + '">';
			}
			if (logParser) console.debug(`CSS: [${state}] → [${newState}] ${classHtml}`);
			state = newState;
			html += classHtml;
		}

		let newHtml = F.encodeHTML(code.substring(pos, pos + skip));
		if (logParser) console.debug(`CSS:   "${code.substring(pos, pos + skip)}" → "${newHtml}"`);
		pos += skip;
		html += newHtml;

		if (revertToState !== null && revertToState !== state) {
			let newClassName = getClassForSyntaxState(revertToState);
			let classHtml = "";
			if (newClassName !== className) {
				if (className)
					classHtml += '</span>';
				className = newClassName;
				if (className)
					classHtml += '<span class="syntax-' + className + '">';
			}
			if (logParser) console.debug(`CSS: revert [${state}] → [${revertToState}] ${classHtml}`);
			state = revertToState;
			html += classHtml;
		}
	}
	if (inlineData)
		inlineData.skip = pos;
	return html;
}

// Applies HTML syntax highlighting on a text.
// The colours are assigned in CSS classes for each parser state.
function syntaxHighlightHTML(code) {
	let pos = 0;
	let html = "";
	let state = "";
	let className = "";
	let tagName = "";
	let attrName = "";
	let inlineParser = null;
	while (pos < code.length) {
		let newState = state;
		let skip = 1;
		if (code.substring(pos, pos + 3) === "{{{") {
			html += '<span class="highlight">';
			pos += 3;
		}
		if (code.substring(pos, pos + 3) === "}}}") {
			html += '</span>';
			pos += 3;
		}
		switch (state) {
			case "":
				if (code.substring(pos, pos + 4) === "<!--") {
					newState = "comment";
					skip = 4;
				}
				else if (code.substring(pos, pos + 2) === "<!") {
					newState = "doctype";
					skip = 2;
				}
				else if (code.substring(pos, pos + 1) === "<") {
					newState = "tag";
					tagName = "";
				}
				else if (code.substring(pos, pos + 1) === "&") {
					newState = "entity";
				}
				break;
			case "comment":
				if (code.substring(pos, pos + 3) === "-" + "->") {
					newState = "comment-end";
					skip = 3;
				}
				break;
			case "comment-end":
				newState = "";
				skip = 0;
				break;
			case "tag":
				if (code.substring(pos, pos + 1) === " ") {
					newState = "attribute";
					attrName = "";
				}
				else if (code.substring(pos, pos + 1) === ">") {
					newState = "tag-end";
					if (tagName === "script" || tagName === "style")
						inlineParser = tagName;
				}
				else if (code.substring(pos, pos + 2) === "/>") {
					newState = "tag-end";
					skip = 2;
					if (tagName === "script" || tagName === "style")
						inlineParser = tagName;
				}
				else {
					tagName += code.substring(pos, pos + 1);
				}
				break;
			case "doctype":
				if (code.substring(pos, pos + 1) === ">") {
					newState = "doctype-end";
				}
				break;
			case "attribute":
				if (code.substring(pos, pos + 1) === "=") {
					newState = "attribute-value";
				}
				else if (code.substring(pos, pos + 1) === ">") {
					newState = "tag-end";
					if (tagName === "script" || tagName === "style")
						inlineParser = tagName;
				}
				else if (code.substring(pos, pos + 2) === "/>") {
					newState = "tag-end";
					skip = 2;
					if (tagName === "script" || tagName === "style")
						inlineParser = tagName;
				}
				else {
					if (code.substring(pos, pos + 1).match(/\s/))
						attrName = "";
					else
						attrName += code.substring(pos, pos + 1);
				}
				break;
			case "attribute-value":
				if (code.substring(pos, pos + 1) === '"') {
					newState = "dq-string";
					if (attrName === "style")
						inlineParser = "style-attr";
				}
				else if (code.substring(pos, pos + 1) === "'") {
					newState = "sq-string";
					if (attrName === "style")
						inlineParser = "style-attr";
				}
				break;
			case "tag-end":
				newState = "";
				skip = 0;
				break;
			case "doctype-end":
				newState = "";
				skip = 0;
				break;
			case "dq-string":
				if (code.substring(pos, pos + 1) === '"') {
					newState = "string-end";
				}
				break;
			case "sq-string":
				if (code.substring(pos, pos + 1) === "'") {
					newState = "string-end";
				}
				break;
			case "string-end":
				newState = "attribute";
				skip = 0;
				break;
			case "entity":
				if (code.substring(pos, pos + 1) === ";") {
					newState = "entity-end";
				}
				break;
			case "entity-end":
				newState = "";
				skip = 0;
				break;
		}

		if (newState !== state) {
			let newClassName = getClassForSyntaxState(newState);
			let classHtml = "";
			if (newClassName !== className) {
				if (className)
					classHtml += '</span>';
				className = newClassName;
				if (className)
					classHtml += '<span class="syntax-' + className + '">';
			}
			if (logParser) console.debug(`HTML: [${state}] → [${newState}] ${classHtml}`);
			state = newState;
			html += classHtml;
		}

		let newHtml = F.encodeHTML(code.substring(pos, pos + skip));
		if (logParser) console.debug(`HTML:   "${code.substring(pos, pos + skip)}" → "${newHtml}"`);
		pos += skip;
		html += newHtml;

		if (state === "" && inlineParser) {
			let inlineData = {
				end: "</" + inlineParser + ">",
				endStatePattern: "^$",
				skip: 0
			};
			if (logParser) console.debug(`HTML:     parsing "${code.substring(pos, pos + 40)}..." until "${inlineData.end}"`);
			let inlineHtml;
			switch (inlineParser) {
				case "script":
					inlineHtml = syntaxHighlightJavaScript(code.substring(pos), inlineData);
					break;
				case "style":
					inlineHtml = syntaxHighlightCSS(code.substring(pos), inlineData);
					break;
			}
			if (logParser) console.debug(`HTML:     parsed to: ${inlineHtml}`);
			if (inlineHtml)
				html += '<span class="inline-' + inlineParser + '">' + inlineHtml + '</span>';
			pos += inlineData.skip;
			inlineParser = null;
		}
		if (inlineParser === "style-attr") {
			let inlineData = {
				end: state === "sq-string" ? "'" : '"',
				endStatePattern: ".*",
				skip: 0
			};
			if (logParser) console.debug(`HTML:     parsing "${code.substring(pos, pos + 40)}..." until "${inlineData.end}"`);
			let inlineHtml = syntaxHighlightCSS(code.substring(pos), inlineData, "declaration");
			if (logParser) console.debug(`HTML:     parsed to: ${inlineHtml}`);
			if (inlineHtml)
				html += '<span class="inline-style">' + inlineHtml + '</span>';
			pos += inlineData.skip;
			inlineParser = null;
		}
	}
	return html;
}

// Applies JavaScript syntax highlighting on a text.
// The colours are assigned in CSS classes for each parser state.
// Limitations:
// - No support for regular expression literals or template (backtick) strings
// - Limited set of keywords and types
function syntaxHighlightJavaScript(code, inlineData) {
	let pos = 0;
	let html = "";
	let state = "";
	let className = "";
	let types = ["Array", "ArrayList", "Color", "DataColor", "Frontfire", "Object", "Promise"];
	let keywords = ["arguments", "async", "await", "break", "case", "catch", "const", "continue", "default", "delete", "do", "else", "false", "finally", "for", "function", "if", "in", "instanceof", "let", "new", "null", "of", "return", "switch", "this", "throw", "true", "try", "typeof", "undefined", "var", "while", "yield"];
	// Hide lines that are only necessary in the examples but not in real use
	let origLength = code.length;
	code = code.replace(/^[ \t]*\/\*hideline\*\/.*?\n/gm, "");
	let hiddenLength = origLength - code.length;
	while (pos < code.length) {
		let newState = state;
		let skip = 1;
		let revertToState = null;
		if (inlineData &&
			state.match(inlineData.endStatePattern) &&
			code.substring(pos, pos + inlineData.end.length) === inlineData.end) {
			inlineData.skip = pos + hiddenLength;
			return html;
		}
		let colorMatch = code.substring(pos, pos + 13).match(/^\/\*\*(#[0-9A-Fa-f]+)\*\*\//);
		if (colorMatch) {
			html += `<span class="color-preview" style="background-color: ${colorMatch[1]}"></span>`;
			pos += colorMatch[0].length;
		}
		switch (state) {
			case "":
				if (code.substring(pos, pos + 2) === "//") {
					newState = "line-comment";
					skip = 2;
				}
				else if (code.substring(pos, pos + 2) === "/*") {
					newState = "comment";
					skip = 2;
				}
				else if (code.substring(pos, pos + 1) === '"') {
					newState = "dq-string";
				}
				else if (code.substring(pos, pos + 1) === "'") {
					newState = "sq-string";
				}
				else if (code.substring(pos, pos + 1) === "`") {
					newState = "bt-string";
				}
				else if (code.substring(pos - 1, pos + 1) === "\n→") {
					newState = "result";
				}
				else if (pos === 0 || code.substring(pos - 1, pos).match(/\s|\W/)) {
					for (let i = 0; i < types.length; i++) {
						let type = types[i];
						if (code.substring(pos, pos + type.length) === type &&
							(pos + type.length === code.length || code.substring(pos + type.length, pos + type.length + 1).match(/\s|\W/))) {
							newState = "type";
							skip = type.length;
							revertToState = state;
							break;
						}
					}
					for (let i = 0; i < keywords.length; i++) {
						let kw = keywords[i];
						if (code.substring(pos, pos + kw.length) === kw &&
							(pos + kw.length === code.length || code.substring(pos + kw.length, pos + kw.length + 1).match(/\s|\W/))) {
							newState = "keyword";
							skip = kw.length;
							revertToState = state;
							break;
						}
					}
				}
				break;
			case "line-comment":
			case "result":
				if (code.substring(pos, pos + 1) === "\n") {
					newState = "";
				}
				break;
			case "comment":
				if (code.substring(pos, pos + 2) === "*/") {
					newState = "comment-end";
					skip = 2;
				}
				break;
			case "comment-end":
				newState = "";
				skip = 0;
				break;
			case "dq-string":
				if (code.substring(pos, pos + 1) === '"' && code.substring(pos - 1, pos) !== "\\") {
					newState = "string-end";
				}
				break;
			case "sq-string":
				if (code.substring(pos, pos + 1) === "'" && code.substring(pos - 1, pos) !== "\\") {
					newState = "string-end";
				}
				break;
			case "bt-string":
				if (code.substring(pos, pos + 1) === "`" && code.substring(pos - 1, pos) !== "\\") {
					newState = "string-end";
				}
				break;
			case "string-end":
				newState = "";
				skip = 0;
				break;
		}

		if (newState !== state) {
			let newClassName = getClassForSyntaxState(newState);
			let classHtml = "";
			if (newClassName !== className) {
				if (className)
					classHtml += '</span>';
				className = newClassName;
				if (className)
					classHtml += '<span class="syntax-' + className + '">';
			}
			if (logParser) console.debug(`JS: [${state}] → [${newState}] ${classHtml}`);
			state = newState;
			html += classHtml;
		}

		let newHtml = F.encodeHTML(code.substring(pos, pos + skip));
		if (logParser) console.debug(`JS:   "${code.substring(pos, pos + skip)}" → "${newHtml}"`);
		pos += skip;
		html += newHtml;

		if (revertToState !== null && revertToState !== state) {
			let newClassName = getClassForSyntaxState(revertToState);
			let classHtml = "";
			if (newClassName !== className) {
				if (className)
					classHtml += '</span>';
				className = newClassName;
				if (className)
					classHtml += '<span class="syntax-' + className + '">';
			}
			if (logParser) console.debug(`JS: revert [${state}] → [${revertToState}] ${classHtml}`);
			state = revertToState;
			html += classHtml;
		}
	}
	if (inlineData)
		inlineData.skip = pos + hiddenLength;
	return html;
}

// Sets up text lines for indented wrapping, maintaining all content when copying out.
function setIndentedWrapping(element) {
	let openClasses = [];
	let html = element.innerHTML;
	html = html.trimEnd().split("\n").L.select(line => {
		// Determine how many character columns the line is indented
		let firstCol = line.replace(/\S.*$/, "").length;
		let firstColTab = 0;
		if (line.substring(0, 1) === "\t") {
			firstColTab = firstCol;
			firstCol = 0;
		}
		// Find span elements left open at the end of the line
		let preLine = openClasses.L.select(c => `<span class="${c}">`).join("");
		for (let i = 0; i < line.length; i++) {
			let match = line.substring(i).match(/^<span class=(['"])(.+?)\1>/);
			if (match) {
				openClasses.push(match[2]);
				i += match[0].length - 1;
			}
			else if (line.substring(i, i + 7) === '</span>') {
				openClasses.pop();
				i += 6;
			}
		}
		// Completely empty <div>s have zero height and are not copied as text,
		// then an explicit line break is needed
		if (line === "")
			line = "<br>";
		// Now finish the left-open spans (empty-line check needs to be done before)
		line = preLine + line + '</span>'.repeat(openClasses.length);
		// Hack for unsupported CSS "text-indent: hanging"
		// Still, it's not working in Chrome: https://crbug.com/1075989 (text-indent ignores any effort in offsetting it)
		return `<div style="padding-left: calc(${firstCol}ch + ${firstColTab}ch * var(--tab-size)); text-indent: calc(-${firstCol}ch - ${firstColTab}ch * var(--tab-size));">${line}</div>`;
	}).join("");
	element.innerHTML = html;
}
