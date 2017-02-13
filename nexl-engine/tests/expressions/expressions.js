// object reverse resolution for empty result, for single result, for multi result
// array indexes for empty result, for single result, for multi result, when index out of bounds
// text external args, include null values

var expressions = [];
module.exports = expressions;

// key is nexl expression
expressions.push({
	expression: '${obj1.71}',
	result: 'berry'
});

// function call
expressions.push({
	expression: 'hello ${escapeDrpProd(${@DRP\\-PROD})}',
	result: 'hello DRP\\-PROD'
});


// empty input
expressions.push({
	expression: '',
	result: ''
});

// no expression test
expressions.push({
	expression: 'no expression',
	result: 'no expression'
});

// undefined
expressions.push({
	expression: '${}',
	result: undefined
});

// undefined variable
expressions.push({
	expression: '${undefinedVariable} ${undefinedVariable}',
	throwsException: true
});

// simple variable resolution
expressions.push({
	expression: '1[${undefinedVariable@}] 2[${undefinedVariable2@}] 3[${undefinedVariable@111}] 4[${aaa:${bbb@}@222}]',
	result: '1[] 2[] 3[111] 4[222]'
});

// subst bug fix : ${intItem} hello ${x:${intItem}}
expressions.push({
	expression: '${intItem} hello ${x@${intItem}}',
	result: '71 hello 71'
});

// external arg test
expressions.push({
	expression: '${intItem}',
	result: 1,
	args: {
		intItem: 1
	}
});

// cartesian product
expressions.push({
	expression: '${intItem} ${strItem} ${boolItem} ${arr1}',
	result: ['71 berry true queen', '71 berry true muscle', '71 berry true 79', '71 berry true false']
});

// array concatenation with object
expressions.push({
	expression: '${arr1&${obj1}}',
	throwsException: true
});

// array concatenation with array
expressions.push({
	expression: '${arr1&${arr1}}',
	throwsException: true
});

// array concatenation with undefined variable
expressions.push({
	expression: '${arr1&${undefinedVar}}',
	throwsException: true
});

// array concatenation with null
expressions.push({
	expression: '${arr1&${@:null}}',
	throwsException: true
});

// array concatenation, escaping special chars
expressions.push({
	expression: '${arr1&,} ${arr1&,${intItem}} ${arr1&\\&} ${arr1&\\@\\~\\<\\#\\-\\&\\^\\!\\*\\?\\%\\>\\+:}',
	result: 'queen,muscle,79,false queen,71muscle,7179,71false queen&muscle&79&false queen@~<#-&^!*?%>+:muscle@~<#-&^!*?%>+:79@~<#-&^!*?%>+:false'
});

// arrays
expressions.push({
	expression: '${arr3}',
	result: ['queen', 'muscle', 79, false, 'air', 16, 99, true, 'smooth']
});

// arrays
expressions.push({
	expression: '${arr1} ${arr2}',
	result: ['queen air', 'muscle air', '79 air', 'false air', 'queen 16', 'muscle 16', '79 16', 'false 16', 'queen 99', 'muscle 99', '79 99', 'false 99', 'queen true', 'muscle true', '79 true', 'false true', 'queen smooth', 'muscle smooth', '79 smooth', 'false smooth']
});


// objects
expressions.push({
	expression: '${obj1}',
	result: {
		beneficial: 'mint',
		'religion': 'righteous',
		'()': 'trick',
		disturbed: 46,
		price: true,
		pack: {
			strong: 'balance',
			deer: 7
		},
		71: 'berry'
	}
});

// nested objects
expressions.push({
	expression: '${obj1a.x.deer}',
	result: 7
});

// array of objects
expressions.push({
	expression: '${objArray1}',
	result: [{
		beneficial: 'mint',
		'religion': 'righteous',
		'()': 'trick',
		disturbed: 46,
		price: true,
		pack: {
			strong: 'balance',
			deer: 7
		},
		71: 'berry'
	}, {
		x: {
			strong: 'balance',
			deer: 7
		}
	}]
});


