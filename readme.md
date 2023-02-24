Frontfire Web Frontend Toolkit
==============================

<img src="logo/frontfire.svg" width="150">

The Frontfire Web Frontend Toolkit offers essential styles and effects combined with a consistent set of interactive widgets and layout utilities. It is suitable for web pages and web applications that need a modern and consistent look and feel and use responsive design to work on all devices and screen sizes. All interactions are fully touch-aware and work with any type of pointing device. The default style equally supports light and dark theme.

While [Frontfire version 1](https://github.com/ygoe/Frontfire1) (which as a work in progress never actually used version numbers) was made as a jQuery plugin, version 2 comes in two parts: **Core**, basically replacing jQuery, and **UI**, building with plugins upon Core.

Frontfire is published under the [MIT licence](license.txt). Please leave a ⭐ star on this reporitory if you like or use it to help others find it, too. Thank you!


Documentation
-------------
The API documentation describes all class methods and properties in detail and includes some examples.

📕 **[Online documentation](https://ygoe.de/tmp/frontfire2/)**

In the checked-out repository or the release archive the [documentation is here](doc/index.html).


Download
--------
📦 **[Full package: all bundles and variants](https://github.com/ygoe/Frontfire2/releases)**

⏭ [Change log](https://ygoe.de/tmp/frontfire2/changes.html) (online documentation)

🚀 [Installation](https://ygoe.de/tmp/frontfire2/frontfire-ui-installation.html) (online documentation)

There are currently no CDN offerings available so you have to host the files yourself. This is the preferred method anyway since CDNs often make websites slower, less reliable and come with privacy implications.

The following is the content of the archive. All files in readable and minified form, with source map. Descriptions of bundles and variants below. All file sizes measured with GZip compression (brotli isn’t any better here).


### JavaScript files

| ▾ Bundle ╲ Variant ▸  | Separate files | Single file (includes all above) |
|-----------------------|----------------|-------------|
| ArrayList             | arraylist.js<br>arraylist.min.js (3.0 KiB) | – |
| Frontfire Core        | frontfire-core.js<br>frontfire-core.min.js (10 KiB) | frontfire-core-singlefile.js<br>frontfire-core-singlefile.min.js (13 KiB) |
| Frontfire UI Minimal  | frontfire-ui-minimal.js<br>frontfire-ui-minimal.min.js (16 KiB) | frontfire-ui-minimal-singlefile.js<br>frontfire-ui-minimal-singlefile.min.js (28 KiB) |
| Color                 | color.js<br>color.min.js (2.6 KiB) | – |
| DataColor             | datacolor.js<br>datacolor.min.js (1.2 KiB) | – |
| Frontfire UI Complete | frontfire-ui-complete.js<br>frontfire-ui-complete.min.js (38 KiB) | frontfire-ui-complete-singlefile.js<br>frontfire-ui-complete-singlefile.min.js (53 KiB) |


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
* Simple usage as you just include one JavaScript and one CSS file and have all the bundle’s features available
* Further reduces transfer size due to combined compression advantages


Features
--------

| Feature | Description | Core | UI Minimal | UI Complete |
|---------|-------------|:----:|:----------:|:-----------:|
| ArrayList | A comfortable array collection | ✔️️ | ✔️️ | ✔️️ |
| Browser | Browser identification and information | ✔️ | ✔️ | ✔️ |
| DOM | Easy DOM access on a low level | ✔️ | ✔️ | ✔️️ |
| Events | Easy event handling | ✔️️ | ✔️️ | ✔️ |
| Forms | Easy form data handling and validation | 🚧 | 🚧 | 🚧 |
| Network | Fetch HTTP JSON/text resources (AJAX) | ✔️ | ✔️ | ✔️ |
| Dimmer | Dimmed page background for modals | | ✔️ | ✔️ |
| Draggable | Supports primitive drag interactions on elements | | ✔️ | ✔️ |
| Dropdown | A panel that opens besides an element | | ✔️ | ✔️ |
| Input | Enhances several form input elements (RepeatButton, Spinner, ToggleButton, CheckBox, auto-height textarea, submit lock) | | ✔️ | ✔️ |
| Menu | A menu bar with dropdown submenus | | ✔️ | ✔️ |
| Message | Closable inline messages | | ✔️ | ✔️ |
| Modal | A modal panel that overlays the page | | ✔️ | ✔️ |
| Notification | Short pop-up notifications | | ✔️ | ✔️ |
| OffCanvas | A panel that opens from the side of the page | | 📕 | 📕 |
| Resizable | Supports primitive resize interactions on elements | | 🚧 | 🚧 |
| Selectable | Enhanced list boxes and dropdown select boxes | | ✔️ | ✔️ |
| Sortable | Supports primitive reorder interactions on the children of an element | | ✔️ | ✔️ |
| Table | Designs last visible table column/row | | ✔️ | ✔️ |
| Color | Colour conversion, computation and palette | ➕ | ➕ | ✔️ |
| Accordion | Shows one out of several panels, selectable through accordion headers | | | ✔️ |
| Carousel | Shows one out of several panels that slide and animate horizontally | | | ✔️ |
| ColorPicker | A comprehensive color picker with form input | | | ✔️ |
| Gallery | Scales multiple images to fill each row | | | ✔️ |
| ProgressBar | A progress bar with a text indicator | | | ✔️ |
| Slider | A range value picker with stops and multiple handles | | | ✔️ |
| Tabs | Shows one out of several panels, selectable through tab headers | | | ✔️ |
| TimePicker | A formatted date and time picker with calendar and clock | | | ✔️ |
| ToggleSwitch | A simple and nice toggle switch | | | 📕 |
| TreeView | A tree view for arbitrary data | | | 📕 |
| Wheel-scrolling | Custom mouse wheel scrolling | | | 📕 |

✔️ Included in the bundle<br>
➕ Can be added separately (not in the bundle)<br>
📕 Implemented but not documented yet<br>
🚧 Not developed or fully ported to Frontfire 2 yet


Building
--------
Frontfire is written in modern JavaScript and Sass. The distribution JavaScript and CSS files are built with a set of public tools (CSS: sass, csso; JavaScript: rollup, uglifyjs) bundled in my **[Mini Web Compiler](https://github.com/ygoe/MiniWebCompiler)** application for Windows. It glues all the tools together so that they actually work. Version 2.3.0 or newer is required.

Building from source is **not necessary** if you just use Frontfire. In version 2, all Sass variables (except responsive layout break points) have been converted to CSS custom properties (“CSS variables”) which you can modify directly from your own stylesheets, now fully dynamically in the browser and even selectively for parts of the document.

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
