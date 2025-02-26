/*! color.js v2.0.0 | @license MIT | ygoe.de */
/* build-dir(build) */

// Encoding: UTF-8 without BOM (auto-detect: °°°°°) for built-in color names

// Copyright (c) 2022-2023, Yves Goergen, https://ygoe.de
// All rights reserved.
//
// Redistribution and use in source and binary forms, with or without modification, are permitted
// provided that the following conditions are met:
//
// * Redistributions of source code must retain the above copyright notice, this list of conditions
//   and the following disclaimer.
// * Redistributions in binary form must reproduce the above copyright notice, this list of
//   conditions and the following disclaimer in the documentation and/or other materials provided
//   with the distribution.
//
// THIS SOFTWARE IS PROVIDED BY THE COPYRIGHT HOLDERS AND CONTRIBUTORS "AS IS" AND ANY EXPRESS OR
// IMPLIED WARRANTIES, INCLUDING, BUT NOT LIMITED TO, THE IMPLIED WARRANTIES OF MERCHANTABILITY AND
// FITNESS FOR A PARTICULAR PURPOSE ARE DISCLAIMED. IN NO EVENT SHALL THE COPYRIGHT HOLDER OR
// CONTRIBUTORS BE LIABLE FOR ANY DIRECT, INDIRECT, INCIDENTAL, SPECIAL, EXEMPLARY, OR
// CONSEQUENTIAL DAMAGES (INCLUDING, BUT NOT LIMITED TO, PROCUREMENT OF SUBSTITUTE GOODS OR
// SERVICES; LOSS OF USE, DATA, OR PROFITS; OR BUSINESS INTERRUPTION) HOWEVER CAUSED AND ON ANY
// THEORY OF LIABILITY, WHETHER IN CONTRACT, STRICT LIABILITY, OR TORT (INCLUDING NEGLIGENCE OR
// OTHERWISE) ARISING IN ANY WAY OUT OF THE USE OF THIS SOFTWARE, EVEN IF ADVISED OF THE
// POSSIBILITY OF SUCH DAMAGE.

