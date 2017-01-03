// test external args override js vars
// test function call
// test standard functions call like Math.random()
// test function call when function gets a object/array and returns object/array/array of objects
// test array ob objects resolution like a.arrOfObjs.b.c
// test multi escaping for special characters

/*
 var testExpression001 = 'no expression';
 // simple resolution
 //var testExpression002a = '${intItem}    ${strItem}    ${boolItem}    empty=[${undefinedVariable!C}]    ${intItem~O}';
 var testExpression002b = '1[${undefinedVariable!C}]    2[${undefinedVariable2:]}    3[${undefinedVariable:111}]    4[${aaa:${bbb!C}:222}]';
 // cartesian product
 var testExpression003 = '${intItem} ${strItem} ${boolItem} ${arr1}';
 // array concatenation, escaping special chars
 var testExpression004 = '${arr1?,}     ${arr1?\\?}     ${arr1?\\:}     ${arr1?\\+}     ${arr1?\\-}     ${arr1?\\!}     ${arr1?\\~}     ${arr1?\\<}     ${arr1?\\?\\:\\+\\-\\!\\~\\<}';
 var testExpression004a = '${arr3}';
 var testExpression004b = '${arr1} ${arr2}';
 // object
 var testExpression005a = '${obj1}';
 // keys and values
 var testExpression005b = 'KEYS=[${obj1~K?,}] VALUES=[${obj1~V?,}]';
 // accessing properties
 var testExpression005c = '${obj1.price}    ${..obj1....beneficial...}    ${obj1.pack~K?,}    ${obj1.pack~V?,}    ${obj1.${undefinedVariable!C}~V?,}    ${obj1.${obj1PropName}}';
 // reverse resolution
 var testExpression005d = '${obj1<true}    ${obj1<${strItem}}    ${obj1<${undefinedVariable!C}:undefined}    ';
 // omit whole expression modifier
 var testExpression006a = '${omitArr1-?,}    ${omitArr1+?,}    ${omitArr1?,}';
 var testExpression006b = '[${omitStr1-}] | ${omitStr1+} | ${omitStr1}';
 // functions
 var testExpression007a = '${reverseArray([1, 2, 3])}';
 var testExpression007b = '${obj1.pack.wrapWithBrackets("1")}';
 var testExpression007c = '${nexlEngineInternalCall()}';

 */


var expressions = [];
module.exports = expressions;


// no expression test
expressions.push({
	expression: 'no expression',
	result: 'no expression'
});

// simple variable resolution
expressions.push({
	expression: '1[${undefinedVariable!C}] 2[${undefinedVariable2:]} 3[${undefinedVariable:111}] 4[${aaa:${bbb!C}:222}]',
	result: '1[] 2[] 3[111] 4[222]'
});

// cartesian product
expressions.push({
	expression: '${intItem} ${strItem} ${boolItem} ${arr1}',
	result: ['71 berry true queen', '71 berry true muscle', '71 berry true 79', '71 berry true false']
});

// undefined variable
expressions.push({
	expression: '${undefinedVariable} ${undefinedVariable!A}'
});

// unitedKey
expressions.push({
	expression: '${unitedKey}',
	result: 'price',
	args: {
		KEY: 'disturbed'
	}
});

expressions.push({
	expression: '${unitedKey}',
	result: '()',
	args: {
		KEY: '()'
	}
});


// object reverse resolution
expressions.push({
	expression: '${obj1<undefinedVariable}}'
});

////////////////////////////////////// ALL_APP_SERVER_INTERFACES //////////////////////////////////////
// ENV = DEV
expressions.push({
	expression: '${ALL_APP_SERVER_INTERFACES}',
	result: ['zombie', 'arrows', 'zebra'],
	args: {
		ENV: 'DEV'
	}
});

// ENV = DEV, INSTANCE = FIRST
expressions.push({
	expression: '${ALL_APP_SERVER_INTERFACES}',
	result: ['zombie', 'arrows', 'zebra'],
	args: {
		ENV: 'DEV',
		INSTANCE: 'FIRST'
	}
});

// ENV = DEV, INSTANCE = THIRD
expressions.push({
	expression: '${ALL_APP_SERVER_INTERFACES}',
	result: ['zombie', 'arrows', 'zebra'],
	args: {
		ENV: 'DEV',
		INSTANCE: 'THIRD'
	}
});

// ENV = QA
expressions.push({
	expression: '${ALL_APP_SERVER_INTERFACES}',
	result: ['autonomous1', 'criminal1', 'adrenaline2', 'prophetic2'],
	args: {
		ENV: 'QA'
	}
});

// ENV = PROD
expressions.push({
	expression: '${ALL_APP_SERVER_INTERFACES}',
	result: ['hothead1', 'awakening1', 'dynamite1', 'military1', 'cuddly2', 'grease2', 'fate2', 'atmosphere2', 'drp-prod'],
	args: {
		ENV: 'PROD'
	}
});

