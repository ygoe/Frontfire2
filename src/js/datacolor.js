/*! datacolor.js v2.0.0-beta.2 | @license MIT | ygoe.de */
/* build-dir(build) */

// Encoding: UTF-8 without BOM (auto-detect: °°°°°) for built-in color names

// Copyright (c) 2022, Yves Goergen, https://ygoe.de
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


	// ==================== Constructor ====================

	function DataColor() {
	}

	// Color palette definition
	const colorData = {
		// color entry keys:
		// - primary: part of the primary set
		// - h: hue
		// - sl: saturation, light theme
		// - ll: lightness, light theme
		// - sd: saturation, dark theme
		// - ld: lightness, dark theme
		// saturation/lightness type keys:
		// - f0: main foreground
		// - f1: light foreground
		// - f2: lighter foreground
		// - b0: light background
		// - b1: strong background
		red: {
			primary: true,
			h: 5,
			sl: { f0: 85, f1: 85, f2: 85, b0: 85, b1: 85 },
			ll: { f0: 55, f1: 75, f2: 88, b0: 96, b1: 75 },
			sd: { f0: 85, f1: 85, f2: 85, b0: 65, b1: 65 },
			ld: { f0: 55, f1: 38, f2: 27, b0: 14, b1: 38 }
		},
		orange: {
			h: 30,
			sl: { f0: 95, f1: 95, f2: 95, b0: 95, b1: 75 },
			ll: { f0: 55, f1: 75, f2: 89, b0: 95, b1: 75 },
			sd: { f0: 95, f1: 95, f2: 95, b0: 75, b1: 75 },
			ld: { f0: 55, f1: 38, f2: 27, b0: 13, b1: 36 }
		},
		yellow: {
			primary: true,
			h: 47,
			sl: { f0: 100, f1: 100, f2: 100, b0: 100, b1: 70 },
			ll: { f0: 50, f1: 72, f2: 86, b0: 94, b1: 72 },
			sd: { f0: 100, f1: 100, f2: 100, b0: 85, b1: 85 },
			ld: { f0: 50, f1: 36, f2: 25, b0: 11, b1: 33 }
		},
		olive: {
			h: 70,
			sl: { f0: 80, f1: 80, f2: 80, b0: 80, b1: 55 },
			ll: { f0: 45, f1: 68, f2: 82, b0: 92, b1: 68 },
			sd: { f0: 80, f1: 80, f2: 80, b0: 60, b1: 60 },
			ld: { f0: 45, f1: 33, f2: 23, b0: 11, b1: 33 }
		},
		green: {
			primary: true,
			h: 110,
			sl: { f0: 75, f1: 75, f2: 75, b0: 75, b1: 50 },
			ll: { f0: 45, f1: 68, f2: 83, b0: 95, b1: 68 },
			sd: { f0: 75, f1: 75, f2: 75, b0: 55, b1: 50 },
			ld: { f0: 45, f1: 33, f2: 23, b0: 12, b1: 33 }
		},
		cyan: {
			h: 175,
			sl: { f0: 80, f1: 80, f2: 80, b0: 80, b1: 45 },
			ll: { f0: 45, f1: 68, f2: 84, b0: 95, b1: 68 },
			sd: { f0: 80, f1: 80, f2: 80, b0: 60, b1: 60 },
			ld: { f0: 45, f1: 32, f2: 21, b0: 11, b1: 32 }
		},
		blue: {
			primary: true,
			h: 210,
			sl: { f0: 80, f1: 80, f2: 80, b0: 80, b1: 55 },
			ll: { f0: 50, f1: 72, f2: 87, b0: 96, b1: 72 },
			sd: { f0: 80, f1: 80, f2: 80, b0: 60, b1: 60 },
			ld: { f0: 50, f1: 35, f2: 25, b0: 15, b1: 36 }
		},
		darkblue: {
			h: 245,
			sl: { f0: 70, f1: 70, f2: 70, b0: 70, b1: 55 },
			ll: { f0: 57, f1: 75, f2: 89, b0: 97, b1: 75 },
			sd: { f0: 70, f1: 70, f2: 70, b0: 50, b1: 50 },
			ld: { f0: 54, f1: 44, f2: 34, b0: 18, b1: 37 }
		},
		purple: {
			primary: true,
			h: 280,
			sl: { f0: 80, f1: 80, f2: 80, b0: 80, b1: 55 },
			ll: { f0: 55, f1: 75, f2: 89, b0: 97, b1: 75 },
			sd: { f0: 80, f1: 80, f2: 80, b0: 60, b1: 55 },
			ld: { f0: 55, f1: 38, f2: 27, b0: 15, b1: 38 }
		},
		pink: {
			h: 320,
			sl: { f0: 80, f1: 80, f2: 80, b0: 80, b1: 55 },
			ll: { f0: 60, f1: 77, f2: 90, b0: 97, b1: 77 },
			sd: { f0: 80, f1: 80, f2: 80, b0: 60, b1: 50 },
			ld: { f0: 60, f1: 40, f2: 29, b0: 14, b1: 40 }
		},
	};

	// Color names in different languages
	const colorNames = {
		de: {
			red: "Rot",
			orange: "Orange",
			yellow: "Gelb",
			olive: "Oliv",
			green: "Grün",
			cyan: "Türkis",
			blue: "Blau",
			darkblue: "Tiefblau",
			purple: "Violett",
			pink: "Rosa"
		},
		en: {
			red: "Red",
			orange: "Orange",
			yellow: "Yellow",
			olive: "Olive",
			green: "Green",
			cyan: "Cyan",
			blue: "Blue",
			darkblue: "Darkblue",
			purple: "Purple",
			pink: "Pink"
		},
	};


	// ==================== Static functions ====================

	// Gets the IDs of the color palette.
	DataColor.getColorIds = function () {
		return Object.keys(colorData);
	};

	// Gets the localized name of a color.
	DataColor.getName = function (colorId, language) {
		language = language || document.documentElement.lang;
		if (!(language in colorNames))
			language = "en";
		const names = colorNames[language];
		return names[colorId];
	};

	// Determines whether a color is a primary color.
	DataColor.isPrimary = function (colorId) {
		const colorEntry = colorData[colorId];
		if (!colorEntry)
			return undefined;
		return !!colorEntry.primary;
	};

	// Gets the color specified by its ID, type and theme.
	DataColor.getColor = function (colorId, type, darkTheme) {
		const colorEntry = colorData[colorId];
		if (!colorEntry)
			return undefined;
		let hue = colorEntry.h;
		let saturation = colorEntry["s" + (darkTheme ? "d" : "l")][type];
		let lightness = colorEntry["l" + (darkTheme ? "d" : "l")][type];
		return `hsl(${hue}, ${saturation}%, ${lightness}%)`;
	};

	// Gets a custom color specified by its hue, type and theme.
	DataColor.getFreeColor = function (hue, type, darkTheme) {
		const ids = Object.keys(colorData);
		hue = mod360(hue);
		let prevId, nextId;
		for (let id in colorData) {
			if (colorData[id].h > hue) {
				nextId = id;
				break;
			}
			prevId = id;
		}
		if (!prevId)
			prevId = ids[ids.length - 1];
		if (!nextId)
			nextId = ids[0];
		const range = mod360(colorData[nextId].h - colorData[prevId].h);
		const offset = mod360(hue - colorData[prevId].h);
		const rel = offset / range;
		//console.log("hue:", hue, "prev:", prevId, colorData[prevId].h, "next:", nextId, colorData[nextId].h, "rel:", rel);
		const t = darkTheme ? "d" : "l";
		const sMin = colorData[prevId]["s" + t][type];
		const sRange = colorData[nextId]["s" + t][type] - colorData[prevId]["s" + t][type];
		const lMin = colorData[prevId]["l" + t][type];
		const lRange = colorData[nextId]["l" + t][type] - colorData[prevId]["l" + t][type];
		//console.log("sMin:", sMin, "sRange:", sRange, "lMin:", lMin, "lRange:", lRange);
		const s = Math.round((sMin + rel * sRange) * 100) / 100;
		const l = Math.round((lMin + rel * lRange) * 100) / 100;
		//console.log(hue, s, l);
		return `hsl(${hue}, ${s}%, ${l}%)`;
	}

	// Gets the hue of an interpolated color from a range between 0 and 1.
	// The return value can be used with the getFreeColor function.
	DataColor.getFreeHue = function (x) {
		if (x < 0 || x >= 1) x = 0;
		const ids = Object.keys(colorData);
		const i0 = Math.trunc(ids.length * x);
		const i1 = (i0 + 1) % ids.length;
		const rel = (ids.length * x) - i0;
		//console.log(i0, i1, rel);
		const prevId = ids[i0];
		const nextId = ids[i1];
		const hMin = colorData[prevId].h;
		const hRange = mod360(colorData[nextId].h - colorData[prevId].h);
		const h = Math.round((hMin + rel * hRange) * 100) / 100;
		return mod360(h);
	}


	// ==================== Private functions ====================

	function mod360(x) {
		while (x < 0) x += 360;
		while (x >= 360) x -= 360;
		return x;
	}


	// ==================== Exports ====================

	// Environment detection
	if (typeof module === "object" && typeof module.exports === "object") {
		// Node.js
		module.exports = DataColor;
	}
	else {
		// Global object
		window.DataColor = DataColor;
	}
})();