// ~O modifier
expressions.push({
	expression: '${intItem~O}',
	result: {intItem: 71}
});

// ~O modifier
expressions.push({
	expression: '${obj1.pack~O}',
	result: {strong: 'balance', deer: 7}
});

// keys and values
expressions.push({
	expression: 'KEYS=[${obj1~K&,}] VALUES=[${obj1~V&,}]',
	result: 'KEYS=[71,beneficial,religion,(),disturbed,price,pack] VALUES=[berry,mint,righteous,trick,46,true,balance,7]'
});

// reverse resolution
expressions.push({
	expression: '${obj1<${boolItem}} ${obj1<${strItem}} ${obj1<${undefinedVariable@}@undefined}',
	result: 'price 71 undefined'
});

// reverse resolution - type check
expressions.push({
	expression: '${obj1<true:bool}',
	result: 'price'
});

// reverse resolution - type check
expressions.push({
	expression: '${obj1<46:num}',
	result: 'disturbed'
});

// reverse resolution - array as input and output
expressions.push({
	expression: '${obj1<${obj1Keys}}',
	result: ['71', 'beneficial', 'pack']
});

// reverse resolution - should resolve the highest key
expressions.push({
	expression: '${HOSTS.APP_SERVER_INTERFACES<cuddly2}',
	result: 'PROD'
});

// reverse resolution - debug_opts
expressions.push({
	expression: '${DEBUG_OPTS}',
	result: '-agentlib:jdwp=transport=dt_socket,server=y,suspend=n,address=8790',
	args: {
		IS_DEBUG_ON: 'on'
	}
});

// evaluate as undefined modifier -> string
expressions.push({
	expression: '${evaluateAsUndefined2!}',
	result: undefined
});

// evaluate as undefined modifier -> array
expressions.push({
	expression: '${evaluateAsUndefined1!&,} ${evaluateAsUndefined1&,}',
	result: 'disconnect,24,,false disconnect,24,,,false'
});

// evaluate as undefined modifier -> object
expressions.push({
	expression: '${obj3!}',
	result: {
		item1: 'test',
		item3: 34
	}
});

// funcs
expressions.push({
	expression: '${reverseArray(${arr1})}',
	result: [false, 79, 'muscle', 'queen']
});

// funcs
expressions.push({
	expression: '${obj2.pack.wrapWithBrackets(${@1:num})}',
	result: '{1}'
});

// funcs
expressions.push({
	expression: '${nexlEngineInternalCall()}',
	result: 'queen,muscle,79,false'
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
	expression: '${obj1<undefinedVariable}',
	result: undefined
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
	result: ['hothead1', 'awakening1', 'dynamite1', 'military1', 'cuddly2', 'grease2', 'fate2', 'atmosphere2', 'drp-prod'],
	args: {
		ENV: 'PROD',
		INSTANCE: 'xxx'
	}
});

// ENV = PROD, INSTANCE = XXX
expressions.push({
	expression: '${ALL_APP_SERVER_INTERFACES}',
	result: ['hothead1', 'awakening1', 'dynamite1', 'military1', 'cuddly2', 'grease2', 'fate2', 'atmosphere2', 'drp-prod'],
	args: {
		ENV: 'PROD',
		INSTANCE: 'xxx'
	}
});

