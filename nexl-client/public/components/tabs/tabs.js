/**
 * tabs control module
 */

var module = (function (module) {
    module.tabs = {};

    // nexl sources explorer
    const LIST_NEXL_SOURCES_URL = '/nexl-rest/list-nexl-sources';
    const TAB_CONTAINER_4JS_TREE = 'tab-container-4js-tree';
    const EXPLORE_NEXL_SOURCES = '.explore-nexl-sources';

    var templates = {
        TAB_TITLE_TEMPLATE: 'tab-title-template.html',
        FILE_TAB_TEMPLATE: 'file-tab-template.html',
        REMOTE_TAB_TEMPLATE: 'remote-tab-template.html',
        EXPRESSION_TEMPLATE: 'expression-template.html'
    };

    // assuming tabs container has a '#tabs' id
    const TABS_CONTAINER_ID = '#tabs';

    // container's attributes
    const TAB_COUNTER = 'tab-counter';

    // li's attributes
    const IS_REMOTE_ATTR = 'is-remote';
    const IS_CHANGED = 'is-changed';
    const FILE_NAME = 'file-name';
    const FILE_NAME_SHORT = 'file-name-short';

    // storage ids
    const STORAGE_TABS = 'tabs';

    // misc
    const UNTITLED_TAB = 'untitled';
    const STORAGE_REMOTE_SERVERS = 'remote-server-history';

    function getTabsContainer() {
        return $(TABS_CONTAINER_ID);
    }

    function getOnesTabContainer($tab) {
        var id = $tab.attr('aria-controls');
        return $('#' + id);
    }

    function getExpression($tab) {
        return getOnesTabContainer($tab).find('.remote-tab-expression,.ace-tab-expression');
    }

    function getEditArea($tab) {
        return getOnesTabContainer($tab).find('.ace-tab-content');
    }

    function getEditAreaId($tab) {
        return getEditArea($tab).attr('id');
    }

    function getRemoteTabContent($tab) {
        return getOnesTabContainer($tab).find('.remote-tab-content');
    }

    function getRemoteServer($tab) {
        return getRemoteTabContent($tab).find('input');
    }

    function getRemoteNexlSource($tab) {
        return getRemoteTabContent($tab).find('.nexl-source');
    }

    function counter() {
        var $tabs = getTabsContainer();
        var counter = $tabs.data(TAB_COUNTER);
        $tabs.data(TAB_COUNTER, counter + 1);
        return counter;
    }

    function remote($tab, isRemote) {
        if (isRemote) {
            $tab.attr(IS_REMOTE_ATTR, isRemote);
        } else {
            return $tab.attr(IS_REMOTE_ATTR) === 'true';
        }
    }

    function changed($tab, isChanged) {
        if (isChanged === undefined) {
            return $tab.attr(IS_CHANGED) === 'true';
        }

        // changing tab state
        $tab.attr(IS_CHANGED, isChanged);
        var name = fileNameShort($tab);
        name = name ? name : UNTITLED_TAB;
        name = isChanged ? name + ' *' : name;

        setTabTitle($tab, name);
    }

    function fileName($tab, fName) {
        if (!fName) {
            return $tab.attr(FILE_NAME);
        }

        // updating file name
        $tab.attr(FILE_NAME, fName);
        var shortFileName = module.utils.shortFileName(fName);

        // updating short file name
        fileNameShort($tab, shortFileName);

        // hint
        setTabHint($tab, fName);
    }

    function fileNameShort($tab, fileNameShort) {
        if (fileNameShort) {
            $tab.attr(FILE_NAME_SHORT, fileNameShort);
            setTabTitle($tab, fileNameShort);
        } else {
            return $tab.attr(FILE_NAME_SHORT);
        }
    }

    function fileContent($tab, content) {
        var id = getEditAreaId($tab);

        if (content) {
            ace.edit(id).getSession().setValue(content);
            refreshAceEditor($tab);
        } else {
            return ace.edit(id).getSession().getValue();
        }
    }

    function url($tab, url) {
        var $remoteServer = getRemoteServer($tab);

        if (url) {
            $remoteServer.val(url);
        } else {
            return $remoteServer.val();
        }
    }

    function getRemoteUrl($tab) {
        var nexlServer = url($tab);

        // is url specified at all ?
        if (!nexlServer || nexlServer.length < 1) {
            return null;
        }

        var nexlSource = getRemoteNexlSource($tab).val();

        if (!nexlSource || nexlSource.length < 1) {
            return null;
        }

        // replacing windows slash chars with unix style, deleting learing slash if exists
        nexlSource = nexlSource.replace(/\\/g, '/').replace(/^\//, '');

        return String.format('http://{0}/{1}', nexlServer, nexlSource);
    }

    function getActiveTab() {
        var $tabs = getTabsContainer();
        var $tab = $tabs.find("ul li[aria-selected='true']");
        return $tab.length < 1 ? undefined : $tab;
    }

    function isExpressionFocused() {
        var $tab = getActiveTab();
        if (!$tab) {
            return false;
        }

        return getExpression($tab).find('input').is(':focus');
    }

    function expression($tab, expression) {
        var $expression = getExpression($tab).find('input');
        if (expression) {
            $expression.val(expression);
        } else {
            return $expression.val();
        }
    }

    // focuses on expression if not focused, otherwise focuses on edit/url
    function toggleExpressionFocus() {
        var $tab = module.tabs.getActiveTab();
        if (!$tab) {
            return;
        }

        var $expressionInput = getExpression($tab).find('input');

        if (!$expressionInput.is(":focus")) {
            $expressionInput.focus();
            return;
        }

        var $item = remote($tab) ? getRemoteServer($tab) : getEditArea($tab).find('textarea');
        $item.focus();
    }


    function resolveTabInfo($tab) {
        var result = {};

        if (remote($tab)) {
            result.nexlServer = url($tab);
            result.nexlSource = getRemoteNexlSource($tab).val();
            result.isRemoteTab = true;
        } else {
            result.fileName = fileName($tab);
            result.fileContent = fileContent($tab);
        }

        result.expression = expression($tab);

        return result;
    }


    function saveFile($tab, fName) {
        var url = "/rest/save-file";
        var fileContent = fileContent($tab);
        var params = {fileName: fName, fileContent: fileContent};

        module.utils.restCall(url, params, function () {
            fileName($tab, fileName);
            changed($tab, false);
        }, function (err) {
            module.nexlui.popupMessage('Failed to save file. Reason : ' + err.statusText, 'Error');
        });
    }

    function activateTab($tab) {
        $tab.find("a").click();
    }

    function createAceEditor($tab) {
        var id = getEditAreaId($tab);

        var aceEditor = ace.edit(id);
        aceEditor.setTheme("ace/theme/monokai");
        aceEditor.getSession().setMode("ace/mode/javascript");
        aceEditor.$blockScrolling = Infinity;
        aceEditor.on("change", function () {
            changed($tab, true);
        });
    }

    function refreshAceEditor($tab) {
        var id = getEditAreaId($tab);
        var aceEditor = ace.edit(id);
        aceEditor.renderer.updateFull(true);
    }

    function assignTreeEvents() {
        $(EXPLORE_NEXL_SOURCES).on("changed.jstree", function (e, data) {
            if (!data.selected.length) {
                return;
            }

            if (data.node.original.type === 'dir') {
                return;
            }

            // discovering value
            var val = data.instance.get_path(data.selected[0]).join('/');

            var $tab = getActiveTab();
            getRemoteNexlSource($tab).val('/' + val);

            $("#explore-nexl-sources-container").dialog('close');
        });
    }


    function openTree(data, $remoteTabContainer) {
        $(EXPLORE_NEXL_SOURCES).jstree("destroy").empty();
        assignTreeEvents();

        $(EXPLORE_NEXL_SOURCES).data(TAB_CONTAINER_4JS_TREE, $remoteTabContainer);

        $(EXPLORE_NEXL_SOURCES).jstree({
            'core': {
                'multiple': false,
                'data': data
            }
        });

        $("#explore-nexl-sources-container").dialog({
            width: 400,
            height: 300,
            modal: true,
            resizable: true,
            title: 'choose js file as nexl source'
        });
    }

    function addHttpPrefixIfNeeded(url) {
        if (url.indexOf('http://') < 0 && url.indexOf('https://')) {
            url = 'http://' + url;
        }

        return url;
    }

    function makeSourceUrl(url) {
        // adding http prefix if needed
        url = addHttpPrefixIfNeeded(url);

        // parsing url
        var urlParser = module.utils.urlParser(url);

        // making final url with [/nexl-rest/list-sources] addition at the end
        url = String.format('{0}//{1}{2}', urlParser.protocol, urlParser.host, LIST_NEXL_SOURCES_URL);

        return url;
    }

    function openNexlSourceExplorer($remoteTabContainer) {
        var $input = $remoteTabContainer.find('input');
        var url = $input.val();

        if (!url || url.length < 1) {
            return;
        }

        url = makeSourceUrl(url);

        module.utils.jsonPCall(url, {}, function (data) {
            if (data.error) {
                module.nexlui.popupMessage(data.error, 'Error');
                return;
            }
            openTree(data.data, $remoteTabContainer);
        }, function (xhr, status, error) {
            module.nexlui.popupMessage('Remote nexl server is not available', 'Error');
        });
    }

    function setTabTitle($tab, title) {
        $tab.find('a').html(title);
    }

    function setTabHint($tab, hint) {
        $tab.find('a').attr('title', hint);
    }

    function newRemoteTab() {
        var $tab = newEmptyTab(templates.REMOTE_TAB_TEMPLATE);

        // setting title and hint
        setTabTitle($tab, 'Remote');

        // making tab remote
        remote($tab, true);

        var $remoteTabContent = getRemoteTabContent($tab);

        // loading history
        module.jqueryAutocomplete.loadFromStorage($remoteTabContent.find('.remote-url'), STORAGE_REMOTE_SERVERS);

        // turning <select> into jquery-autocomplete component
        module.jqueryAutocomplete.start($remoteTabContent.find('.remote-url'));

        // handling blur event
        $remoteTabContent.find('input').blur(function () {
            module.jqueryAutocomplete.handleChangesAndStore($(this), STORAGE_REMOTE_SERVERS);
        });

        // assigning button click
        $remoteTabContent.find('.explore-nexl-source-button').on('click', function () {
            openNexlSourceExplorer($(this).parent());
        });

        return $tab;
    }

    function newFileTab() {
        var $tab = newEmptyTab(templates.FILE_TAB_TEMPLATE);

        // setting title and hint
        setTabTitle($tab, UNTITLED_TAB);
        setTabHint($tab, UNTITLED_TAB);

        // making tab not remote
        remote($tab, false);

        // setting up id for edit area
        var tabId = getOnesTabContainer($tab).attr('id');
        getEditArea($tab).attr('id', tabId + '-ace-edit');

        // adding ace editor
        createAceEditor($tab);

        return $tab;
    }


    function addExpression($tab) {
        var $expression = getExpression($tab);

        // injecting html
        $expression.html(templates.EXPRESSION_TEMPLATE);

        // discovering <select> with jQuery
        var $select = $expression.find('select');

        $expression.find('.choose-expression-button').on('click', function () {
            module.nexlui.chooseExpression($tab);
        });
    }


    function newEmptyTab(template) {
        var $tabs = getTabsContainer();

        // ids
        var tabId = 'tabs-' + counter();

        // creating <li> ( tab ) and adding
        var tabAsText = String.format(templates.TAB_TITLE_TEMPLATE, tabId);
        var $tab = $(tabAsText);
        $tabs.find(".ui-tabs-nav").append($tab);

        // create content container and adding
        var contentContainer = String.format(template, tabId);
        $tabs.append(contentContainer);

        // refreshing tabs
        $tabs.tabs("refresh");

        // adding expression
        addExpression($tab);

        // tab close interceptor
        handleTabClose($tab);

        return $tab;
    }

    function closeTab($tab) {
        $tab.remove();
        getOnesTabContainer($tab).remove();
        getTabsContainer().tabs("refresh");
    }

    function handleTabClose($tab) {
        $tab.find('span.ui-icon-close').on('click', function () {
            if (remote($tab)) {
                closeTab($tab);
                return;
            }

            if (changed($tab)) {
                module.nexlui.confirm(function () {
                    closeTab($tab);
                }, 'This tab contains unsaved data. Is to close it anyway ?');

                return;
            }

            closeTab($tab);
        });
    }

    function openFile(fName, callback) {
        var fileParam = {fileName: fName};
        var url = "/rest/read-file";

        module.utils.restCall(url, fileParam, function (data) {
            var $tab = newFileTab();
            fileName($tab, fName);
            fileContent($tab, data.fileContent);
            changed($tab, false);
            if (callback) {
                callback($tab);
            }
            activateTab($tab);
        }, function (err) {
            module.nexlui.popupMessage('Got error while opening [' + fName + '] file. Reason : ' + err.statusText, 'Error');
        });
    }

    function loadTabs() {
        var tabs = localStorage.getObject(STORAGE_TABS);

        $(tabs).each(function (index, tabInfo) {
            var $tab;

            // remote tab
            if (tabInfo.isRemoteTab) {
                $tab = newRemoteTab();
                url($tab, tabInfo.nexlServer);
                getRemoteNexlSource($tab).val(tabInfo.nexlSource);
                expression($tab, tabInfo.expression);
                activateTab($tab);
                return;
            }

            // file tab with existing file
            if (tabInfo.fileName && tabInfo.fileName !== '') {
                openFile(tabInfo.fileName, function ($tab) {
                    expression($tab, tabInfo.expression);
                });
                return;
            }

            // untitled file tab
            if (tabInfo.fileContent && tabInfo.fileContent !== '') {
                $tab = newFileTab();

                expression($tab, tabInfo.expression);
                fileContent($tab, tabInfo.fileContent);
                changed($tab, true);
                activateTab($tab);
            }
        });
    }

    function storeTabs() {
        var result = [];

        var $tabs = getTabsContainer();
        $tabs.find('ul li').each(function (index, tab) {
            var tabInfo = resolveTabInfo($(tab));

            // need file content only for untitled files
            if (tabInfo.fileName !== undefined) {
                delete tabInfo.fileContent;
            }

            result.push(tabInfo);
        });

        localStorage.setObject(STORAGE_TABS, result);
    }

    function getActiveFileTab() {
        var $tab = getActiveTab();

        if (!$tab) {
            return undefined;
        }

        return remote($tab) || $tab.length < 1 ? undefined : $tab;
    }

    function shakeExpression($tab) {
        getExpression($tab).effect("shake");
    }

    function hasUnsavedTabs() {
        var $tabs = getTabsContainer();
        var hasUnsavedTabs = false;
        $tabs.find('ul li').each(function (index, tab) {
            var $tab = $(tab);
            if (!remote($tab) && fileName($tab) !== undefined && changed($tab)) {
                hasUnsavedTabs = true;
            }
        });
        return hasUnsavedTabs;
    }

    function loadTabTemplate(url, template, isReady, callback) {
        $.get(url, function (data) {
            templates[template] = data;

            // decreasing a counter till 0, after that firing a callback()
            isReady.counter--;
            if (isReady.counter <= 0) {
                callback();
            }
        });
    }

    function loadTabTemplates(callback) {
        var isReady = {
            // templates count
            counter: Object.keys(templates).length
        };

        // iterating over templates and loading
        $.each(templates, function (key, val) {
            loadTabTemplate('/components/tabs/templates/' + val, key, isReady, callback);
        });
    }

    function assignEvent(event, callback) {
        var $tabs = getTabsContainer();
        var param = {};
        param[event] = callback;

        $tabs.tabs(param);
    }

    module.tabs.init = function (callMeAfterInit) {
        var $tabs = getTabsContainer();

        $tabs.tabs();

        // setting up counter
        $tabs.data(TAB_COUNTER, 1);

        loadTabTemplates(callMeAfterInit);
    };

    module.tabs.newFileTab = newFileTab;
    module.tabs.newRemoteTab = newRemoteTab;
    module.tabs.openFile = openFile;
    module.tabs.saveFile = saveFile;
    module.tabs.fileName = fileName;
    module.tabs.fileContent = fileContent;
    module.tabs.changed = changed;
    module.tabs.getActiveFileTab = getActiveFileTab;
    module.tabs.getActiveTab = getActiveTab;
    module.tabs.activateTab = activateTab;
    module.tabs.remote = remote;
    module.tabs.storeTabs = storeTabs;
    module.tabs.loadTabs = loadTabs;
    module.tabs.hasUnsavedTabs = hasUnsavedTabs;
    module.tabs.expression = expression;
    module.tabs.isExpressionFocused = isExpressionFocused;
    module.tabs.toggleExpressionFocus = toggleExpressionFocus;
    module.tabs.shakeExpression = shakeExpression;
    module.tabs.getRemoteUrl = getRemoteUrl;
    module.tabs.url = url;
    module.tabs.getRemoteNexlSource = getRemoteNexlSource;
    module.tabs.assignEvent = assignEvent;

    return module;

})(module || {});