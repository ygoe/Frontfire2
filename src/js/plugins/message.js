// ==================== Closable message plugin ====================

const messageCloseButtonClass = "ff-message-close-button";

// Makes each selected message element closable by adding a close button to it.
function closableMessage() {
	return this.forEach(message => {
		if (message.querySelector("." + messageCloseButtonClass)) return;   // Already added

		// Add close button
		let closeButton = F("<a>");
		closeButton.classList.add(messageCloseButtonClass);
		closeButton.setAttribute("href", "#");
		closeButton.draggable = false;
		// Workaround for Firefox bug https://bugzilla.mozilla.org/show_bug.cgi?id=1763858
		closeButton.F.on("dragstart", event => event.preventDefault());
		closeButton.appendTo(message);
		message.classList.add("closable");
		closeButton.on("click", event => {
			event.preventDefault();
			if (event.button === 0) {
				message.F.closableMessage.close();
			}
		});
	});
}

// Closes each selected message and removes it from the document.
function closeMessage() {
	return this.forEach(message => {
		if (message.F.computedStyle.transition.startsWith("none")) {
			message.remove();
		}
		else {
			let removeTimeout = setTimeout(() => message.remove(), 10);
			message.F.on("transitionrun", () => clearTimeout(removeTimeout));
			message.F.on("transitionend", () => message.remove());

			// TODO / https://stackoverflow.com/q/72000598
			//// Determine the effective occupied height caused by the message
			//let height = message.parentElement.offsetHeight;
			//console.log("parent height before: ", message.parentElement.offsetHeight);
			//let originalDisplay = message.style.display;
			//message.style.display = "none";
			//height -= message.parentElement.offsetHeight;
			//console.log("parent height after: ", message.parentElement.offsetHeight);
			//message.style.display = originalDisplay;
			//F.forceReflow();
			//
			//console.log("msg height: ", message.offsetHeight);
			//console.log("diff height: ", height);

			// Start the closing animation
			message.classList.add("ff-closed");
			//message.style.marginBottom = (-height + parseFloat(message.F.computedStyle.marginBottom)) + "px";
		}
	});
}

F.registerPlugin("closableMessage", closableMessage, {
	methods: {
		close: closeMessage
	},
	selectors: [".message.closable"]
});
