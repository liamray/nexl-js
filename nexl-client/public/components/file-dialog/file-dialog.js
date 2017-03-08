var fileDialog = {};


fileDialog.init = function () {
	this.lastMount = null;
	this.lastVisitedPath = {};

	// assign "root" button click
	$("#file-dialog-root").click(function () {
		fileDialog.changeCurrentPath("");
	});

	// assign "level up" button click
	$("#file-dialog-level-up").click(function () {
		fileDialog.moveLevelUp();
	});

	// assign "open" button click
	$("#file-dialog-open-button").click(function () {
		fileDialog.openFile();
	});

	// assign "cancel" button click
	$("#file-dialog-cancel-button").click(function () {
		fileDialog.closeDialog();
	});
};

fileDialog.closeDialog = function () {
	$('#file-dialog').dialog('close');
};

fileDialog.setFileName = function (fileName) {
	$('#file-dialog-file-name input').val(fileName);
};

fileDialog.getFileName = function () {
	return $('#file-dialog-file-name input').val();
};

fileDialog.getCurrentMount = function () {
	return $("#file-dialog-mounts select").val();
};

fileDialog.setCurrentPath2Display = function (path) {
	$("#file-dialog-current-path input").val(path);
};

fileDialog.setCurrentPath = function (path) {
	$("#file-dialog-current-path input").attr('path', path);
};

fileDialog.getCurrentPath = function () {
	return $('#file-dialog-current-path input').attr('path');
};

fileDialog.openFile = function () {
	var mount = fileDialog.getCurrentMount();
	var currentPath = fileDialog.getCurrentPath();
	var fileName = fileDialog.getFileName();

	if (!fileName || fileName.length < 1) {
		return;
	}

	var pathElements = module.utils.joinPathElements(mount, currentPath, fileName);

	var callback = this.callback;

	module.utils.restCall('/rest/join-path', {pathElements: pathElements}, function (data) {
		var fullFileName = data.path;
		callback(fullFileName);
		fileDialog.closeDialog();
	});
};

fileDialog.fileClick = function ($instance) {
	// clearing all selections
	$('#file-dialog-files-list ul li').removeClass('file-dialog-item-selected');
	// adding selection for $instance
	$instance.addClass('file-dialog-item-selected');

	var isFile = $instance.hasClass('file-dialog-file');

	if (isFile) {
		var fileName = $instance.html();
		fileDialog.setFileName(fileName);
	}
};

fileDialog.changeCurrentPath = function (newPath) {
	var currentPath = fileDialog.getCurrentPath();

	fileDialog.setCurrentPath(newPath);
	fileDialog.setFileName("");

	var mount = fileDialog.getCurrentMount();

	this.lastVisitedPath[mount] = newPath;

	// is root path ?
	if (newPath == "") {
		fileDialog.updateFilesList(mount);
		fileDialog.setCurrentPath2Display("/");
		return;
	}

	var pathElements = module.utils.joinPathElements(mount, newPath);

	module.utils.restCall('/rest/join-path', {pathElements: pathElements}, function (data) {
		fileDialog.updateFilesList(data.path);
		fileDialog.setCurrentPath2Display(data.path);
	});
};

fileDialog.moveLevelUp = function () {
	var currentPath = fileDialog.getCurrentPath();

	// removing last path element
	var newPath = module.utils.reducePath(currentPath);

	fileDialog.changeCurrentPath(newPath);
};

fileDialog.fileDoubleClick = function ($instance) {
	var isFile = $instance.hasClass('file-dialog-file');

	if (isFile) {
		fileDialog.openFile();
		return;
	}

	var currentPath = fileDialog.getCurrentPath();
	var chaneDirTo = $instance.html();

	// join current path and dir name which was clicked
	var pathElements = module.utils.joinPathElements(currentPath, chaneDirTo);
	module.utils.restCall('/rest/join-path', {pathElements: pathElements}, function (data) {
		var newPath = data.path;
		fileDialog.changeCurrentPath(newPath);
	});
};

