/**
 * East (e) resizable div
 * Based on jquery resizable
 *
 *
 */

var module = (function (module) {
    module.jqueryEResizable = {};

    function create() {
        resizeWrapper($(this), $(this).next(), $(this).parent());
    }

    function resize(e, ui) {
        resizeWrapper(ui.element, ui.element.next(), ui.element.parent());
    }

    function stop(e, ui) {
        var parent = ui.element.parent();
        ui.element.css(
            {
                width: ui.element.width() / parent.width() * 100 + "%"
            });
    }

    function resizeWrapper(div1, div2, parent) {
        var remainingSpace = parent.width() - div1.outerWidth();
        var div2Width = (remainingSpace - (div2.outerWidth() - div2.width())) / parent.width() * 100 + "%";
        div2.width(div2Width);
    }

    module.jqueryEResizable.start = function (id, params) {
        params = params || {};
        params.create = create;
        params.resize = resize;
        params.stop = stop;

        params.autoHide = true;
        params.handles = 'e';

        $(id).resizable(params);
    };

    return module;

})(module || {});