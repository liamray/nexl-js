/**
 * nexlui module
 */

var module = (function (module) {
	module.nexlui = {};

	// keyboard shortcuts
	const CTRL_S = 'control+s';
	const CTRL_O = 'control+o';
	const ALT_X = 'alt+x';
	const F9 = 'F9';
	const ENTER = 'enter';

	// toolbar button classes
	const TOOLBAR_BUTTONS = {
		SAVE_BUTTON: 'save-file-button',
		SAVE_BUTTON_AS: 'save-file-as-button',
		EVAL_BUTTON: 'eval-button'
	};

	const BAW = 1, COLOR = 0;

	var serverInfo = {};

	var $selectedItem;
	var actions;

	function saveFileWrapper($tab, fileName) {
		var url = "/rest/save-file";
		var fileContent = module.tabs.fileContent($tab);
		var params = {fileName: fileName, fileContent: fileContent};

		// saving...
		module.utils.restCall(url, params, function (data) {
			module.tabs.changed($tab, false);
			updateToolbarButtons($tab);
		}, function (err) {
			module.nexlui.popupMessage('Failed to save file. Reason : ' + err.statusText, 'Error');
		});
	}

	function saveFileAs() {
		var $tab = module.tabs.getActiveFileTab();
		if (!$tab) {
			return;
		}

		fileDialog.saveFileDialog(function (saveDialogFileName) {
			module.tabs.fileName($tab, saveDialogFileName);
			saveFileWrapper($tab, saveDialogFileName);
		});
	}

	function saveFile() {
		var $tab = module.tabs.getActiveFileTab();
		if (!$tab) {
			return;
		}

		// file name
		var fileName = module.tabs.fileName($tab);

		// is file name specified ?
		if (fileName === undefined || fileName === '') {
			fileDialog.saveFileDialog(function (saveDialogFileName) {
				module.tabs.fileName($tab, saveDialogFileName);
				saveFileWrapper($tab, saveDialogFileName);
			});
		} else {
			saveFileWrapper($tab, fileName);
		}
	}

	function isArray(obj) {
		return Object.prototype.toString.call(obj) === "[object Array]";
	}

	function isString(obj) {
		return Object.prototype.toString.call(obj) === "[object String]";
	}

	function parseData(data) {
		var result = data;
		if (isString(data)) {
			result = JSON.parse(data);
		}

		return JSON.stringify(result, null, 4);
	}

	function putDataIntoOutputArea(data) {

		$('#output-area textarea').val(parseData(data));

		$('#output').fadeOut(200).fadeIn(1);
	}

	function evalFileTab($tab, expression) {
		var fileName = module.tabs.fileName($tab);
		var fileContent;

		// is file name not specified ? or content is changed ?
		if (!fileName || fileName.length < 1 || module.tabs.changed($tab)) {
			// ok, we need to send a content
			fileContent = module.tabs.fileContent($tab);
		}

		// nexl arguments
		var nexlArgs = module.keyValueEditor.getItems('#external-arguments-editor');
		nexlArgs = JSON.stringify(nexlArgs);

		// all params
		var params = {
			nexlSourceFileName: fileName,
			nexlSourceFileContent: fileContent,
			nexlExpression: expression,
			nexlArgs: nexlArgs
		};

		// evaluating...
		module.utils.restCall('/rest/eval-nexl', params, function (data) {
			putDataIntoOutputArea(data);
		}, function (err) {
			module.nexlui.popupMessage(err.responseText);
		});
	}

	function evalRemoteTab($tab, expression) {
		var url = module.tabs.getRemoteUrl($tab);

		if (url === null) {
			module.nexlui.popupMessage('Please provide full url either choose nexl source', 'Error');
			return;
		}

		var params = module.keyValueEditor.getItems('#external-arguments-editor');
		if (expression !== undefined) {
			params.expression = expression;
		}

		module.utils.jsonPCall(url, params, function (data) {
			if (data.error) {
				module.nexlui.popupMessage(data.error, 'Error');
				return;
			}
			putDataIntoOutputArea(data.data);
		}, function (xhr, status, error) {
			module.nexlui.popupMessage('Remote nexl server is not available', 'Error');
		});
	}

	function evalNexl() {
		var $tab = module.tabs.getActiveTab();
		if (!$tab) {
			return;
		}

		// validating expression
		var expression = module.tabs.expression($tab);

		// reset output area and hid it
		$('#output textarea').val('');

		expression = expression.length > 0 ? expression : undefined;

		if (module.tabs.remote($tab)) {
			evalRemoteTab($tab, expression);
		} else {
			evalFileTab($tab, expression);
		}
	}

	function assembleActionIdAndValue(actionId, actionValue) {
		switch (actionId) {
			case '[]': {
				return '[' + actionValue + ']';
			}
			case '()': {
				return '(' + actionValue + ')';
			}
		}

		return actionId + actionValue;
	}

	function openAddActionDialog() {
		$("#addActionDialog").dialog({
				width: 310,
				height: 380,
				modal: true,
				resizable: true,
				buttons: {
					"Select": function () {
						actions += assembleActionIdAndValue(module.addAction.getActionId(), module.addAction.getActionValue());
						actions = actions.replace(/</g, '&lt;').replace(/>/g, '&gt;');
						var currentExpression = '${' + getSelectedIteValue() + actions + '}';
						$('.choose-expression-dialog .expression-fitting .nexl-expression').html(currentExpression);
						$(this).dialog("close");
					},
					Cancel: function () {
						$(this).dialog("close");
					}
				}
			}
		);
	}

	function getSelectedIteValue() {
		return $selectedItem === undefined ? '' : $selectedItem.text();
	}

	function openChooseExpressionDialog($tab, data, onsSelectCallback) {
		actions = '';
		$selectedItem = undefined;

		var li = '';
		for (var i = 0; i < data.length; i++) {
			var item = String.format('<li>{0}</li>', data[i].name);
			li += item;
		}

		$('.choose-expression-dialog .expression-fitting .add-action-button').click(function () {
			openAddActionDialog();
		});
		$('.choose-expression-dialog .expression-fitting .reset-events-button').click(function () {
			actions = '';
			$('.choose-expression-dialog .expression-fitting .nexl-expression').html('${' + getSelectedIteValue() + actions + '}');
		});

		$('.choose-expression-dialog .expressions-list-container ul').html(li);

		$('.choose-expression-dialog .expressions-list-container li').dblclick(function () {
			var expression = $('.choose-expression-dialog .expression-fitting .nexl-expression').text();
			module.tabs.expression($tab, expression);
			$('.choose-expression-dialog').dialog("close");
			if (onsSelectCallback) {
				onsSelectCallback();
			}
		});

		$('.choose-expression-dialog .expressions-list-container li').on('click', function () {
			if ($selectedItem) {
				$selectedItem.css({border: 'none'});
			}
			$selectedItem = $(this);
			$selectedItem.css({border: '1px solid black'});
			$('.choose-expression-dialog .expression-fitting .nexl-expression').html('${' + getSelectedIteValue() + actions + '}');
		});

		$('.choose-expression-dialog .expression-fitting .nexl-expression').html('${}');

		$('.choose-expression-dialog').dialog({
			width: 550,
			height: 460,
			modal: true,
			resizable: true,
			buttons: {
				"Select": function () {
					var currentExpression = $('.choose-expression-dialog .expression-fitting .nexl-expression').text();
					if (currentExpression === '${}') {
						module.nexlui.popupMessage('Please choose a variable', 'Error');
						return;
					}
					module.tabs.expression($tab, currentExpression);
					if (onsSelectCallback) {
						onsSelectCallback();
					}
					$(this).dialog("close");
				},
				Cancel: function () {
					$(this).dialog("close");
				}
			}
		});
	}

	function chooseRemoteExpression($tab) {
		var url = module.tabs.url($tab);

		if (!url || url.length < 1) {
			module.nexlui.popupMessage('First provide nexl server', 'Error');
			return;
		}

		url = String.format('http://{0}/nexl-rest/list-js-variables', url);

		var nexlSource = module.tabs.getRemoteNexlSource($tab).val();
		if (!nexlSource || nexlSource.length < 1) {
			module.nexlui.popupMessage('Provide a nexl source', 'Error');
			return;
		}

		var params = {};
		params.nexlSource = nexlSource;

		module.utils.jsonPCall(url, params, function (data) {
			if (data.error) {
				module.nexlui.popupMessage(data.error, 'Error');
				return;
			}

			openChooseExpressionDialog($tab, data.data, function () {
				module.tabs.updateRESTURL($tab);
			});
		}, function (xhr, status, error) {
			module.nexlui.popupMessage('Remote nexl server is not available', 'Error');
		});
	}

	function chooseFileExpression($tab) {
		var fileName = module.tabs.fileName($tab);
		var fileContent;

		// is file name not specified ? or content is changed ?
		if (!fileName || fileName.length < 1 || module.tabs.changed($tab)) {
			// ok, we need to send a content
			fileContent = module.tabs.fileContent($tab);
		}

		// all params
		var params = {
			nexlSourceFileName: fileName,
			nexlSourceFileContent: fileContent
		};

		// resolving...
		module.utils.restCall('/rest/resolve-js-variables', params, function (data) {
			openChooseExpressionDialog($tab, data);
		}, function (err) {
			module.nexlui.popupMessage(err.responseText);
		});
	}

	module.nexlui.chooseExpression = function ($tab) {
		if (module.tabs.remote($tab)) {
			chooseRemoteExpression($tab);
		} else {
			chooseFileExpression($tab);
		}
	};

	function openFile() {
		fileDialog.openFileDialog(function (fileName) {
			module.tabs.openFile(fileName);
		});
	}

	function onBrowserDir4NexlServer() {
		module.dirBrowser.start('#dir-browser', function (path) {
			// closing dialog
			$("#dir-browser-dialog").dialog('close');

			// updating filed if not path not empty
			if (path && path.length > 0) {
				$('.run-server-dialog div .dir').val(path);
			}
		});
	}

	function browserDir4NexlServer() {
		$("#dir-browser-dialog").dialog({
			width: 640,
			height: 480,
			modal: true,
			resizable: true,
			title: 'Choose nexl sources directory',
			open: onBrowserDir4NexlServer
		});

	}

	function assignButtons() {
		// new file tab
		$('.new-file-button').click(function () {
			var $tab = module.tabs.newFileTab();
			module.tabs.activateTab($tab);
		});

		// new remote tab
		$('.new-remote-button').click(function () {
			var $tab = module.tabs.newRemoteTab();
			module.tabs.activateTab($tab);
		});

		// open file
		$('.open-file-button').click(function () {
			openFile();
		});

		// save file
		$('.save-file-button').click(function () {
			saveFile();
		});

		// save file as
		$('.save-file-as-button').click(function () {
			saveFileAs();
		});

		// eval nexl expression
		$('.eval-button').click(function () {
			evalNexl();
		});

		// about
		$('.about-button').click(function () {
			var info = '';

			info += 'Copyright (c) 2016-2007 Yevgeny Sergeyev<br/><br/>';
			info += 'email <a href="mailto:nexl.javascript@gmail.com">nexl.javascript@gmail.com</a><br/>';

			info = String.format(info, serverInfo.version);

			module.nexlui.popupMessage(info, 'About nexl-client [' + serverInfo.version + ']');
		});

		$('.run-server-dialog div .browse').click(function () {
			browserDir4NexlServer();
		});

		// add argument
		$('#addExternalArg').click(function () {
			module.keyValueEditor.addItem('#external-arguments-editor');
		});
	}

	function discoverKeyCombination(event) {
		if (event.ctrlKey || event.metaKey) {
			switch (String.fromCharCode(event.which).toLowerCase()) {
				case 's':
					return CTRL_S;
				case 'o':
					return CTRL_O;
			}
		}

		if (event.altKey) {
			switch (String.fromCharCode(event.which).toLowerCase()) {
				case 'x':
					return ALT_X;
			}
		}

		if (event.which == 13) {
			return ENTER;
		}

		if (event.which === 120) {
			return F9;
		}

		return null;
	}

	function interceptHotKeys() {
		$(window).bind('keydown', function (event) {
			var key = discoverKeyCombination(event);
			switch (key) {
				case CTRL_S:
					saveFile();
					event.preventDefault();
					return;

				case CTRL_O:
					openFile();
					event.preventDefault();
					return;

				case ALT_X:
					module.tabs.toggleExpressionFocus();
					return;

				case F9 :
					evalNexl();
					event.preventDefault();
					return;

				case ENTER:
					if (module.tabs.isExpressionFocused()) {
						evalNexl();
						event.preventDefault();
					}
					return;
			}
		});
	}

	function initKeyValueEditors() {
		module.keyValueEditor.init('#external-arguments-editor', {
			cacheInStorage: true
		}, function () {
			module.tabs.updateRESTURLs();
		});
	}

	function initFileDialog() {
		// adding file dialog to html
		$('#file-dialog-container').load('/components/file-dialog/file-dialog.html', function () {
			fileDialog.init();
		});
	}

	function interceptBrowserClose() {
		$(window).bind("beforeunload", function () {
			// storing all tabs in local storage
			module.tabs.storeTabs();

			if (module.tabs.hasUnsavedTabs()) {
				return "You have unsaved data, you are sure you want to leave/reload this html page ?";
			}
		});
	}

	function switchButtonsClass(clazz, index) {
		var clazzBaw = clazz + '-baw';
		var findBy = String.format('#buttons-panel .{0}, .{1}', clazz, clazzBaw);

		var classes = [clazz, clazzBaw];

		$(findBy).attr('class', classes[index]);

		var titleBaw = $(findBy).attr('title-baw');
		var titleColor = $(findBy).attr('title-color');

		// doesn't title-color exist ?
		if (!titleColor) {
			// adding
			titleColor = $(findBy).attr('title');
			$(findBy).attr('title-color', titleColor)
		}

		var titles = [titleColor, titleBaw];
		$(findBy).attr('title', titles[index]);
	}

	function updateToolbarButtons($tab) {
		var isRemote = module.tabs.remote($tab);
		switchButtonsClass(TOOLBAR_BUTTONS.SAVE_BUTTON, isRemote ? BAW : COLOR);
		switchButtonsClass(TOOLBAR_BUTTONS.SAVE_BUTTON_AS, isRemote ? BAW : COLOR);
	}

	function initTabs() {
		module.tabs.init(function () {
			module.tabs.loadTabs();
		});

		module.tabs.assignEvent('activate', function (event, ui) {
			var $tab = $(ui.newTab);
			updateToolbarButtons($tab);
		});
	}

	function appyJQueryTooltips() {
		$(function () {
			$(document).tooltip();
		});
	}


	function getServerInfo() {
		module.utils.restCall('/rest/get-server-info', {}, function (data) {
			serverInfo = data;
		}, function (err) {
			module.nexlui.popupMessage('Failed to retireive server info. Reason : ' + err.statusText, 'Error');
		});

	}

	module.nexlui.init = function () {
		assignButtons();
		initTabs();
		initKeyValueEditors();
		initFileDialog();
		interceptHotKeys();
		interceptBrowserClose();
		appyJQueryTooltips();
		getServerInfo();
	};

	module.nexlui.popupMessage = function (outputMsg, titleMsg, onCloseCallback) {
		$("#popup-message").html(outputMsg).dialog({
			title: titleMsg,
			resizable: false,
			modal: true,
			buttons: {
				"OK": function () {
					$(this).dialog("close");
				}
			},
			close: onCloseCallback
		});
	};

	module.nexlui.confirm = function (agreeCallback, message) {
		$("#dialog-confirm p").html(message);

		$("#dialog-confirm").dialog({
			resizable: false,
			height: "auto",
			width: 400,
			title: 'Confirmation',
			modal: true,
			buttons: {
				"Yes": function () {
					agreeCallback();
					$(this).dialog("close");
				},
				"No": function () {
					$(this).dialog("close");
				}
			}
		});
	};

	return module;

})(module || {});