// ENV = PROD, INSTANCE = XXX
expressions.push({
	expression: '${ALL_APP_SERVER_INTERFACES}',
	result: 'omg',
	args: {
		ENV: 'QA',
		INSTANCE: 'FIRST',
		HOSTS: {
			APP_SERVER_INTERFACES: {
				PROD: 'omg',
				QA: 'omg'
			}
		}
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
	result: 'http://test-url:8080/PROD',
	args: {
		ENV: 'PROD'
	}
});

// ALL_HOSTS_AND_PORTS1
expressions.push({
	expression: '${ALL_HOSTS_AND_PORTS1&,}',
	result: 'hothead1[9595],awakening1[9595],dynamite1[9595],military1[9595],cuddly2[9595],grease2[9595],fate2[9595],atmosphere2[9595],zombie[9595],arrows[9595],zebra[9595],autonomous1[9595],criminal1[9595],adrenaline2[9595],prophetic2[9595],drp-prod[9595],yest[9595],jstaging[9595],hothead1[9696],awakening1[9696],dynamite1[9696],military1[9696],cuddly2[9696],grease2[9696],fate2[9696],atmosphere2[9696],zombie[9696],arrows[9696],zebra[9696],autonomous1[9696],criminal1[9696],adrenaline2[9696],prophetic2[9696],drp-prod[9696],yest[9696],jstaging[9696],hothead1[8080],awakening1[8080],dynamite1[8080],military1[8080],cuddly2[8080],grease2[8080],fate2[8080],atmosphere2[8080],zombie[8080],arrows[8080],zebra[8080],autonomous1[8080],criminal1[8080],adrenaline2[8080],prophetic2[8080],drp-prod[8080],yest[8080],jstaging[8080]'
});

// ALL_HOSTS_AND_PORTS2 ( PROD )
expressions.push({
	expression: '${ALL_HOSTS_AND_PORTS2&,}',
	result: 'hothead1[8080],awakening1[8080],dynamite1[8080],military1[8080],cuddly2[8080],grease2[8080],fate2[8080],atmosphere2[8080],drp-prod[8080]',
	args: {
		ENV: 'PROD'
	}
});

// ALL_HOSTS_AND_PORTS2 ( YEST )
expressions.push({
	expression: '${ALL_HOSTS_AND_PORTS2&,}',
	result: 'yest[8080]',
	args: {
		ENV: 'YEST'
	}
});

// makeUrls() function
expressions.push({
	expression: '${makeUrls()}',
	result: {
		"PROD": ["http://hothead1", "http://awakening1", "http://dynamite1", "http://military1", "http://cuddly2", "http://grease2", "http://fate2", "http://atmosphere2"],
		"DEV": ["http://zombie", "http://arrows", "http://zebra"],
		"QA": ["http://autonomous1", "http://criminal1", "http://adrenaline2", "http://prophetic2"],
		"DRP-PROD": "http://drp-prod",
		"YEST": "http://yest",
		"STAGING": "http://jstaging"
	}
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
	expression: '${discoverInstance(${IFC})}',
	result: 'SECOND',
	args: {
		IFC: 'grease2'
	}
});

// discoverInstance(), yest
expressions.push({
	expression: '${discoverInstance(${IFC})}',
	result: null,
	args: {
		IFC: 'yest'
	}
});

// discoverInstance(), yest
expressions.push({
	expression: '${discoverInstance(${IFC})}',
	result: null,
	args: {
		IFC: 'iMaximum'
	}
});

///////////////// Additional tests //////////////////
// escaping test
expressions.push({
	expression: '${undefinedVar@\\${\\}\\\\\\}}',
	result: '${}\\}'
});

// Math.round() test
expressions.push({
	expression: '${Math.round(${@1.1:num})}',
	result: 1
});

// parseInt() test
expressions.push({
	expression: '${parseInt(${@123:num})}',
	result: 123
});

// parseFloat() test
expressions.push({
	expression: '${parseFloat(${@123.456:num})}',
	result: 123.456
});

// function with multi params
expressions.push({
	expression: '${multiParamsTest(${obj1}, ${arr1}, ${@something} )}',
	result: 'mint false something'
});

// function returns different results -> object
expressions.push({
	expression: '${returnsObjectArrayFunction(${@object})}',
	result: {hello: 'world'}
});

// function returns different results -> array
expressions.push({
	expression: '${returnsObjectArrayFunction(${@array})}',
	result: ['hello', 2017, 'world', true]
});

// function returns different results -> function
expressions.push({
	expression: '${returnsObjectArrayFunction(${@function})()}',
	result: 'Okay;)'
});

// reserved modifiers
expressions.push({
	expression: '${*?%>+}',
	throwsException: true
});

// # array operations modifier
expressions.push({
	expression: '${arr1#S}',
	result: [79, false, "muscle", "queen"]
});

// # array operations modifier
expressions.push({
	expression: '${arr1#s}',
	result: ["queen", "muscle", false, 79]
});

// # array operations modifier
expressions.push({
	expression: '${arr4#U#S}',
	result: [16, 79, 99, "air", false, "muscle", "queen", "smooth", true, "true"]
});

// # array operations modifier
expressions.push({
	expression: '${arr4#U#S#CNT}',
	result: 10,
	throwsException: true
});

// # array operations modifier
expressions.push({
	expression: '${arr4#U#S#C}',
	result: 10
});

// # eliminate array elements
expressions.push({
	expression: '${arr1-false}', // not eliminating, because false is string
	result: ['queen', 'muscle', 79, false]
});

// # eliminate multiple
expressions.push({
	expression: '${arr1-false:bool-79-79:num-queen}',
	result: ['muscle']
});

// # eliminate array elements ( eliminate itself )
expressions.push({
	expression: '${arr1-${arr1}}',
	result: undefined
});

// # substring
expressions.push({
	expression: '${longStr[0..30,${index}..999]& }',
	result: 'The distance to the work is 15 km'
});

// # substring
expressions.push({
	expression: '${longStr[0..30,${strItem}..999]& }',
	throwsException: true
});

// # string operations - ^U
expressions.push({
	expression: '${longStr^U}',
	result: 'THE DISTANCE TO THE WORK IS 155 KM'
});

// # string operations - ^L
expressions.push({
	expression: '${longStr^L}',
	result: 'the distance to the work is 155 km'
});

// # string operations - ^T
expressions.push({
	expression: '${strForTrim^T^L}',
	result: 'the distance to the work is 155 km'
});

// # string operations - ^LEN
expressions.push({
	expression: '${strForTrim^T^L^LEN}',
	result: 34
});

// default expression and default args
expressions.push({
	result: 25
});

// default expression and default args
expressions.push({
	args: {
		test1: 'omg'
	},
	result: 'omg'
});


// types check
expressions.push({
	expression: '${@1:num}',
	result: 1
});

// types check
expressions.push({
	expression: '${@1:str}',
	result: '1'
});

// types check
expressions.push({
	expression: '${@1:bool}',
	result: undefined
});

// types check
expressions.push({
	expression: '${@true:bool}',
	result: true
});

// types check
expressions.push({
	expression: '${@${intItem}:bool}',
	result: true
});

// types check
expressions.push({
	expression: '${@1:null}',
	result: null
});

// types check
expressions.push({
	expression: '${@${strItem}:undefined}',
	result: undefined
});

// long object resolution
expressions.push({
	expression: '${a.b.${undefinedVariable}.d}',
	result: undefined
});

// long object resolution
expressions.push({
	expression: '${${xxx} .b.c.d}',
	throwsException: true
});

// long object resolution
expressions.push({
	expression: '${obj1.pack.strong.balance}',
	result: undefined
});

// long object resolution
expressions.push({
	expression: '${obj1.${undefinedVar}.pack.strong.${balance}}',
	result: 'balance'
});

// resolution from primitive
expressions.push({
	expression: '${intItem.a.b.c}',
	result: undefined
});

// when key is undefined
expressions.push({
	expression: '${obj1.${undefinedVariable}~V&,} ${obj1.${undefinedVariable}.pack~V&,} ${obj1.${undefinedVariable}.pack~V&,}',
	result: 'berry,mint,righteous,trick,46,true,balance,7 balance,7 balance,7'
});

// when key is undefined#2
expressions.push({
	expression: '${obj1.${undefinedVariable@:null}.pack~V&,}',
	result: undefined
});
