var module = (function (module) {
	module.jqueryAutocomplete = {};

	$.widget("custom.combobox", {
		_create: function () {
			this.wrapper = $("<span>")
				.addClass("custom-combobox")
				.insertAfter(this.element);

			this.element.hide();
			this._createAutocomplete();
			this._createShowAllButton();
		},

		_createAutocomplete: function () {
			var selected = this.element.children(":selected"),
				value = selected.val() ? selected.text() : "";

			this.input = $("<input>")
				.appendTo(this.wrapper)
				.attr("title", "")
				.addClass("custom-combobox-input ui-widget ui-widget-content ui-state-default ui-corner-left")
				.autocomplete({
					delay: 0,
					minLength: 0,
					source: $.proxy(this, "_source")
				})
				.tooltip({
					classes: {
						"ui-tooltip": "ui-state-highlight"
					}
				});

			this._on(this.input, {
				autocompleteselect: function (event, ui) {
					ui.item.option.selected = true;
					this._trigger("select", event, {
						item: ui.item.option
					});
				},

				autocompletechange: "_removeIfInvalid"
			});
		},

		_createShowAllButton: function () {
			var input = this.input,
				wasOpen = false;

			$("<a>")
				.attr("tabIndex", -1)
				.attr("title", "Show All Items")
				.tooltip()
				.appendTo(this.wrapper)
				.button({
					icons: {
						primary: "ui-icon-triangle-1-s"
					},
					text: false
				})
				.removeClass("ui-corner-all")
				.addClass("custom-combobox-toggle ui-corner-right")
				.on("mousedown", function () {
					wasOpen = input.autocomplete("widget").is(":visible");
				})
				.on("click", function () {
					input.trigger("focus");

					// Close if already visible
					if (wasOpen) {
						return;
					}

					// Pass empty string as value to search for, displaying all results
					input.autocomplete("search", "");
				});
		},

		_source: function (request, response) {
			var matcher = new RegExp($.ui.autocomplete.escapeRegex(request.term), "i");
			response(this.element.children("option").map(function () {
				var text = $(this).text();
				if (this.value && ( !request.term || matcher.test(text) ))
					return {
						label: text,
						value: text,
						option: this
					};
			}));
		},

		_removeIfInvalid: function (event, ui) {
			// don't need this feature
			return;

			// Selected an item, nothing to do
			if (ui.item) {
				return;
			}

			// Search for a match (case-insensitive)
			var value = this.input.val(),
				valueLowerCase = value.toLowerCase(),
				valid = false;
			this.element.children("option").each(function () {
				if ($(this).text().toLowerCase() === valueLowerCase) {
					this.selected = valid = true;
					return false;
				}
			});

			// Found a match, nothing to do
			if (valid) {
				return;
			}

			// Remove invalid value
			this.input
				.val("")
				.attr("title", value + " didn't match any item")
				.tooltip("open");
			this.element.val("");
			this._delay(function () {
				this.input.tooltip("close").attr("title", "");
			}, 2500);
			this.input.autocomplete("instance").term = "";
		},

		_destroy: function () {
			this.wrapper.remove();
			this.element.show();
		}
	});

	module.jqueryAutocomplete.start = function ($control) {
		$control.combobox({
			select: function (event, ui) {
				$(this).parent().find('input').val(this.value);
				$(this).trigger('change');
			}
		});
	};

	module.jqueryAutocomplete.loadFromStorage = function ($select, storageId) {
		// loading expressions history from localStorage
		var expressionHistory = localStorage.getObject(storageId) || [];

		// assembling options for <select>
		var expressionOptions = '';
		$(expressionHistory).each(function (index, item) {
			expressionOptions += String.format('<option>{0}</option>', item);
		});

		// updating options
		$select.html(expressionOptions);
	};

	module.jqueryAutocomplete.handleChangesAndStore = function ($input, storageId) {
		$select = $input.parent().prev();

		var currentVal = $input.val();
		var isPresent = false;
		var items = [];

		// is currentVal already in options list ?
		$select.find('option').each(function (index, $item) {
			var optionVal = $($item).text();

			// storing in array ( to save in storage later )
			items.pushUniq(optionVal);

			if (optionVal === currentVal) {
				isPresent = true;
			}
		});

		// add item to list if not present
		if (!isPresent) {
			currentVal = currentVal.replace('<', '&lt;').replace('>', '&gt;');
			$select.prepend(String.format('<option>{0}</option>', currentVal));
			items.unshift(currentVal);
		}

		// update storage
		localStorage.setObject(storageId, items);
	};

	return module;

})(module || {});