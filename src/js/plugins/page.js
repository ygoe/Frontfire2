// ==================== Page functions ====================

const backgroundDimmerClass = "ff-background-dimmer";
const dimmingClass = "ff-dimming";
const dimmedClass = "ff-dimmed";

let dimCount = 0;

// Dims the entire document by adding an overlay.
F.dimBackground = function (className) {
	dimCount++;
	if (F("body > div." + backgroundDimmerClass + ":not(.closing)").length !== 0) return;   // Already there
	let existingBackgroundLayer = F("body > div." + backgroundDimmerClass);
	if (existingBackgroundLayer.length === 0)
		document.body.F.trigger("dim");
	document.body.classList.add(dimmingClass, dimmedClass);
	let backgroundLayer = F("<div>");
	backgroundLayer.classList.add(backgroundDimmerClass);
	if (className)
		backgroundLayer.F.classList.add(className);
	backgroundLayer.appendTo(document.body);
	F.forceReflow();
	backgroundLayer.style("opacity", "1");
}

// Removes the overlay from the document. The overlay is already click-through during its
// fade-out transition.
F.undimBackground = function () {
	let backgroundLayer = F("body > div." + backgroundDimmerClass);
	if (dimCount <= 0 || backgroundLayer.length === 0) return;   // Not there or already closing
	dimCount--;
	if (dimCount > 0) return false;   // Not the last one, keep it dimmed
	document.body.classList.remove(dimmedClass);
	backgroundLayer.classList.add("closing");
	backgroundLayer.style.opacity = "0";
	backgroundLayer.on("transitionend", e => {
		if (!document.body.classList.contains(dimmedClass)) {
			// No other layer appeared in the meantime
			document.body.classList.remove(dimmingClass);
			document.body.F.trigger("undim");
		}
		backgroundLayer.remove();
	});
	return true;
}
