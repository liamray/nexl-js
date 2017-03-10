(function () {
	var CUSTOM_VALUE_BOX = 'customValue';
	var ACTION_IDS_SELECT = 'actionIds';
	var EXAMPLE_BOX = 'exampleBox';

	var lastVisibleBox = CUSTOM_VALUE_BOX;

	function updateExampleBox(source) {
		$('.' + EXAMPLE_BOX).hide();

		var example = $("option:selected", source).attr('example');
		if (example === undefined) {
			$('.' + EXAMPLE_BOX).hide();
			return;
		}

		var $source = $(source);
		var value;
		if ($source.attr('class') === ACTION_IDS_SELECT) {
			value = $('.' + CUSTOM_VALUE_BOX).find('input').val();
		} else {
			value = $('.' + ACTION_IDS_SELECT).val() + $source.val();
		}

		if (value === '') {
			return;
		}

		example = 'Example : ' + example.replace(/%s/g, value);
		example = example.replace(/</g, '&lt;').replace(/>/g, '&gt;');
		$('.' + EXAMPLE_BOX).html(example);
		$('.' + EXAMPLE_BOX).show();
	}

	function start() {
		$('.add-action-dialog .' + ACTION_IDS_SELECT).on('change', function () {
			var ref = $("option:selected", this).attr('ref');
			$(lastVisibleBox).hide();

			if (ref === undefined) {
				lastVisibleBox = '.' + CUSTOM_VALUE_BOX;
				$(lastVisibleBox).show();
			} else {
				$(ref).show();
				lastVisibleBox = ref;
			}

			$(lastVisibleBox).find('input,select').val('');
		});

		$('.add-action-dialog select').on('change', function () {
			var title = $("option:selected", this).attr('title');
			$(this).attr('title', title);

			updateExampleBox(this);
		});

		$('.' + CUSTOM_VALUE_BOX).on('input', function () {
			updateExampleBox('.' + ACTION_IDS_SELECT);
		});
	}

	$(document).ready(function () {
		start();
	});
})();