// ENV = PROD, INSTANCE = SECOND
expressions.push({
	expression: '${ALL_APP_SERVER_INTERFACES}',
	result: ['cuddly2', 'grease2', 'fate2', 'atmosphere2', 'drp-prod'],
	args: {
		ENV: 'PROD',
		INSTANCE: 'SECOND'
	}
});

// ENV = PROD, INSTANCE = XXX
expressions.push({
	expression: '${ALL_APP_SERVER_INTERFACES}',
	result: ['drp-prod'],
	args: {
		ENV: 'PROD',
		INSTANCE: 'xxx'
	}
});

// WS.URL1, ENV = LOCAL
expressions.push({
	expression: '${WS.URL1}',
	result: ['http://test-url:9595/LOCAL', 'http://test-url:9696/LOCAL'],
	args: {
		ENV: 'LOCAL'
	}
});

// WS.URL1, ENV = PROD
expressions.push({
	expression: '${WS.URL1}',
	result: ['http://test-url:8080/PROD'],
	args: {
		ENV: 'PROD'
	}
});

// ALL_HOSTS_AND_PORTS1
expressions.push({
	expression: '${ALL_HOSTS_AND_PORTS1?,}',
	result: 'hothead1[9595],hothead1[9696],hothead1[8080],awakening1[9595],awakening1[9696],awakening1[8080],dynamite1[9595],dynamite1[9696],dynamite1[8080],military1[9595],military1[9696],military1[8080],cuddly2[9595],cuddly2[9696],cuddly2[8080],grease2[9595],grease2[9696],grease2[8080],fate2[9595],fate2[9696],fate2[8080],atmosphere2[9595],atmosphere2[9696],atmosphere2[8080],zombie[9595],zombie[9696],zombie[8080],arrows[9595],arrows[9696],arrows[8080],zebra[9595],zebra[9696],zebra[8080],autonomous1[9595],autonomous1[9696],autonomous1[8080],criminal1[9595],criminal1[9696],criminal1[8080],adrenaline2[9595],adrenaline2[9696],adrenaline2[8080],prophetic2[9595],prophetic2[9696],prophetic2[8080],drp-prod[9595],drp-prod[9696],drp-prod[8080],yest[9595],yest[9696],yest[8080],jstaging[9595],jstaging[9696],jstaging[8080]'
});

// ALL_HOSTS_AND_PORTS2 ( PROD )
expressions.push({
	expression: '${ALL_HOSTS_AND_PORTS2?,}',
	result: 'hothead1[8080],awakening1[8080],dynamite1[8080],military1[8080],cuddly2[8080],grease2[8080],fate2[8080],atmosphere2[8080],drp-prod[8080]',
	args: {
		ENV: 'PROD'
	}
});

// ALL_HOSTS_AND_PORTS2 ( YEST )
expressions.push({
	expression: '${ALL_HOSTS_AND_PORTS2?,}',
	result: 'yest[8080]',
	args: {
		ENV: 'YEST'
	}
});

// makeUrls() function
expressions.push({
	expression: '${makeUrls()}',
	// todo: JSON.stringify() is temporary, until the big nexl-engine refactoring
	result: JSON.stringify({
		"PROD": ["http://hothead1", "http://awakening1", "http://dynamite1", "http://military1", "http://cuddly2", "http://grease2", "http://fate2", "http://atmosphere2"],
		"DEV": ["http://zombie", "http://arrows", "http://zebra"],
		"QA": ["http://autonomous1", "http://criminal1", "http://adrenaline2", "http://prophetic2"],
		"DRP-PROD": ["http://drp-prod"],
		"YEST": ["http://yest"],
		"STAGING": ["http://jstaging"]
	})
});

// resolve ENV by IFC
expressions.push({
	expression: '${ENV}',
	result: 'SPECIAL',
	args: {
		IFC: 'iDeer'
	}
});

// DATABASE_DEF, IFC = hothead1
expressions.push({
	expression: '${DATABASE_DEF}',
	result: '-DDB_NAME=PROD',
	args: {
		IFC: 'hothead1'
	}
});

// DATABASE_DEF, IFC = drp-prod
expressions.push({
	expression: '${DATABASE_DEF}',
	result: '-DDB_NAME=DRP-PROD',
	args: {
		IFC: 'drp-prod'
	}
});

// DATABASE_DEF, IFC = iPromised
expressions.push({
	expression: '${DATABASE_DEF}',
	result: '-DDB_NAME=iDB',
	args: {
		IFC: 'iPromised'
	}
});

// discoverInstance(), SECOND
expressions.push({
	expression: '${discoverInstance("${IFC}")}',
	result: 'SECOND',
	args: {
		IFC: 'grease2'
	}
});

// discoverInstance(), yest
expressions.push({
	expression: '${discoverInstance("${IFC}")}',
	args: {
		IFC: 'yest'
	}
});

// discoverInstance(), yest
expressions.push({
	expression: '${discoverInstance("${IFC}")}',
	args: {
		IFC: 'iMaximum'
	}
});
