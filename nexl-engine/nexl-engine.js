/**************************************************************************************
 nexl-engine

 Copyright (c) 2016 Yevgeny Sergeyev
 License : Apache 2.0

 nexl expressions processor
 **************************************************************************************/

var esprima = require('esprima');
var path = require('path');
var util = require('util');
var fs = require('fs');

module.exports = (function () {

    /**
     * modifiers change the expression's behaviour
     * modifiers apply at the end of expression
     * you can specify multiply modifiers for single expression
     * even you can specify the same modifier many times for single expression ( doesn't work for all modifiers )
     * for example : ${JS_VARIABLE:10}
     * which means if JS_VARIABLE is not defined, engine will apply the default value 10 for this expression
     */
    var MODIFIERS = {
        "DELIMITER": "?",
        "DEF_VALUE": ":",
        "DONT_OMIT_WHOLE_EXPRESSION": "+",
        "OMIT_WHOLE_EXPRESSION": "-",
        "ABORT_ON_UNDEF_VAR": "!",
        "TREAT_AS": "~",
        "REVERSE_RESOLUTION": "<"
    };

    /**
     * global settings for nexl script evaluation
     * you can override it by specifying the name of setting as external argument
     * for example : evalNexlExpression(src, expression, { DEFAULT_DELIMITER: ',' });
     * which means to change the default delimiter to , character
     */
    var GLOBAL_SETTINGS = {
        // is used when concatenating arrays
        DEFAULT_DELIMITER: "\n",

        // abort/not abort script execution if it's met an undefined variable
        ABORT_ON_UNDEFINED_VAR: true,

        // who is stronger the external arguments or variables in source script with the same name ?
        ARGS_ARE_OVERRIDING_SRC: true,

        // if true and has an undefined variables, the whole expression will be omitted
        SKIP_UNDEFINED_VARS: false
    };

    function isString(obj) {
        return Object.prototype.toString.call(obj) === "[object String]";
    }

    function isArray(obj) {
        return Object.prototype.toString.call(obj) === "[object Array]";
    }

    function isObject(obj) {
        return Object.prototype.toString.call(obj) === "[object Object]";
    }

    function wrapWithArrayIfNeeded(obj) {
        return isArray(obj) ? obj : [obj];
    }

    function wrapWithObjIfNeeded(obj, key) {
        if (isObject(obj)) {
            return obj;
        }
        var result = {};
        result[key] = obj;
        return result;
    }

    function concatArrays(arr1, arr2) {
        for (var i = 0; i < arr2.length; i++) {
            arr1.push(arr2[i]);
        }
    }

    function obj2ArrayIfNeeded(obj) {
        if (!isObject(obj)) {
            return obj;
        }
        var result = [];
        for (var field in obj) {
            var value = obj[field];
            value = obj2ArrayIfNeeded(value);
            value = wrapWithArrayIfNeeded(value);
            concatArrays(result, value);
        }
        return result;
    }

    function isValSet(val) {
        return (val != null) && ( val != undefined );
    }

    function replaceAll(str, searchVal, replaceVal) {
        var result = str;
        while (result.indexOf(searchVal) >= 0) {
            result = result.replace(searchVal, replaceVal);
        }
        return result;
    }

    function resolveIncludeDirectiveDom(item) {
        if (!item.expression || item.expression["type"] != "Literal") {
            return null;
        }

        var itemValue = item.expression.raw;

        if (!itemValue) {
            return null;
        }

        // regex tells : starts from quote OR single quote, @ character, one OR unlimited amount of any character, ends with the same quote which it was started
        itemValue = itemValue.match(/^('|")@\s(.+)(\1)$/);
        if (itemValue && itemValue.length === 4) {
            return itemValue[2];
        } else {
            return null;
        }
    }

    function assembleSourceCodeAsFile(asFile) {
        var result;
        var fileName = asFile.fileName;

        if (!fs.existsSync(fileName)) {
            throw util.format("The source  [%s], doesn't exist", fileName);
        }

        if (!fs.lstatSync(fileName).isFile()) {
            throw util.format("The  [%s] source is not a file", fileName);
        }

        try {
            result = fs.readFileSync(fileName, "UTF-8");
        } catch (e) {
            throw util.format("Failed to read [%s] source content , error : [%s]", fileName, e);
        }


        // resolving include directives
        var includeDirectives = resolveIncludeDirectives(result);

        // iterating over and processing
        for (var index in includeDirectives) {
            var includeDirective = includeDirectives[index];

            // does directive have an absolute path ?
            if (path.isAbsolute(includeDirective)) {
                result += assembleSourceCodeAsFile({"fileName": includeDirective});
                continue;
            }

            // resolve file path
            var filePath = path.dirname(fileName);

            var fullPath = path.join(filePath, includeDirective);
            result += assembleSourceCodeAsFile({"fileName": fullPath});
        }

        return result;
    }

    // parses javascript provided as text and resolves nexl include directives ( like "@import ../../src.js"; )
    function resolveIncludeDirectives(text) {
        var result = [];

        // parse source code with esprima
        var srcParsed = esprima.parse(text);

        // iterating over and looking for include directives
        for (var key in srcParsed.body) {
            var item = srcParsed.body[key];

            // resolve include directive from dom item
            var includeDirective = resolveIncludeDirectiveDom(item);
            if (includeDirective != null) {
                result.push(includeDirective);
            }
        }

        return result;
    }

    function assembleSourceCodeAsText(asText) {
        var result = asText.text;

        // resolving include directives
        var includeDirectives = resolveIncludeDirectives(asText.text);

        // iterating over and processing
        for (var index in includeDirectives) {
            var includeDirective = includeDirectives[index];

            // does directive have an absolute path ?
            if (path.isAbsolute(includeDirective)) {
                result += assembleSourceCodeAsFile({"fileName": includeDirective});
                continue;
            }

            // directive has a relative path. is path4imports provided ?
            if (!asText.path4imports) {
                throw "Your source code contains an include directive(s), but you didn't provide a path";
            }

            if (!fs.existsSync(asText.path4imports)) {
                throw util.format("Path you have provided [%s] doesn't exist", asText.path4imports);
            }

            var fullPath = path.join(asText.path4imports, includeDirective);
            result += assembleSourceCodeAsFile({"fileName": fullPath});
        }

        return result;
    }

    function assembleSourceCode(nexlSource) {
        // validating nexlSource
        if (typeof nexlSource === 'undefined') {
            throw "nexlSource is not provided";
        }

        // is both provided ?
        if (nexlSource.asText && nexlSource.asFile) {
            throw "You have to provide asText or asFile, but not both at a same time";
        }

        if (nexlSource.asText) {
            return assembleSourceCodeAsText(nexlSource.asText);
        }

        if (nexlSource.asFile) {
            return assembleSourceCodeAsFile(nexlSource.asFile);
        }

        throw "nexlSource is empty ( doesn't contain asText or asFile )";
    }


    /**
     * nexlSource is a javascript which describes you data model
     * can be provided as text or file ( nexlSource is object )
     * to provide as text : nexlSource.asText.text, nexlSource.asText.path4imports ( optional )
     * to provide as file : nexlSource.asFile.fileName

     * nexlExpression is a nexl language expression to access data from nexlSource
     * ( for example, to access HOSTS variable in javascript, use the following expression : ${HOSTS} )

     * externalArgs is to override javascript variables in nexlSource ( optional )
     */
    function evalNexlExpression(nexlSource, nexlExpression, externalArgs) {
        var lastEvalError;

        function isCharAt(str, char, index) {
            if (str[index] != char) {
                return false;
            }

            if ((index > 0) && (str[index - 1] == '\\')) {
                return false;
            }
            return true;
        }

        function isContainsValue(obj, reversedKey) {
            if (isString(obj)) {
                obj = assembleExpressionWrapper(obj);
            }
            if (isArray(obj) && obj.length == 1) {
                obj = obj[0];
            }
            if (isString(obj)) {
                for (var i = 0; i < reversedKey.length; i++) {
                    var item = unescape(reversedKey[i]);
                    if (item === obj) {
                        return true;
                    }
                }
            }
            if (isArray(obj)) {
                for (var i = 0; i < obj.length; i++) {
                    if (isContainsValue(obj[i], reversedKey)) {
                        return true;
                    }
                }
            }
            if (isObject(obj)) {
                for (var key in obj) {
                    if (isContainsValue(obj[key], reversedKey)) {
                        return true;
                    }
                }
            }
            return false;
        }

        function unescapeString(str) {
            var regex = new RegExp(MODIFIERS_ESCAPE_REGEX, "g");
            return str.replace(regex, "$1");
        }

        function unescape(item) {
            if (isString(item)) {
                return unescapeString(item);
            }
            if (isArray(item)) {
                for (var i = 0; i < item.length; i++) {
                    item[i] = unescape(item[i]);
                }
            }
            return item;
        }

        function retrieveSettings(name) {
            if (!externalArgs || !externalArgs.hasOwnProperty(name)) {
                return GLOBAL_SETTINGS[name];
            }

            return externalArgs[name];
        }

        function retrieveBoolSettings(name) {
            var val = retrieveSettings(name);
            return val.toString() == "true";
        }

        function assembleModifiersRegex() {
            MODIFIERS_ESCAPE_REGEX = "";
            for (var key in MODIFIERS) {
                var val = MODIFIERS[key];
                val = val.replace(/(\?)|(\+)/, "\\\\$&");
                var item = "|\\\\(" + val + ")";
                MODIFIERS_ESCAPE_REGEX += item;
            }
            if (MODIFIERS_ESCAPE_REGEX.length > 0) {
                MODIFIERS_ESCAPE_REGEX = MODIFIERS_ESCAPE_REGEX.replace(/^./, "");
            }
        }

        function init() {
            assembleModifiersRegex();
        }

        function abortErrMsg(varStuff) {
            var varName = varStuff.varName;
            var msg = "It seems the [" + varName + "] variable is not defined.\nlastEvalError = " + lastEvalError;
            if (varStuff.MODIFIERS.REVERSE_RESOLUTION) {
                msg += ". Or reverse resolution is failed ( key not found )";
            }
            return msg;
        }

        function evalNative(expression) {
            try {
                var splitted = expression.split(".");
                var evalExpression = splitted[0];
                for (var i = 1; i < splitted.length; i++) {
                    var item = splitted[i];
                    if (item == "") {
                        continue;
                    }
                    item = unescape(item);
                    evalExpression += ("[\"" + item + "\"]");
                }
                return eval(evalExpression);
            } catch (e) {
                lastEvalError = e;
                return null;
            }
        }

        // jsVariable can point to object's property, for example : x.y.z
        function evalNativeWrapper(jsVariable) {
            // if externalArgs is not provided, just evaluate jsVariable
            if (!externalArgs) {
                return evalNative(jsVariable);
            }

            // are external arguments weaker than source ?
            if (!retrieveBoolSettings('ARGS_ARE_OVERRIDING_SRC')) {
                return evalNative(jsVariable);
            }

            // retrieving value from external args
            var result = externalArgs[jsVariable];

	        // still doesn't have a value ?
            if (!isValSet(result)) {
                result = evalNative(jsVariable);
            }

	        // got an external argument
	        // preventing arguments to be evaluated ( i.e. preventing code injection in external arguments )
	        // nexl engine evaluates nexl expressions, checking is the result a nexl expression ?
	        if (hasFirstLevelVars(result)) {
		        throw "You can't pass a nexl expression in external arguments. Escape a $ sign in your argument if you didn't intend to pass an expression";
	        }

	        return result;
        }

        function evalNexlVariable(varName) {
            var result = [];

            // extracting variable stuff ( modifiers, var name, ... )
            var varStuff = extractVarStuff(varName);

            // varName can contain sub-variables. assembling them if exist ( and we don't need to omit an empty expression )
            var variables = assembleExpressionWrapper(varStuff.varName, false);

            // retrieving the OMIT_WHOLE_EXPRESSION/DONT_OMIT_WHOLE_EXPRESSION modifier value
            var isOmitWholeExpression = retrieveOmitWholeExpression(varStuff);

            // iterating over variables ( previous iteration in assembleExpression() can bring more that 1 result )
            for (var i = 0; i < variables.length; i++) {
                var variable = variables[i];

                // evaluating javascript variable
                var evaluatedValue = evalNativeWrapper(variable);

                // applying related modifiers
                var values = applyModifiers(evaluatedValue, varStuff);

                // iterating over values and accumulating result in [result]
                for (var j = 0; j < values.length; j++) {
                    var item = values[j];

                    if (item == null) {
                        if (!isOmitWholeExpression) {
                            result.push(null);
                        }
                        continue;
                    }

                    // value can contain sub-variables, so assembling them
                    var items = assembleExpressionWrapper(item, isOmitWholeExpression);

                    if (items.length == 1 && items[0] == null) {
                        if (!isOmitWholeExpression) {
                            result.push(null);
                        }
                        continue;
                    }

                    // accumulating result in [result]
                    concatArrays(result, items);
                }
            }

            varStuff.value = result;
            return varStuff;
        }

        function jsonReverseResolution(json, reversedKey) {
            var result = [];
            reversedKey = assembleExpressionWrapper(reversedKey);
            for (var key in json) {
                var val = json[key];
                if (isContainsValue(val, reversedKey)) {
                    result.push(key);
                }
            }
            return result.length < 1 ? null : result;
        }

        function obj2Xml(objCandidate) {
            throw '~X modifier still not implemented';
        }

        function applyTreatAsModifier(objCandidate, treatAs, varStuff) {
            // force make object
            if (treatAs === 'O') {
                var result = wrapWithObjIfNeeded(objCandidate, varStuff.varName);
                return JSON.stringify(result);
            }

            if (!isObject(objCandidate)) {
                return objCandidate;
            }

            switch (treatAs) {
                // keys
                case 'K': {
                    return Object.keys(objCandidate);
                }

                // values
                case 'V': {
                    return obj2ArrayIfNeeded(objCandidate);
                }

                // as xml
                case 'X' : {
                    return obj2Xml(objCandidate);
                }
            }

            return JSON.stringify(objCandidate);
        }

        function applyModifiers(result, varStuff) {
            // apply json reverse resolution is present
            if (varStuff.MODIFIERS.REVERSE_RESOLUTION && isObject(result)) {
                result = jsonReverseResolution(result, varStuff.MODIFIERS.REVERSE_RESOLUTION);
            }

            // apply default value if value not set
            if (!isValSet(result)) {
                result = retrieveDefaultValue(varStuff.MODIFIERS.DEF_VALUE);
            }

            // abort script execution if value still not set and [!C] modifier is not applied
            abortScriptIfNeeded(result, varStuff);

            result = applyTreatAsModifier(result, varStuff.MODIFIERS.TREAT_AS, varStuff);

            result = wrapWithArrayIfNeeded(result);
            return result;
        }

        function abortScriptIfNeeded(val, varStuff) {
            if (isValSet(val)) {
                return;
            }
            var is2Abort = varStuff.MODIFIERS.ABORT_ON_UNDEF_VAR;
            if (is2Abort == "A") {
                throw abortErrMsg(varStuff);
            }
            if (is2Abort == "C") {
                return;
            }

            if (retrieveBoolSettings('ABORT_ON_UNDEFINED_VAR')) {
                throw abortErrMsg(varStuff);
            }
        }

        function isDefValueSet(value) {
            if (!value) {
                return false;
            }

            if (isArray(value)) {
                if (value.length > 1) {
                    return true;
                }
                if (value.length < 1) {
                    return false;
                }
                return value[0] != null;
            }

            if (isObject(value)) {
                for (var key in value) {
                    return true;
                }
                return false;
            }

            return value != "";
        }

        function retrieveDefaultValue(defValue) {
            if (!defValue) {
                return null;
            }
            for (var i = 0; i < defValue.length; i++) {
                var item = defValue[i];
                var value = assembleExpressionWrapper(item);
                if (isDefValueSet(value)) {
                    return unescape(value);
                }
            }
            return null;
        }

        function retrieveOmitWholeExpression(varStuff) {
            if (varStuff.MODIFIERS.OMIT_WHOLE_EXPRESSION != null) {
                return true;
            }
            if (varStuff.MODIFIERS.DONT_OMIT_WHOLE_EXPRESSION != null) {
                return false;
            }
            return retrieveBoolSettings('SKIP_UNDEFINED_VARS');
        }

        function isVarStuffEmpty(varStuff) {
            return varStuff.value.length == 0 || ( varStuff.value.length == 1 && varStuff.value[0] == null );
        }

        // when items are joined into one string separated by [delimiter]
        function substituteFlat(expression, searchVal, replaceVal, delimiter, result) {
            var preResult = [];

            // iterating over replace values and aggregating them in [preResult]
            for (var i = 0; i < replaceVal.length; i++) {
                var item = replaceVal[i];

                // replacing null with empty string
                item = (item == null) ? "" : item;

                // adding
                preResult.push(item);
            }

            // joining all
            preResult = preResult.join(delimiter);

            // substituted values with [delimiter]
            preResult = replaceAll(expression, searchVal, preResult);

            // adding to [result]
            result.push(preResult);
        }

        // this is default behaviour when all items are joined as array
        function substituteVertical(expression, searchVal, replaceVal, result) {
            for (var i = 0; i < replaceVal.length; i++) {
                var item = replaceVal[i];

                // expression is same as search value and item is null
                // this is done to push real [null] values to result, otherwise stringified null is pushed ['null']
                if (expression == searchVal && item == null) {
                    result.push(null);
                    continue;
                }

                // replacing [null] with empty string to perform substitute
                item = (item == null) ? "" : item;

                // substituting
                item = replaceAll(expression, searchVal, item);

                result.push(item);
            }
        }

        function substExpressionValues(expression, searchVal, varStuff) {
            var result = [];

            // discovering delimiter
            var delimiter = varStuff.MODIFIERS.DELIMITER;
            delimiter = unescape(delimiter);
            delimiter = isValSet(delimiter) ? delimiter : retrieveSettings('DEFAULT_DELIMITER');

            // preparing replaceVal
            var replaceVal = isVarStuffEmpty(varStuff) ? [null] : wrapWithArrayIfNeeded(varStuff.value);

            // iterating over expression ( expression can be array ) and substituting [replaceVal]
            for (var i = 0; i < expression.length; i++) {

                var item = expression[i];

                if (delimiter == "\n") {
                    // every value is pushed to [result]
                    substituteVertical(item, searchVal, replaceVal, result);
                } else {
                    // all values are aggregated in one string and then this final string is pushed to [result]
                    substituteFlat(item, searchVal, replaceVal, delimiter, result);
                }

            }

            return result;
        }

        function extractFirstLevelVarWrapper(str) {
            var start = 0;
            while (true) {
                start = str.indexOf("${", start);
                if (start < 0) {
                    return [null, null];
                }
                if (( start > 0 ) && ( str.charAt(start - 1) == '\\' )) {
                    start++;
                    continue;
                }
                break;
            }
            var bracketsCnt = 1;
            for (var i = start + 2; i < str.length; i++) {
                var ch = str[i];
                if (ch == "}") {
                    bracketsCnt--;
                }
                if (ch == "{") {
                    bracketsCnt++;
                }
                if (bracketsCnt <= 0) {
                    var extractedVar = str.substr(start, i - start + 1);
                    str = str.substr(i);
                    return [extractedVar, str];
                }
            }
            return [null, null];
        }

        function extractFirstLevelVars(str) {
            var result = [];
            var multiResult = extractFirstLevelVarWrapper(str);
            while (multiResult[0]) {
                result.push(multiResult[0]);
                str = multiResult[1];
                multiResult = extractFirstLevelVarWrapper(str);
            }
            return result;
        }

	    function hasFirstLevelVars(str) {
		    return extractFirstLevelVars(str).length > 0;
	    }

        function whereIsVariableEnds(str, index) {
            if (str.length < index + 4) {
                throw "Invalid variable declaration. Variable length seems to short. Variable is [" + str + "]";
            }
            if (str.charAt(index + 1) != '{') {
                throw "Bad expression. In the [" + str + "] at the " + index + " position should be an open bracket";
            }
            var bracketsCnt = 0;
            for (var i = index + 1; i < str.length; i++) {
                if (isCharAt(str, '}', i)) {
                    bracketsCnt--;
                }
                if (isCharAt(str, '{', i)) {
                    bracketsCnt++;
                }
                if (bracketsCnt <= 0) {
                    return i;
                }
            }
            throw "Variable [" + str + "] is not closed with right bracket";
        }

        function addFirstLevelVars(nexlVar, varStuff) {
            var index = 0;
            while (index < nexlVar.length) {
                if (isModifierAt(nexlVar, index)) {
                    return index;
                }
                if (!isCharAt(nexlVar, '$', index)) {
                    index++;
                    continue;
                }
                var varEndIndex = whereIsVariableEnds(nexlVar, index);
                var varName = nexlVar.substring(index, varEndIndex + 1);
                varStuff.FIRST_LEVEL_VARS.push(varName);
                index = varEndIndex + 1;
            }
        }

        function isModifierAt(str, index) {
            for (var modifierName in MODIFIERS) {
                var modifierChar = MODIFIERS[modifierName];
                if (isCharAt(str, modifierChar, index)) {
                    return {"name": modifierName, "index": index};
                }
            }
            return null;
        }

        function findNexlModifier(str, fromIndex) {
            var i = fromIndex;
            while (i < str.length) {
                if (isCharAt(str, '$', i)) {
                    i = whereIsVariableEnds(str, i) + 1;
                    continue;
                }
                var modifier = isModifierAt(str, i);
                if (modifier != null) {
                    return modifier;
                }
                i++;
            }
            return null;
        }

        function isModifierOn(modifier) {
            return typeof modifier !== 'undefined';
        }

        function pushDefValueModifier(varStuff, modifier, value) {
            if (!varStuff.MODIFIERS[modifier]) {
                varStuff.MODIFIERS[modifier] = [];
            }
            varStuff.MODIFIERS[modifier].push(value);
        }

        function validateAndPushModifier(varStuff, item) {
            var modifier = item.name;
            if (MODIFIERS[modifier] == MODIFIERS.DEF_VALUE) {
                pushDefValueModifier(varStuff, modifier, item.value);
                return;
            }
            if (isModifierOn(varStuff.MODIFIERS[modifier])) {
                throw "You can't use more than one [" + MODIFIERS[modifier] + "] modifier for [" + varStuff.varName + "] variable";
            }
            varStuff.MODIFIERS[modifier] = item.value;
            if (isModifierOn(varStuff.MODIFIERS.OMIT_WHOLE_EXPRESSION) && isModifierOn(varStuff.MODIFIERS.DONT_OMIT_WHOLE_EXPRESSION)) {
                throw "You can't use the [+] and [-] modifiers simultaneously for [" + varStuff.varName + "] variable";
            }
        }

        function addModifiers(str, varStuff) {
            var modifiers = [];
            var index = 0;
            while (index < str.length) {
                var modifier = findNexlModifier(str, index);
                if (modifier == null) {
                    break;
                }
                modifiers.push(modifier);
                index = modifier.index + 1;
            }
            var dummyItem = {"index": str.length};
            modifiers.push(dummyItem);
            for (var i = 1; i < modifiers.length; i++) {
                var currentItem = modifiers[i - 1];
                var nextItem = modifiers[i];
                var item = {};
                item.name = currentItem.name;
                item.value = str.substring(currentItem.index + 1, nextItem.index);
                validateAndPushModifier(varStuff, item);
            }
        }

        function extractVarStuff(nexlVar) {
            nexlVar = nexlVar.replace(/^(\${)|}$/g, "");
            var varStuff = {};
            varStuff.MODIFIERS = {};
            varStuff.FIRST_LEVEL_VARS = [];
            var lastIndex = addFirstLevelVars(nexlVar, varStuff);
            varStuff.varName = nexlVar.substring(0, lastIndex);
            var modifiers = nexlVar.substr(lastIndex);
            addModifiers(modifiers, varStuff);
            return varStuff;
        }

        function assembleExpressionWrapper(expression, isOmitWholeExpression) {
            // converting expression to string if needed
            if (!isString(expression)) {
                expression = expression.toString();
            }

            var result = [expression];

            // extracting first level variables from expression
            var flvs = extractFirstLevelVars(expression);

            // iterating over first level variables, evaluating, substituting to [result]
            for (var i = 0; i < flvs.length; i++) {
                // first level variable
                var flv = flvs[i];

                // evaluating nexl variable
                var varStuff = evalNexlVariable(flv);

                // if [isOmitWholeExpression] is ON and [varStuff.value] is empty, omitting the whole expression
                if (isOmitWholeExpression && isVarStuffEmpty(varStuff)) {
                    return [null];
                }

                // substituting value
                result = substExpressionValues(result, flv, varStuff);
            }

            return result;
        }

        var sourceCode = assembleSourceCode(nexlSource);

        try {
            eval(sourceCode);
        } catch (e) {
            throw "Got a problem with a source script: " + e;
        }

        // initializing
        init();

        // assembling
        return assembleExpressionWrapper(nexlExpression, false);
    }

    function resolveVarDeclarations(varDeclaration) {
        var result = [];
        for (var i = 0; i < varDeclaration.declarations.length; i++) {
            var item = varDeclaration.declarations[i];
            result.push(item.id.name);
        }

        return result;
    }

    function resolveJsVariables(nexlSource) {
        var sourceCode = assembleSourceCode(nexlSource);
        var parsedCode = esprima.parse(sourceCode).body;
        var result = [];
        for (var i = 0; i < parsedCode.length; i++) {
            var item = parsedCode[i];
            if (item.type !== 'VariableDeclaration') {
                continue;
            }

            var declarations = resolveVarDeclarations(item);
            result = result.concat(declarations);
        }

        return result.sort();
    }

    return {
        evalNexlExpression: evalNexlExpression,
        'settings-list': Object.keys(GLOBAL_SETTINGS),
        resolveJsVariables: resolveJsVariables
    };
}());
