// ==================== Notification plugin ====================

const notificationContainerClass = "ff-notification-container";
const notificationBoxClass = "ff-notification-box";
const notificationMsgClass = "ff-notification-msg";
const notificationBarClass = "ff-notification-bar";

let activeNotifications = [];
let messageGap = 5;

// Shows a notification message at the top of the window. Multiple concurrent notifications stack
// vertically.
//
// text: The plain text to display.
// type: The display style: "error", "warning", "success" or other
// options: An object with additional options.
// - timeout: The timeout to automatically hide the notification, in milliseconds. Default: 8000
// - quick: Changes the default timeout to 3000.
// - permanent: If true, the notification has no timeout and cannot be closed by the user.
// - onclose: A callback function that is called when the notification is closed. It receives the
//     close reason as first argument ("click", "timeout").
//
// The returned object contains methods and properties to manipulate the notification.
// - close(reason): Closes the notification. Can be called at any time. The first parameter is
//     passed to the onclose callback.
// - isOpen: Determines whether the notification is still open. This property is read-only.
F.notify = function (text, type, options) {
	if (!options)
		options = {};
	if (options.timeout === undefined)
		options.timeout = options.quick ? 3000 : 8000;

	let newTop = activeNotifications.map(c => c.F.height + messageGap).reduce((a, b) => a + b, 0);

	let container = F.c("div");
	container.classList.add(notificationContainerClass);
	container.style.top = newTop + "px";

	let box = F.c("div");
	box.classList.add(notificationBoxClass);
	if (type)
		box.classList.add(type);
	box.style.cursor = options.permanent ? "default" : "pointer";
	container.append(box);

	let msg = F.c("div");
	msg.classList.add(notificationMsgClass);
	msg.textContent = text;
	box.append(msg);

	let bar = F.c("div");
	bar.classList.add(notificationBarClass);
	box.append(bar);

	document.body.append(container);
	activeNotifications.push(container);

	if (options.timeout && !options.permanent) {
		bar.F.animateFromTo({ width: [0, "100%"] }, options.timeout, "linear");
	}

	let isOpen = true;
	let timeout;
	let close = reason => {
		if (!isOpen)
			return;
		let height = container.F.height + messageGap;
		box.style.opacity = "0";
		container.style.top = parseFloat(container.style.top) - (height / 2) + "px";
		setTimeout(() => container.remove(), 400);   // TODO: Use transitionend event (with no-transition fallback) instead of timeout
		let index = activeNotifications.indexOf(container);
		if (index !== -1)
			activeNotifications.splice(index, 1);
		for (let i = index; i < activeNotifications.length; i++) {
			activeNotifications[i].style.top = parseFloat(activeNotifications[i].style.top) - height + "px";
		}
		isOpen = false;
		clearTimeout(timeout);
		options.onclose && options.onclose(reason);
	};

	if (options.timeout && !options.permanent)
		timeout = setTimeout(() => close("timeout"), options.timeout);

	if (!options.permanent) {
		box.F.on("click", () => close("click"));
	}

	// Create returned object
	// Add all methods
	let ret = {
		close
	};

	// Define properties
	Object.defineProperty(ret, "isOpen", {
		get: () => isOpen
	});

	return ret;
};
