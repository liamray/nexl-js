var module = (function (module) {
    module.dirBrowser = {};

    function handleRootItemsWrapper(mounts, callback) {
        var result = [];
        for (var i = 0; i < mounts.length; i++) {
            var mount = mounts[i];
            var item = {
                children: true,
                text: mount,
                id: i,
                data: mount
            };
            result.push(item);
        }

        callback(result);
    }

    function handleRootItems(callback) {
        module.utils.restCall('/rest/list-mounts', {}, function (data) {
            handleRootItemsWrapper(data.mounts, callback);
        }, function (err) {
            module.nexlui.popupMessage('Failed to read mounts', 'Error');
        });
    }

    function handleChildItemsWrapper(node, cb, files) {
        var result = [];

        for (var i = 0; i < files.length; i++) {
            var file = files[i];
            if (file.isFile) {
                continue;
            }

            var item = {
                children: true,
                text: module.utils.shortFileName(file.name),
                "data": file.name
            };

            result.push(item);
        }

        cb(result);
    }

    function handleChildItems(tree, node, cb) {
        var path = tree.jstree(true).get_node(node.id).data;

        module.utils.restCall('/rest/list-files', {path: path}, function (data) {
            handleChildItemsWrapper(node, cb, data.files);
        }, function (err) {
            cb([]);
        });
    }

    function openTree(tree) {
        function queryBranch(node, cb) {
            // is root ? handle roots ( mounts )
            if (node.id === "#") {
                handleRootItems(cb);
                return;
            }

            // not a root, handle dir names
            handleChildItems(tree, node, cb);
        }


        // data from callback
        tree.jstree({
            'core': {
                'data': queryBranch
            }
        });
    }

    function assignTreeEvents(tree, callback) {
        tree.on("changed.jstree", function (e, data) {
            if (!data.selected.length) {
                return;
            }

            callback(data.node.data);
        });
    }

    module.dirBrowser.start = function ($id, callback) {
        var tree = $($id);

        // clean tree
        tree.jstree("destroy").empty();

        assignTreeEvents(tree, callback);
        openTree(tree);
    };

    return module;

})(module || {});