(function (undefined) {
	"use strict";

	var canvasContext;


	// ==================== Constructor ====================

	// Parses any color value understood by a browser into an object with r, g, b, a properties.
	function Color(value) {
		// Allow calling without "new" keyword
		// NOTE: new.target cannot be used, it does something else and breaks everything.
		if (!(this instanceof Color))
			return new Color(value);

		if (value === undefined || value === null)
			value = "";

		if (typeof value === "string") {
			if (value === "") {
				this.format = "CSS";
				this.r = this.g = this.b = this.a = 0;
				return;
			}

			this.format = value.match(/^rgba?\(/) ? "CSS" : "HTML";

			// Add "#" prefix if missing and the data is otherwise looking good (3/4/6/8 hex digits)
			if (value.match(/^\s*[0-9A-Fa-f]{3}([0-9A-Fa-f]|[0-9A-Fa-f]{3}([0-9A-Fa-f]{2})?)?\s*$/))
				value = "#" + value.trim();

			// Let the browser do the work
			const div = document.createElement("div");
			div.style.display = "none";
			document.body.appendChild(div);   // required for getComputedStyle
			div.style.color = value;
			const color = getComputedStyle(div).color;
			div.remove();
			// CSS Level 1 syntax: rgb[a](r, g, b, a)
			let match = color.match(/rgba?\(\s*([0-9.]+)\s*,\s*([0-9.]+)\s*,\s*([0-9.]+)\s*(?:,\s*([0-9.]+)\s*)?\)/);
			if (!match)
				// CSS Colors Level 4 space-separated syntax: rgb[a](r g b / a)
				match = color.match(/rgba?\(\s*([0-9.]+)\s+([0-9.]+)\s+([0-9.]+)\s*(?:\/\s*([0-9.]+)\s*)?\)/);
			if (match) {
				this.r = clamp255(Number(match[1]));
				this.g = clamp255(Number(match[2]));
				this.b = clamp255(Number(match[3]));
				this.a = match[4] !== undefined ? clamp1(Number(match[4])) : 1;
				return;
			}
			// Computed style always returns rgb() colors, never hsl() even if defined so

			// Browser wasn't in the mood (probably Chrome with a named color), try harder
			if (!canvasContext) {
				const canvas = document.createElement("canvas");
				canvas.setAttribute("width", "1");
				canvas.setAttribute("height", "1");
				canvasContext = canvas.getContext("2d");
				canvasContext.globalCompositeOperation = "copy";   // required for alpha channel
			}
			canvasContext.fillStyle = value;
			canvasContext.fillRect(0, 0, 1, 1);
			var data = canvasContext.getImageData(0, 0, 1, 1).data;
			this.r = data[0];
			this.g = data[1];
			this.b = data[2];
			this.a = round(data[3] / 255, 3);
			// If this is wrong, the named color probably doesn't exist, but we can't detect it
			return;
		}

		if (typeof value === "number") {
			this.format = "IntARGB";
			this.r = (value >> 16) & 0xff;
			this.g = (value >> 8) & 0xff;
			this.b = value & 0xff;
			const a = (value >> 24) & 0xff;
			this.a = a !== 0 ? round(a / 255, 3) : 1;
			return;
		}

		if (typeof value === "object") {
			if (Array.isArray(value)) {
				this.format = "Array";
				this.r = clamp255(value[0]);
				this.g = clamp255(value[1]);
				this.b = clamp255(value[2]);
				this.a = value.length > 3 ? clamp1(value[3]) : 1;
			}
			else {
				this.format = value.format !== undefined ? value.format : "Object";
				this.r = clamp255(value.r);
				this.g = clamp255(value.g);
				this.b = clamp255(value.b);
				this.a = value.a !== undefined ? clamp1(value.a) : 1;
				if (value.h !== undefined && value.s !== undefined && value.l !== undefined) {
					this.h = clamp360(value.h);
					this.s = clamp1(value.s);
					this.l = clamp1(value.l);
				}
			}
			return;
		};

		console.error("Invalid color:", value);
		throw new Error("Invalid color: " + value);
	}

	// Shorter names for minified code
	const Color_prototype = Color.prototype;


	// ==================== Public methods ====================

	// Formats the color in the format it was originally parsed from.
	Color_prototype.toString = function () {
		switch (this.format) {
			case "IntARGB":
				return this.toIntARGB() + "";
			case "HTML":
				return this.toHTML();
			case "CSS":
			default:
				return this.toCSS();
		}
	};

	// Formats a color object into a CSS rgb() string.
	Color_prototype.toCSS = function (spaceSeparated) {
		if (spaceSeparated)
			return "rgb(" + this.r + " " + this.g + " " + this.b +
				(this.a === undefined || this.a === 1 ? "" : " / " + round(this.a, 3)) +
				")";
		if (this.a === undefined || this.a === 1)
			return "rgb(" + this.r + ", " + this.g + ", " + this.b + ")";
		return "rgb(" + this.r + ", " + this.g + ", " + this.b + ", " + round(this.a, 3) + ")";
	};

	// Formats a color object into a CSS hsl() string.
	Color_prototype.toCSSHSL = function (spaceSeparated) {
		if (this.h === undefined)
			this.updateHSL();
		if (spaceSeparated)
			return "hsl(" + round(this.h) + " " + round(this.s * 100) + "% " + round(this.l * 100) + "%" +
				(this.a === undefined || this.a === 1 ? "" : " / " + round(this.a, 3)) +
				")";
		if (this.a === undefined || this.a === 1)
			return "hsl(" + round(this.h) + ", " + round(this.s * 100) + "%, " + round(this.l * 100) + "%)";
		return "hsl(" + round(this.h) + ", " + round(this.s * 100) + "%, " + round(this.l * 100) + "%, " + round(this.a, 3) + ")";
	};

	// Formats a color object into an HTML hexadecimal string.
	Color_prototype.toHTML = function () {
		function conv(number) {
			return (number < 16 ? "0" : "") +
				round(clamp255(number)).toString(16).toLowerCase();
		}

		let str = "#" + conv(this.r) + conv(this.g) + conv(this.b);
		if (this.a !== undefined && this.a !== 1)
			str += conv(this.a * 255);
		return str;
	};

	// Converts a color object into an integer number like 0xAARRGGBB.
	Color_prototype.toIntARGB = function () {
		// NOTE: Bit shifting cannot be used because it overflows at 31 bit in JavaScript.
		return ((this.a !== undefined ? round(clamp1(this.a) * 255) : 255) * 256 * 256 * 256) +
			(round(clamp255(this.r)) * 256 * 256) +
			(round(clamp255(this.g)) * 256) +
			round(clamp255(this.b));
	};

	// Converts a color object into an array with [r, g, b, a].
	Color_prototype.toArray = function () {
		const arr = [this.r, this.g, this.b];
		if (this.a !== undefined && this.a !== 1)
			arr.push[this.a * 255];
		return arr;
	};

	// Calculates the HSL components from the RGB components in the color object.
	Color_prototype.updateHSL = function () {
		this.r = clamp255(this.r);
		this.g = clamp255(this.g);
		this.b = clamp255(this.b);

		const r = this.r / 255;
		const g = this.g / 255;
		const b = this.b / 255;
		const min = Math.min(r, g, b);
		const max = Math.max(r, g, b);

		if (max === min)
			this.h = 0;
		else if (max === r)
			this.h = (60 * (g - b) / (max - min)) % 360;
		else if (max === g)
			this.h = (60 * (b - r) / (max - min) + 120) % 360;
		else // if (max === b)
			this.h = (60 * (r - g) / (max - min) + 240) % 360;
		if (this.h < 0)
			this.h += 360;

		this.s = 0;   // Just for the order of the properties
		this.l = (max + min) / 2;

		if (max === min)
			this.s = 0;
		else if (this.l <= 0.5)
			this.s = (max - min) / (2 * this.l);
		else
			this.s = (max - min) / (2 - 2 * this.l);
		return this;
	};

	// Calculates the RGB components from the HSL components in the color object.
	Color_prototype.updateRGB = function () {
		this.h = clamp360(this.h);
		this.s = clamp1(this.s);
		this.l = clamp1(this.l);

		const q = this.l < 0.5 ?
			this.l * (1 + this.s) :
			this.l + this.s - this.l * this.s;
		const p = 2 * this.l - q;
		const h = this.h / 360;   // Normalise hue to 0..1
		const t = { r: h + 1 / 3, g: h, b: h - 1 / 3 };

		var that = this;
		["r", "g", "b"].forEach(function (c) {
			if (t[c] < 0) t[c]++;
			if (t[c] > 1) t[c]--;
			if (t[c] < 1 / 6)
				that[c] = p + ((q - p) * 6 * t[c]);
			else if (t[c] < 1 / 2)
				that[c] = q;
			else if (t[c] < 2 / 3)
				that[c] = p + ((q - p) * 6 * (2 / 3 - t[c]));
			else
				that[c] = p;
			that[c] = round(that[c] * 255);
		});
		if (this.a === undefined) this.a = 1;
		return this;
	};

	// Returns a blended color with the specified ratio from 0 (no change) to 1 (only other color).
	// All R/G/B/A values are blended separately.
	Color_prototype.blendWith = function (other, ratio, includeAlpha) {
		const isHSL = this.h !== undefined || other.h !== undefined;
		const color = new Color(this);
		other = new Color(other);
		ratio = clamp1(ratio);
		["r", "g", "b"].forEach(c => {
			color[c] = clamp255(round(extend255(color[c]) + (extend255(other[c]) - extend255(color[c])) * ratio));
		});
		if (includeAlpha)
			color.a = round(color.a + (other.a - color.a) * ratio, 3);
		if (isHSL)
			color.updateHSL();
		return color;
	};

	// Returns a blended color with the specified ratio from 0 (no change) to 1 (only other color).
	// The H value is blended on the short or long path around the circle, S/L/A values are blended normally.
	Color_prototype.blendWithHSL = Color_prototype.blendByHueWith = function (other, ratio, includeAlpha, largeArc) {
		const color = new Color(this);
		if (!(other instanceof Color))
			other = new Color(other);
		if (color.h === undefined)
			color.updateHSL();
		if (other.h === undefined)
			other.updateHSL();
		ratio = clamp1(ratio);

		// If either color has no saturation, set its hue to the other's
		if (color.s === 0 && other.s !== 0)
			color.h = other.h;
		if (other.s === 0 && color.s !== 0)
			other.h = color.h;

		// Blend hue on the short path around the circle
		if (color.h < other.h) {
			if (!largeArc && other.h - color.h < 180 ||
				largeArc && other.h - color.h >= 180) {
				// Clockwise
				color.h = round(color.h + (other.h - color.h) * ratio, 3);
			}
			else {
				// Counter-clockwise with overflow
				const h = other.h - 360;
				color.h = round(color.h + (h - color.h) * ratio, 3);
				if (color.h < 0)
					color.h += 360;
			}
		}
		else {
			if (!largeArc && color.h - other.h < 180 ||
				largeArc && color.h - other.h >= 180) {
				// Counter-clockwise
				color.h = round(color.h + (other.h - color.h) * ratio, 3);
			}
			else {
				// Clockwise with overflow
				const h = color.h - 360;
				color.h = round(h + (other.h - h) * ratio, 3);
				if (color.h < 0)
					color.h += 360;
			}
		}

		["s", "l"].forEach(function (c) {
			color[c] = clamp1(round(color[c] + (other[c] - color[c]) * ratio, 3));
		});
		if (includeAlpha)
			color.a = round(color.a + (other.a - color.a) * ratio, 3);
		color.updateRGB();
		return color;
	};

	// Returns the inverted (negative) color.
	Color_prototype.invert = function () {
		return processColor(this, false, function () {
			this.r = 255 - clamp255(this.r);
			this.g = 255 - clamp255(this.g);
			this.b = 255 - clamp255(this.b);
		});
	};

	// Returns the complementary color.
	Color_prototype.complement = function () {
		return processColor(this, true, function () {
			this.h = (this.h + 180) % 360;
		});

		// TODO: Add an option to return multiple complementary colors, as array
	};

	// Returns a color that is lighter by the factor between 0 (unchanged) and 1 (white).
	Color_prototype.lighten = function (factor) {
		return processColor(this, true, function () {
			this.l = clamp1(this.l + clamp1(factor) * (1 - this.l));
		});
	};

	// Returns a color that is darker by the factor between 0 (unchanged) and 1 (black).
	Color_prototype.darken = function (factor) {
		return processColor(this, true, function () {
			this.l = clamp1(this.l * (1 - clamp1(factor)));
		});
	};

	// TODO: Add functions to (de)saturate the color (similar to lighten and darken?)

	// Returns a color with a changed alpha value between 0 (transparent) and 1 (opaque).
	Color_prototype.alpha = function (alpha) {
		return processColor(this, false, function () {
			this.a = clamp1(alpha);
		});
	};

	// Returns the grayscale color by perceived brightness.
	Color_prototype.gray = Color_prototype.grey = function () {
		return processColor(this, false, function () {
			const value = round(clamp255(this.r) * 0.3 + clamp255(this.g) * 0.59 + clamp255(this.b) * 0.11);
			this.r = value;
			this.g = value;
			this.b = value;
		});
	};

	// Returns a value indicating whether the specified color is dark.
	Color_prototype.isDark = function () {
		return this.gray().r < 144;
	};

	// Returns white or black as suitable for the text color over the background color.
	Color_prototype.text = function () {
		return processColor(this, false, function () {
			const value = this.isDark() ? 255 : 0;
			this.r = value;
			this.g = value;
			this.b = value;
			this.a = 1;
		});
	};

	const colorNames = {
		de: {
			transparent: "transparent",
			black: "schwarz",
			gray: "grau",
			white: "weiß",
			red: "rot",
			orange: "orange",
			yellow: "gelb",
			green: "grün",
			cyan: "türkis",
			blue: "blau",
			purple: "lila",
			pink: "pink",
			brown: "braun",
			dark: "dunkel%",
			light: "hell%",
			pale: "blass%",
		},
		en: {
			transparent: "transparent",
			black: "black",
			gray: "grey",
			white: "white",
			red: "red",
			orange: "orange",
			yellow: "yellow",
			green: "green",
			cyan: "cyan",
			blue: "blue",
			purple: "purple",
			pink: "pink",
			brown: "brown",
			dark: "dark %",
			light: "light %",
			pale: "pale %",
		},
		"en-ca": {
			gray: "gray",
		},
		"en-us": {
			gray: "gray",
		},
	};

	// Returns a simple description of the color.
	Color_prototype.description = function (language) {
		const color = new Color(this);
		if (color.h === undefined)
			color.updateHSL();
		if (color.h === undefined || isNaN(color.h))
			return null;
		language = language || document.documentElement.lang;
		if (!(language in colorNames))
			language = "en";
		const names = colorNames[language];
		if (color.a < 0.02)
			return names.transparent;
		// Normalise values for development with a color tool
		const h = color.h / 360 * 255;
		const s = color.s * 255;
		const l = color.l * 255;
		if (l < 30)
			return names.black;
		if (l > 240)
			return names.white;

		const colorName =
			h < 15 ? names.red :
			h < 33 ? names.orange :
			h < 49 ? names.yellow :
			h < 111 ? names.green :
			h < 138 ? names.cyan :
			h < 180 ? names.blue :
			h < 207 ? names.purple :
			h < 238 ? names.pink :
			names.red;
		// Determines the saturation up to which the colour is grey (depending on the lightness)
		const graySaturation = l => {
			if (l < 128)
				return 90 + (30 - 90) * (l - 30) / (128 - 30);
			else
				return 30 + (90 - 30) * (l - 128) / (240 - 128);
		};
		if (l < 100) {
			if (s < graySaturation(l))
				return names.dark.replace("%", names.gray);
			else if (colorName === names.orange)
				return names.brown;
			else
				return names.dark.replace("%", colorName);
		}
		if (l > 190) {
			if (s < graySaturation(l))
				return names.light.replace("%", names.gray);
			else
				return names.light.replace("%", colorName);
		}
		if (s > 170)
			return colorName;
		if (s < graySaturation(l))
			return names.gray;
		else
			return names.pale.replace("%", colorName);
	};


	// ==================== Private methods ====================

	function processColor(color, hslMode, fn) {
		color = new Color(color);   // Make a copy
		if (hslMode)
			color.updateHSL();
		fn.call(color);
		if (hslMode)
			color.updateRGB();
		else if (color.h !== undefined)
			color.updateHSL();
		return color;
	}

	function extend255(value) {
		return value === 255 ? 256 : value;
	}

	function clamp1(value) {
		return clamp(0, value, 1);
	}

	function clamp255(value) {
		return clamp(0, value, 255);
	}

	function clamp360(value) {
		return clamp(0, value, 360);
	}

	// Returns the value in the range between min and max.
	function clamp(min, value, max) {
		return Math.max(min, Math.min(value, max));
	}

	// Returns the value rounded to the specified number of decimals.
	function round(value, decimals) {
		if (decimals === undefined) decimals = 0;
		const precision = Math.pow(10, decimals);
		return Math.round(value * precision) / precision;
	}


	// ==================== Exports ====================

	// Environment detection
	if (typeof module === "object" && typeof module.exports === "object") {
		// Node.js
		module.exports = Color;
	}
	else {
		// Global object
		window.Color = Color;
	}
})();
