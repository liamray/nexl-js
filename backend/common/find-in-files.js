const FIND_IN_FILES = {};
FIND_IN_FILES.resolveFindFunction = resolveFindFunction;

if (typeof DI_CONSTANTS === 'undefined') {
	DI_CONSTANTS = require('./data-interchange-constants.js');
}

// --------------------------------------------------------------------------------

function findOccurrencesInFileRegex(data) {
	return data.fileContent.split(/\r\n|\r|\n/).map(function (line, i) {
		if (data.maxOccurrences < 0) {
			return;
		}
		if (line.match(data.regex) !== null) {
			data.maxOccurrences--;
			return {
				line: line,
				number: i + 1
			};
		}
	}).filter(Boolean);
}

function findOccurrencesInFileSimple(data) {
	return data.fileContent.split(/\r\n|\r|\n/).map(function (aLine, i) {
		if (data.maxOccurrences < 0) {
			return;
		}
		const line = data.matchCase ? aLine : aLine.toLowerCase();
		if (line.indexOf(data.text) >= 0) {
			data.maxOccurrences--;
			return {
				line: aLine,
				number: i + 1
			};
		}
	}).filter(Boolean);
}

function resolveFindFunction(data) {
	if (data[DI_CONSTANTS.IS_REGEX]) {
		let flags = 'g';
		flags += (data[DI_CONSTANTS.MATCH_CASE] ? '' : 'i');
		return {
			func: findOccurrencesInFileRegex,
			regex: new RegExp(data[DI_CONSTANTS.TEXT], flags)
		};
	}

	return {
		func: findOccurrencesInFileSimple,
		text: data[DI_CONSTANTS.MATCH_CASE] ? data[DI_CONSTANTS.TEXT] : data[DI_CONSTANTS.TEXT].toLowerCase(),
		matchCase: data[DI_CONSTANTS.MATCH_CASE]
	}
}

// --------------------------------------------------------------------------------

// backend module support
if (typeof module !== 'undefined') {
	module.exports = resolveFindFunction;
}