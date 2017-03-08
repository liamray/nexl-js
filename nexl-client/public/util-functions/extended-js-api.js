/**
 * Famous String.format()
 */
String.format = function () {
	var s = arguments[0];
	for (var i = 0; i < arguments.length - 1; i++) {
		var reg = new RegExp("\\{" + i + "\\}", "gm");
		s = s.replace(reg, arguments[i + 1]);
	}

	return s;
};

/*
 pushes only unique values into array
 */
Array.prototype.pushUniq = function (val) {
	if (!this.hasOwnProperty(val)) {
		this.push(val);
	}
};


/**
 * extending localStorage with setObject()/getObject() functions ( if storage supported )
 */
(function () {
	function storageIsNotSupportedMsg() {
		console.log('Storage is not supported !');
	}

	if (typeof Storage === 'undefined') {
		storageIsNotSupportedMsg();

		window.localStorage = {};
		window.localStorage.setObject = function () {
			storageIsNotSupportedMsg();
		};
		window.localStorage.getObject = function () {
			storageIsNotSupportedMsg();
		};
		return;
	}

	Storage.prototype.setObject = function (key, value) {
		this.setItem(key, JSON.stringify(value));
	};

	Storage.prototype.getObject = function (key) {
		return JSON.parse(this.getItem(key));
	};
})();