fileDialog.updateFilesListWrapper = function (files) {
	var $ul = $('#file-dialog-files-list ul');
	$ul.html('');
	$.each(files, function (i, file) {
		var style = file["isFile"] ? 'file-dialog-file' : 'file-dialog-directory';
		var fileName = file.name;
		var shortFileName = module.utils.shortFileName(fileName);

		// creating <li> tag
		$ul.append(String.format('<li class="{0}" file-name="{1}">{2}</li>', style, file.name, shortFileName));
	});

	$('#file-dialog-files-list ul li').on('click', function (instance) {
		fileDialog.fileClick($(this));
	});

	$('#file-dialog-files-list ul li').dblclick(function (instance) {
		fileDialog.fileDoubleClick($(this));
	});
};

fileDialog.resetLastMount = function () {
	this.lastMount = null;
};

fileDialog.handleFileListFailure = function (path, err) {
	var mount = fileDialog.getCurrentMount();

	var msg = 'Got error while loading [' + path + '] directory content. Reason : ' + err + '<br/><br/>';
	msg += (path === mount) ? 'Reloading mounts' : 'Moving 1 level up';

	module.nexlui.popupMessage(msg, 'Error', function () {
		// problem loading directory content, probably it doesn't exist
		if (path !== mount) {
			// try to load root dir, if the path is not root
			fileDialog.moveLevelUp();
		} else {
			// we are in root dir and got a problem loading his content, so let's refresh mounts
			fileDialog.resetLastMount();
			fileDialog.reloadMounts();
		}

	});

};

fileDialog.updateFilesList = function (path) {
	// get all files in directories
	module.utils.restCall('/rest/list-files', {path: path}, function (data) {
		fileDialog.updateFilesListWrapper(data.files);
	}, function (err) {
		fileDialog.handleFileListFailure(path, err.statusText);
	});
};

fileDialog.mountChanged = function () {
	var mount = fileDialog.getCurrentMount();
	this.lastMount = mount;
	var lastVisitedPath = this.lastVisitedPath[mount];
	lastVisitedPath = (lastVisitedPath == null) ? "" : lastVisitedPath;
	fileDialog.changeCurrentPath(lastVisitedPath);
};

fileDialog.reloadMountsWrapper = function (mounts) {
	if (mounts.length < 1) {
		module.nexlui.popupMessage('No mounts found on this computer !', 'Error', function () {
			fileDialog.closeDialog();
			return;
		});
		return;
	}

	var select = $("#file-dialog-mounts select")[0];
	select.innerHTML = '';

	var lastMount = null;
	var lastMountThis = this.lastMount;

	$.each(mounts, function (index, mount) {
		var opt = document.createElement('option');
		opt.innerHTML = mount;
		opt.value = mount;
		select.appendChild(opt);

		if (mount === lastMountThis) {
			lastMount = mount;
		}
	});

	$("#file-dialog-mounts select").on('change', function () {
		fileDialog.mountChanged();
	});

	if (lastMount != null) {
		$("#file-dialog-mounts select").val(lastMount);
	}

	fileDialog.mountChanged();
};

fileDialog.reloadMounts = function () {
	module.utils.restCall('/rest/list-mounts', {}, function (data) {
		fileDialog.reloadMountsWrapper(data.mounts);
	}, function (err) {
		module.nexlui.popupMessage('Failed to read mounts. Reason : ' + err.statusText, 'Error', function () {
			fileDialog.closeDialog();
		})
	});
};

fileDialog.openFileDialog = function (callback) {
	$('#file-dialog-open-button').val('Open');
	fileDialog.startFileDialog(callback, "Open File");
};

fileDialog.saveFileDialog = function (callback) {
	$('#file-dialog-open-button').val('Save');
	fileDialog.startFileDialog(callback, "Save File");
};

fileDialog.startFileDialog = function (callback, title) {
	this.callback = callback;

	$("#file-dialog").dialog({
		width: 640,
		modal: true,
		resizable: false,
		title: title
	});

	fileDialog.reloadMounts();
};
