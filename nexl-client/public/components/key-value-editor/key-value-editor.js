/**
 * Key-Value editor
 * Copyright (c) 2016 Yevgeny Sergeyev
 *  License : Apache 2.0

 * Usage :
 * 1) add empty div and give him an id
 * 2) call init() function with id you gave ( prepend id with # sign ) : module.keyValueEditor.init('#your-id');
 * 3) to add lines manually, use following functions :
 *            - module.keyValueEditor.addItem(id, key, value);
 *            - module.keyValueEditor.addItems(id, keyValuesAsJson);
 */

var module = (function (module) {
	module.keyValueEditor = {};

	const DIV_REFERENCE = 'div-reference';
	const OPTIONS = 'key-value-options';
	const STORAGE_ID = 'key-value-storage-';

	// options
	const READ_ONLY_KEY = 'readOnlyKey';
	const READ_ONLY_VALUE = 'readOnlyValue';
	const CANT_DELETE = 'cantDelete';
	const CANT_ADD = 'cantAdd';
	const CACHE_IN_STORAGE = 'cacheInStorage';

	var callbackFn;

	function isKey(div, id) {
		return div.next().is('div');
	}

	function isValue(div, id) {
		return !div.next().is('div');
	}

	function getOpt(id, opt) {
		const opts = $(id).data(OPTIONS);
		var result = opts[opt];
		return result != null && result;
	}

	function canEdit(div, id) {
		if (isKey(div, id) && !getOpt(id, READ_ONLY_KEY)) {
			return true;
		}

		if (isValue(div, id) && !getOpt(id, READ_ONLY_VALUE)) {
			return true;
		}

		return false;
	}

	function onEditEvent(div, id) {
		if (!canEdit(div, id)) {
			return;
		}

		// copy value to input
		$(id + ' input').val(div.html());

		// store $(this) in input
		var obj = {};
		obj[DIV_REFERENCE] = div;
		$(id + ' input').data(obj);

		// coordinates
		var offset = div.position();

		// show input element
		$(id + ' input').css({top: offset.top, left: offset.left}).show().focus();
	}

	function handleTab(input) {
		// who references to input ?
		var div = input.data(DIV_REFERENCE);

		// next element after current div
		var next = div.next();

		// this is a VALUE field, activating...
		if (next.is('div')) {
			input.blur();
			next.click();
			return;
		}

		// this is a delete button, resolving parent and then next parent container
		var nextParent = next.parent().next();

		// is next parent empty ?
		if (nextParent.length < 1) {
			var id = '#' + input.parent().attr('id');
			if (getOpt(id, CANT_ADD)) {
				return;
			}
			// adding new empty key-value line
			module.keyValueEditor.addItem(id);
			handleTab(input);
			return;
		}

		// activating first child of nextParent
		input.blur();
		nextParent.children().first().click();
	}

	function save2Storage(id) {
		if (!getOpt(id, CACHE_IN_STORAGE)) {
			return;
		}

		var storageId = getStorageId(id);
		var items = module.keyValueEditor.getItems(id);
		localStorage.setObject(storageId, items);
	}

	function onUnEdit(id, input, event) {
		var keyCode = event.keyCode || event.which;

		// tab ?
		if (keyCode == 9) {
			handleTab(input);
			event.preventDefault();
			return;
		}

		// if not Enter, continue edit
		if (event.type == 'keydown' && keyCode != 13) {
			return;
		}

		// who references to input ?
		var div = input.data(DIV_REFERENCE);


		// restore value
		div.html(input.val());

		// hide input
		input.hide();

		save2Storage(id);
	}

	function onRemove(id, img) {
		img.parent().remove();

		save2Storage(id);
	}

	function assignListeners(id) {
		// on edit event
		$(id + ' .key-value-editor-item div').on('click', function () {
			onEditEvent($(this), id);
		});

		// on unedit event
		$(id + '  input').on('blur keydown', function (event) {
			onUnEdit(id, $(this), event);
			callback();
		});

		// on delete event
		$(id + '  span').on('click', function () {
			onRemove(id, $(this));
			callback();
		});
	}

	function createInput4Edit(id) {
		var element = $('<input>').attr({type: 'text'}).css({display: 'none', position: 'absolute', width: '270px'});
		$(id).append(element);
	}

	function getStorageId(id) {
		return STORAGE_ID + id;
	}

	function loadFromStorage(id) {
		if (!getOpt(id, CACHE_IN_STORAGE)) {
			return;
		}

		// loading from storage
		var storageId = getStorageId(id);
		var keyValuePairs = localStorage.getObject(storageId);
		module.keyValueEditor.addItems(id, keyValuePairs);
	}

	function callback() {
		if (callbackFn !== undefined) {
			callbackFn();
		}
	}

	/**
	 * options are :
	 *  - cacheInStorage: true|false ( automatically save/load to local storage )
	 *  - readOnlyKey : true|false
	 *  - readOnlyValue : true|false
	 *  - cantAdd : true|false
	 *  - cantDelete : true|false
	 */
	module.keyValueEditor.init = function (id, options, aCallbackFn) {
		// saving options in $(id)
		$(id).data(OPTIONS, options || {});

		callbackFn = aCallbackFn;

		createInput4Edit(id);
		assignListeners(id);
		loadFromStorage(id);
	};
	module.keyValueEditor.addItem = function (id, key, value) {
		// new item
		var item = '<div class="key-value-editor-item"><div>${key}</div><div>${value}</div><span style="${visibility}"></span></div> ';

		key = key || '';
		value = value || '';
		var visibility = getOpt(id, CANT_DELETE) ? 'display:none' : '';

		item = item.replace('${key}', key).replace('${value}', value).replace('${visibility}', visibility);
		item = $(item);

		// on edit event
		item.find('div').on('click', function () {
			onEditEvent($(this), id);
			callback();
		});

		// on delete event
		item.find('span').on('click', function () {
			onRemove(id, $(this));
			callback();
		});

		// append input to main container
		$(id).append(item);
		callback();
	};

	module.keyValueEditor.addItems = function (id, itemsAsJson) {
		for (var key in itemsAsJson || {}) {
			module.keyValueEditor.addItem(id, key, itemsAsJson[key]);
		}
	};

	module.keyValueEditor.getItems = function (id) {
		var result = {};
		$(id).children().not('input').each(function (a, b) {
			var keyValueDivs = $(b).find('div');
			var key = keyValueDivs.first().html();
			var value = keyValueDivs.last().html();

			result[key] = value;
		});

		return result;
	};

	return module;

})(module || {});