///////////////////////// menu /////////////////////////
function makeMenu() {
	$("#nexl-main-menu").jqxMenu({
		width: '350px',
		height: '30px',
		animationShowDuration: 300,
		animationHideDuration: 200,
		animationShowDelay: 200,
		enableHover: true,
		autoOpen: true,
		showTopLevelArrows: true
	});

	$("#nexl-main-menu").css('visibility', 'visible');

	$("#nexl-logo a").on('click', function () {
		alert('About nexl');
	});

	$("#nexl-login-menu").jqxMenu({
		width: '80px',
		height: '30px',
		animationShowDuration: 300,
		animationHideDuration: 200,
		animationShowDelay: 200,
		enableHover: true,
		autoOpen: true,
		showTopLevelArrows: true
	});
	$("#nexl-login-menu").jqxMenu('setItemOpenDirection', 'login', 'left', 'down');

	$('#login').on('click', function () {
		alert('Login !');
	});
}

////////////////////////////// nexl sources tree /////////////////////////
function makeNexlSourcesTree() {
	var source = [
		{
			icon: "images/dir.png",
			label: "common",
			id: 'common-id',
			expanded: false,
			items: [
				{icon: "images/js-file.png", label: "interfaces.js"},
				{icon: "images/js-file.png", label: "commons.js"},
				{icon: "images/js-file.png", label: "error-messages.js"}
			]
		},

		{
			icon: "images/dir.png",
			label: "jenkins",
			items: [
				{
					icon: "images/js-file.png",
					label: "jenkins.js"
				},
				{
					icon: "images/js-file.png",
					label: "permissions.js"
				}
			]
		},

		{
			icon: "images/dir.png",
			label: "jvm-opts",
			expanded: false,
			items: [
				{
					icon: "images/dir.png",
					label: "app-server",
					items: [
						{
							icon: "images/js-file.png",
							label: "app-server.js"
						}
					]
				},
				{
					icon: "images/dir.png",
					label: "pearl",
					items: [
						{
							icon: "images/js-file.png",
							label: "pearl-type1.js"
						},
						{
							icon: "images/js-file.png",
							label: "pearl-type2.js"
						},
						{
							icon: "images/js-file.png",
							label: "pearl-type3.js"
						}
					]
				}
			]
		},
		{
			icon: "images/js-file.png", label: "test.js"
		},
		{
			icon: "images/general-file.png", label: "Thumbs.db"
		}
	];

	$('#nexl-sources').jqxTree(
		{
			height: '100%',
			width: '100%',
			source: source,
			allowDrag: true,
			allowDrop: true
		}
	);
	$('#nexl-sources').css('visibility', 'visible');
	var contextMenu = $("#jqxMenu").jqxMenu({
		width: '120px',
		height: '84px',
		autoOpenPopup: false,
		mode: 'popup'
	});
	var clickedItem = null;

	var attachContextMenu = function () {
		// open the context menu when the user presses the mouse right button.
		$("#nexl-sources li").on('mousedown', function (event) {
			var target = $(event.target).parents('li:first')[0];
			var rightClick = isRightClick(event);
			if (rightClick && target != null) {
				$("#nexl-sources").jqxTree('selectItem', target);
				var scrollTop = $(window).scrollTop();
				var scrollLeft = $(window).scrollLeft();
				contextMenu.jqxMenu('open', parseInt(event.clientX) + 5 + scrollLeft, parseInt(event.clientY) + 5 + scrollTop);
				return false;
			}
		});
	};

	$('#nexl-sources').on("dragEnd", function (event) {
		attachContextMenu();
	});

	$('#nexl-sources').on('select', function (event) {
		alert(event.args.element.id);
	});


	attachContextMenu();
	$("#jqxMenu").on('itemclick', function (event) {
		var item = $.trim($(event.args).text());
		switch (item) {
			case "Add Item":
				var selectedItem = $('#nexl-sources').jqxTree('selectedItem');
				if (selectedItem != null) {
					$('#nexl-sources').jqxTree('addTo', {label: 'Item'}, selectedItem.element);
					attachContextMenu();
				}
				break;
			case "Remove Item":
				var selectedItem = $('#nexl-sources').jqxTree('selectedItem');
				if (selectedItem != null) {
					$('#nexl-sources').jqxTree('removeItem', selectedItem.element);
					attachContextMenu();
				}
				break;
		}
	});
	// disable the default browser's context menu.
	$(document).on('contextmenu', function (e) {
		if ($(e.target).parents('.jqx-tree').length > 0) {
			return false;
		}
		return true;
	});
	function isRightClick(event) {
		var rightclick;
		if (!event) var event = window.event;
		if (event.which) rightclick = (event.which == 3);
		else if (event.button) rightclick = (event.button == 2);
		return rightclick;
	}
}

////////////////////////////// editor tabs /////////////////////////
function makeEditorTabs() {
	var addButton, addButtonWidth = 29, index = 0;
	$('#tabbed-editor').jqxTabs(
		{
			height: '100%',
			width: '100%',
			showCloseButtons: true,
			reorder: true
		}
	);
}

////////////////////////////// splitters /////////////////////////
function calcMainAreaHeight() {
	return $(window).height() - $('#nexl-main-menu').height() - 85;
}

function makeSplitters() {
	$('#main-area').jqxSplitter({
		width: '100%',
		height: calcMainAreaHeight(),
		orientation: 'vertical',
		panels: [{size: '20%'}, {size: '80%', min: '15%'}]
	});

	$('#tabs-area').jqxSplitter({
		width: '100%',
		height: '100%',
		orientation: 'horizontal',
		panels: [{size: '70%', collapsible: false}, {size: '30%'}]
	});

	$(window).resize(function () {
		$('#main-area').jqxSplitter({
			height: calcMainAreaHeight()
		});
	});

	$('#tabs-area').jqxSplitter('refresh');
};

$(document).ready(function () {
	makeMenu();
	makeNexlSourcesTree();
	makeEditorTabs();
	makeSplitters();
});
