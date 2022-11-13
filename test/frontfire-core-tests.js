// Runs all tests.
function testAll() {
	if (!testNodeProperties()) return false;
	if (!testCollection()) return false;
	if (!testDom()) return false;
	return true;
}

// Tests node properties.
function testNodeProperties() {
	let div = F("<div>text1<span>span1a</span><span>span1b</span></div><div>text2<span>span2a</span><span>span2b</span></div>").appendTo(document.body);

	let cn = div.childNodes;
	if (cn.length !== 6) {
		console.log("childNodes failed (length)");
		return false;
	}
	if (cn.get(0).textContent !== "text1") {
		console.log("childNodes failed (0)");
		return false;
	}
	if (cn.get(1).textContent !== "span1a") {
		console.log("childNodes failed (1)");
		return false;
	}
	if (cn.get(5).textContent !== "span2b") {
		console.log("childNodes failed (5)");
		return false;
	}

	cn = div.children;
	if (cn.length !== 4) {
		console.log("children failed (length)");
		return false;
	}
	if (cn.get(0).textContent !== "span1a") {
		console.log("children failed (0)");
		return false;
	}
	if (cn.get(3).textContent !== "span2b") {
		console.log("children failed (3)");
		return false;
	}

	if (div.nodeNameLower !== "div") {
		console.log("nodeNameLower failed");
		return false;
	}

	div.remove();
	return true;
}

// Tests collection management.
function testCollection() {
	let div = F("<div><span>1</span></div>").appendTo(document.body);

	// add from HTML string
	div.add("<span>2</span>");
	if (div.textContent !== "12") {
		console.log("add from HTML string failed");
		return false;
	}

	// addRange from HTML string
	div.addRange("<span>3</span><span>4</span>");
	if (div.textContent !== "1234") {
		console.log("addRange from HTML string failed");
		return false;
	}

	// insert from HTML string
	div.insert(2, "<span>5</span>");
	if (div.textContent !== "12534") {
		console.log("insert from HTML string failed");
		return false;
	}

	// insertRange from HTML string
	div.insertRange(3, "<span>6</span><span>7</span>");
	if (div.textContent !== "1256734") {
		console.log("insertRange from HTML string failed");
		return false;
	}

	// add from Node
	div.add(F("<span>8</span>").first);
	if (div.textContent !== "12567348") {
		console.log("add from Node failed");
		return false;
	}

	// insert from Node
	div.insert(7, F("<span>9</span>").first);
	if (div.textContent !== "125673498") {
		console.log("insert from Node failed");
		return false;
	}

	div.remove();
	return true;
}

// Tests DOM manipulations.
function testDom() {
	let div = F("<div>text<span>span</span></div>").appendTo(document.body);

	// remove
	div.first.querySelector("span").F.remove();
	if (div.textContent !== "text") {
		console.log("remove failed");
		return false;
	}

	// empty
	div.empty();
	if (div.textContent !== "") {
		console.log("empty failed");
		return false;
	}

	// append
	div.append("1");
	div.append("<span>2</span>");
	div.append(F("<span>3</span><span>4</span>"));
	if (div.textContent !== "1234") {
		console.log("append failed");
		return false;
	}
	div.empty();

	// prepend
	div.prepend("1");
	div.prepend("<span>3</span><span>2</span>");
	div.prepend(F("<span>5</span><span>4</span>"));
	if (div.textContent !== "54321") {
		console.log("prepend failed");
		return false;
	}
	div.empty();

	// before
	div.append("<span>4</span>");
	let span = div.firstChild;
	span.F.before("1");
	span.F.before(F("<span>2</span><span>3</span>"));
	if (div.textContent !== "1234") {
		console.log("before failed");
		return false;
	}
	div.empty();

	// after
	div.append("<span>1</span>");
	span = div.firstChild;
	span.F.after("4");
	span.F.after(F("<span>2</span><span>3</span>"));
	if (div.textContent !== "1234") {
		console.log("after failed");
		return false;
	}
	div.empty();

	// appendTo
	div.append("1");
	F("<span>2</span>").appendTo(div);
	F("<span>3</span><span>4</span>").appendTo(div);
	if (div.textContent !== "1234") {
		console.log("appendTo failed");
		return false;
	}
	div.empty();

	// prependTo
	div.prepend("4");
	F("<span>3</span>").prependTo(div);
	F("<span>1</span><span>2</span>").prependTo(div);
	if (div.textContent !== "1234") {
		console.log("prependTo failed");
		return false;
	}
	div.empty();

	// insertBefore
	div.append("<span>4</span>");
	span = div.firstChild;
	F("<span>1</span>").insertBefore(span);
	F("<span>2</span><span>3</span>").insertBefore(span);
	if (div.textContent !== "1234") {
		console.log("insertBefore failed");
		return false;
	}
	div.empty();

	// insertAfter
	div.append("<span>1</span><span>x</span>");
	span = div.firstChild;
	let span2 = div.lastChild;
	F("<span>4</span>").insertAfter(span);
	F("<span>2</span><span>3</span>").insertAfter(F([span, span2]));   // clone for second target
	if (div.textContent !== "1234x23") {
		console.log("insertAfter failed");
		return false;
	}
	div.empty();

	div.remove();
	return true;
}
