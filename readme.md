Frontfire Web Frontend Toolkit
==============================

<img src="logo/frontfire.svg" width="150">

The Frontfire Web Frontend Toolkit offers essential styles and effects combined with a consistent set of interactive widgets and layout utilities. It is suitable for web pages and web applications that need a modern and consistent look and feel and use responsive design to work on all devices and screen sizes. All interactions are fully touch-aware and work with any type of pointing device. The default style equally supports light and dark theme.

While [Frontfire version 1](https://github.com/ygoe/Frontfire1) (which as a work in progress never actually used version numbers) was made as a jQuery plugin, version 2 comes in two parts: **Core**, basically replacing jQuery, and **UI**, building with plugins upon Core.

Frontfire is published under the [MIT licence](license.txt).


Documentation
-------------
The API documentation describes all class methods and properties in detail and includes some examples.

📕 **[Online documentation](https://ygoe.de/tmp/frontfire2/)**

In the checked-out repository or the release archive the [documentation is here](doc/index.html).


Download
--------
📦 **[Full package: all bundles and variants](https://github.com/ygoe/Frontfire2/releases)**

⏭ [Change log](https://ygoe.de/tmp/frontfire2/changes.html) (online documentation)

There are currently no CDN offerings available so you have to host the files yourself. This is the preferred method anyway since CDNs often make websites slower, less reliable and come with privacy implications.

The following is the content of the archive. All files in readable and minified form, with source map. Descriptions of bundles and variants below. All file sizes measured with GZip compression.


### JavaScript files

| ▾ Bundle ╲ Variant ▸  | Separate files | Single file (includes all above) |
|-----------------------|----------------|-------------|
| ArrayList             | arraylist.js<br>arraylist.min.js (3.1 KiB) | – |
| Frontfire Core        | frontfire-core.js<br>frontfire-core.min.js (10 KiB) | frontfire-core-singlefile.bundle.js<br>frontfire-core-singlefile.min.js (13 KiB) |
| Frontfire UI Minimal  | frontfire-ui-minimal.bundle.js<br>frontfire-ui-minimal.min.js (16 KiB) | frontfire-ui-minimal-singlefile.bundle.js<br>frontfire-ui-minimal-singlefile.min.js (28 KiB) |
| Color                 | color.js<br>color.min.js (2.6 KiB) | – |
| DataColor             | datacolor.js<br>datacolor.min.js (1.2 KiB) | – |
| Frontfire UI Complete | frontfire-ui-complete.bundle.js<br>frontfire-ui-complete.min.js (36 KiB) | frontfire-ui-complete-singlefile.bundle.js<br>frontfire-ui-complete-singlefile.min.js (51 KiB) |


### CSS files

| Bundle                | Stylesheets |
|-----------------------|-------------|
| Frontfire Core        | –           |
| Frontfire UI Minimal  | frontfire-ui-minimal.css<br>frontfire-ui-minimal.min.css (13 KiB) |
| Frontfire UI Complete | frontfire-ui-complete.css<br>frontfire-ui-complete.min.css (17 KiB) |


### Bundles
Frontfire 2 is available in different bundles.

**Frontfire Core** &nbsp; 👉 use as jQuery replacement

* Provides easy DOM access on a low level
* Based on the ArrayList class which serves as the foundation collection of DOM Nodes
* Largely replaces those parts of jQuery that are not already covered by modern JavaScript
* DOM-oriented API to propagate native browser JavaScript features

**Frontfire UI Minimal**

* Provides the most common and essential UI widgets and interaction primitives (based on my own judgement, see features below)
* Based on Frontfire Core and extends it through its plugin mechanism

**Frontfire UI Complete** &nbsp; 👉 use for all Frontfire features

* Provides all UI widgets that are implemented for Frontfire UI (see features below)
* Based on Frontfire Core and extends it through its plugin mechanism
* A superset of the functionality of the Frontfire UI Minimal bundle

ArrayList (dependency for Core)

* Implements a comfortable array collection
* Inspired by .NET’s List and Enumerable types with a few more methods of JavaScript’s Array and others

Color (dependency for UI Complete)

* Provides colour conversion and computation functions

DataColor (dependency for UI Complete)

* Defines a flexible colour palette for data visualisation


### Variants
Apart from the total selection of features, the toolkit is built in two variants for the JavaScript files. The CSS files are always the same.

**Separate files**

* You include each of the above toolkit levels as a separate file
* Gives you the option to load just the parts needed for a specific web view

**Single file** &nbsp; 👉 recommended use

* All levels and dependencies are compiled into a single JavaScript file
* Simple usage as you just include one JavaScript and one CSS files and have all the bundle’s features available
* Further reduces transfer size due to combined compression effects


Features
--------

| Feature | Description | Core | UI Minimal | UI Complete |
|---------|-------------|:----:|:----------:|:-----------:|
| ArrayList | A comfortable array collection | ✔️️ | ✔️️ | ✔️️ |
| DOM | Easy DOM access on a low level | ✔️ | ✔️ | ✔️️ |
| Events | Easy event handling | ✔️️ | ✔️️ | ✔️ |
| Forms | Easy form data handling and validation | 🚧 | 🚧 | 🚧 |
| Network | Fetch HTTP JSON resources | ✔️ | ✔️ | ✔️ |
| Browser | Browser identification and information | ✔️ | ✔️ | ✔️ |
| Table | Designs last visible table column/row | | ✔️ | ✔️ |
| Dimmer | Dimmed page background for modals | | ✔️ | ✔️ |
| Message | Closable inline messages | | ✔️ | ✔️ |
| Notification | Short pop-up notifications | | ✔️ | ✔️ |
| OffCanvas | A panel that opens from the side of the page | | 📕 | 📕 |
| Modal | A modal panel that overlays the page | | ✔️ | ✔️ |
| Input | Enhances several form input elements (RepeatButton, Spinner, ToggleButton, CheckBox, auto-height textarea, submit lock) | | ✔️ | ✔️ |
| Dropdown | A panel that opens besides an element | | ✔️ | ✔️ |
| Menu | A menu bar with dropdown submenus | | ✔️ | ✔️ |
| Selectable | Enhanced list boxes and dropdown select boxes | | ✔️ | ✔️ |
| Draggable | Supports primitive drag interactions on elements | | ✔️ | ✔️ |
| Resizable | Supports primitive resize interactions on elements | | 🚧 | 🚧 |
| Sortable | Supports primitive reorder interactions on the children of an element | | ✔️ | ✔️ |
| Color | Colour conversion, computation and palette | ➕ | ➕ | ✔️ |
| ToggleSwitch | A simple and nice toggle switch | | | 📕 |
| TreeView | A tree view for arbitrary data | | | 📕 |
| ColorPicker | A comprehensive color picker with form input | | | ✔️ |
| Tabs | Shows one out of several panels, selectable through tab headers | | | ✔️ |
| ProgressBar | A progress bar with a text indicator | | | ✔️ |
| Accordion | Shows one out of several panels, selectable through accordion headers | | | ✔️ |
| Carousel | Shows one out of several panels that slide and animate horizontally | | | 🚧 |
| Slider | A range value picker with stops and multiple handles | | | ✔️ |
| TimePicker | A formatted date and time picker with calendar and clock | | | ✔️ |
| Gallery | Scales multiple images to fill each row | | | ✔️ |
| Wheel-scrolling | Custom mouse wheel scrolling | | | 📕 |

✔️ Included in the bundle<br>
➕ Can be added separately (not in the bundle)<br>
📕 Implemented but not documented yet<br>
🚧 Not developed or fully ported to Frontfire 2 yet


Installation
------------
To use **Frontfire Core** with **separate** files, include it like this:

```html
<script src="arraylist.min.js"></script>
<!-- color.js and datacolor.js are optional, depends on your usage -->
<script src="frontfire-core.min.js"></script>
```

To use **Frontfire UI** with **separate** files, include it like this:

```html
<script src="arraylist.min.js"></script>
<script src="color.min.js"></script>
<!-- datacolor.js is optional, depends on your usage -->
<script src="frontfire-core.min.js"></script>
<script src="frontfire-ui-complete.min.js"></script><!-- alternatively, -minimal -->

<link rel="stylesheet" href="frontfire-ui-complete.min.css"><!-- alternatively, -minimal -->
```

(You can also use frontfire-core-*singlefile*.js and frontfire-ui-complete/minimal.js together.)

To use **Frontfire Core** with a **single** file, include it like this:

```html
<script src="frontfire-core-singlefile.min.js"></script>
<!-- includes arraylist.js -->
```

To use **Frontfire UI** with a **single** file, include it like this:

```html
<script src="frontfire-ui-complete-singlefile.min.js"></script><!-- alternatively, -minimal -->

<link rel="stylesheet" href="frontfire-ui-complete.min.css"><!-- alternatively, -minimal -->
```

It is best-practice to include all stylesheets at the end of the HTML `<head>` and all scripts at the end of the HTML `<body>` element. Then include your site-specific styles and scripts after the library files to be able to customise the library’s styles and build upon its scripts.

```html
<head>
	...
	<link rel="stylesheet" href="lib/frontfire/css/frontfire-ui-complete.min.css">
	<!-- followed by your site-specific styles: -->
	<link rel="stylesheet" href="css/site.min.css">
</head>
<body>
	...
	<script src="lib/frontfire/js/frontfire-ui-complete-singlefile.min.js"></script>
	<!-- followed by your site-specific scripts: -->
	<script src="js/site.min.js"></script>
</body>
```


Building
--------
Frontfire is written in modern JavaScript and Sass. The distribution JavaScript and CSS files are built with a set of public tools (CSS: sass, csso; JavaScript: rollup, uglifyjs) bundled in my **[Mini Web Compiler](https://github.com/ygoe/MiniWebCompiler)** application for Windows. It glues all the tools together so that they actually work. Version 1.3.1 or newer is required.

Building from source is **not necessary** if you just use Frontfire. In version 2, almost all Sass variables have been converted to CSS custom properties (“CSS variables”) which you can modify directly from your own stylesheets, now fully dynamically in the browser and even selectively for parts of the document.

When building your own version, you can leave out certain modules that you don’t need so you can further reduce the file size.


Requirements
------------
Frontfire 2 is a standalone library, there are no external dependencies. It is built from the ground up to support modern and widespread web browsers.

**Supported browsers**

* ✔️ Mozilla Firefox
* ✔️ Google Chrome (and all Chromium-based browsers such as Microsoft Edge, Brave and Opera)
* ✔️ Apple Safari (by spec; little tested due to the lack of Apple hardware)

**Unsupported browsers**

These are not considered modern and lack too many features to be productive.

* ❌ Microsoft Internet Explorer (end of life since mid 2022)
* ❌ Older versions of Microsoft Edge (not Chromium-based; not available for testing anymore)
* ❌ Any browser version released more than roughly 2 years ago (these are outdated and insecure)


Why not…
--------
Why have I created a new UI library and not used one of the established solutions back in 2018? Here are a few things to compare.

Note that this section is pretty historical and incomplete. There are too many web UI libraries and frameworks out there to provide a thorough overview here. I made this because I was not satisfied with the alternatives I knew and was more interested in building my own than learning and comparing all the others. And so far, after numerous web sites and apps with different backend languages and architectures, I am very happy with this decision.


### Bootstrap

Bootstrap’s main point is its responsive grid feature. Nearly everything is based on it. My experience with real-world websites though is that the grid is not flexible enough. The grid cannot be used to shrink the top navigation bar just when it needs to. The grid cannot be used to relayout text and images when space runs out. And images can be any arbitrary size. So I still ended up defining my own break points and all the media query logic behind it. Customising responsive layouts requires lots of complex CSS code to undo Bootstrap’s defaults (at least in version 4). Instead of using Bootstrap and then undoing half of it, I decided to redo just the half I needed, in the way I needed it.


### jQuery UI

jQuery UI’s set of widgets is very limited to start with. The other main disadvantage is that it is entirely touch-unaware. The only input method it supports is a mouse. While there is a compatibility shim library that translates touch to mouse events, it still has two disadvantages: It only supports touch, not the generic pointer events that also include the stylus, and it inherits the limitations of mouse events, i.e. it cannot support multi-touch. And the file size of jQuery UI is just way too large for what it can do.

In 2022, jQuery is increasingly considered legacy and I see efforts in removing dependencies on it. This is also followed with Frontfire 2 which completely replaces the base layer that jQuery provided. Most of it is now available in standard browser JavaScript anyway.
