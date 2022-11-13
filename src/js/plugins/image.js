// ==================== Image overlay text plugin ====================

// Duplicates all overlay texts to separate background and foreground opacity.
// This effect cannot be achieved with a single element and rgb(alpha) background because the
// semitransparent backgrounds of each text line overlap a bit and reduce transparency in these
// areas. The line gap cannot be determined reliably so a bit overlap is necessary to avoid empty
// space between the lines.
function imageOverlayText() {
	return this.forEach(el => {
		// Skip images (they're styled differently) and already marked elements
		el.querySelectorAll(":scope > :not(img):not(.ff-foreground-only):not(.ff-background-only)").forEach(el => {
			// The second (duplicate) will show only the text.
			let clone = el.cloneNode(true);
			clone.classList.add("ff-foreground-only");
			el.after(clone);
	
			// The first (original) will show only the background and have a
			// fully opaque background, but the entire element's opacity is reduced.
			// Also exclude it from screen reading, one is enough.
			el.classList.add("ff-background-only");
			el.setAttribute("aria-hidden", "true");
		});
	});
}

F.registerPlugin("imageOverlayText", imageOverlayText, {
	selectors: ["div.image-overlay-text", "a.image-overlay-text"]
});
