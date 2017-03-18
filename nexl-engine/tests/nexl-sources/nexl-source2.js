/********************************************************************************************
 * data
 ********************************************************************************************/

intItem = 71;

strItem = 'berry';

var boolItem = true;

var arr1 = ['queen', 'muscle', 79, false];
var arr2 = ['air', 16, 99, true, 'smooth'];
var arr3 = ['${arr1}', '${arr2}'];
var arr4 = ['${arr3}', true, false, 'true', 79, 'queen'];
var arr5 = ['hello'];
var arr6 = [];
var arr7 = ['hello', undefined, null, undefined, 21, true, 'test'];
var arr8 = ['${intItem}', 10, 'a', true];
var arr9 = ['${obj1}', 10, 'a', true];

obj1PropName = '()';

obj1 = {
	beneficial: 'mint',
	'test': 'righteous',
	'()': 'trick',
	disturbed: 46,
	price: true,
	pack: {
		strong: 'balance',
		deer: 7
	},
	'${intItem}': '${strItem}'
};

var obj1a = {
	x: '${obj1.pack}'
};

var objArray1 = ['${obj1}', '${obj1a}'];

obj1Keys = ['balance', 7, 'mint', 'berry'];

UNITED_KEY_DEF = {
	'price': ['price', 'disturbed', 'beneficial']
};

unitedKey = '${UNITED_KEY_DEF<${KEY}[0]@${KEY}}';

var evaluateAsUndefined1 = ['disconnect', 24, '${undefinedVariable}', null, false];
evaluateAsUndefined2 = '${intItem} ${strItem} ${boolItem} ${undefinedVar}';

function reverseArray(arr) {
	return arr.reverse();
}

var obj2 = {};
obj2.pack = {};
obj2.pack.wrapWithBrackets = function (str) {
	return '{' + str + '}';
};

function nexlEngineInternalCall() {
	return nexl.nexlize('${arr1&,}');
}

function multiParamsTest(a, b, c) {
	return a.beneficial + ' ' + b[3] + ' ' + c;
}

function returnsObjectArrayFunction(param) {
	if (param === 'object') {
		return {hello: 'world'};
	}

	if (param === 'array') {
		return ['hello', 2017, 'world', true];
	}

	if (param === 'function') {
		return function () {
			return 'Okay;)';
		}
	}

	return 'Bad param !'
}

function returnsArrayOfObjects() {
	return [{hello: 1}, {hello: 2}, {hello: 3}, {hello: 4}]
}

obj3 = {
	item1: 'test',
	item2: '${undefinedVar}',
	item3: 34
};

longStr = 'The distance to the work is 155 km';
index = 32;
strForTrim = ' ' + longStr + '     ';


nexl.defaultExpression = '${test1}';
nexl.defaultArgs = {test1: 25};

keys = ['YEST'];

obj4 = {
	'${obj1}': 1
};

obj5 = {
	beneficial: 'mint',
	pack: {
		strong: 'balance',
		deer: 7
	},
	obj3: '${obj3}',
	'${strItem}': '${intItem}',
	'test': '${undefinedVariable}'
};

obj6 = {
	pack: 'good',
	item1: 79,
	item2: '${intItem}'
};


intItem2 = 'test';
nexl.defaultArgs.intItem2 = 46;
nexl.defaultArgs.intItem3 = 57;


fruits = ['Mango', 'Lemon', 'Banana', 'Apple', null, undefined, null, undefined];
sourFruits = ['Lemon', 'Apple'];

obj7 = {
	home: '/home/nexl',
	backupDir: '${__this__.home}/backup',
	runsDir: '${__this__.home}/runs',
	start: '${__this__.runsDir}/run.sh',
	x: ['${__this__.runsDir}', '${intItem}', '${__this__.start}', '${obj7.home}'],
	y: {
		home: 'Earth',
		a: '${__this__.home}'
	}
};

obj8 = {
	home: '/sweetHome'
};

obj9 = {
	level: 1,
	home: '/home/nexl',
	parent1: '${__this__.__parent__}',
	parent2: '${__parent__.__this__}',
	this1: '${.__this__.home}',
	this2: '${.__this__.__this__.home}',
	parent3: {
		level: 2,
		a1: '${__this__.__parent__.home}',
		a2: '${__parent__.home}',
		a3: '${__parent__.__this__.home}',
		a4: '${__parent__.__parent__.home}',
		x: 10,
		inner: {
			level: 3,
			b1: '${__parent__.x}',
			b2: '${@${__parent__.x}}',
			b3: '${__parent__.__parent__.home}'
		}
	}
};

obj10 = {
	home: '/home/jboss',
	backupDir: '${__this__.home}/BACKUP',
	inner: {
		x1: '${__parent__.backupDir}',
		x2: '${__parent__.inner.__parent__.inner.__parent__.inner.x3}',
		x3: 10,
		x4: '${__parent__.inner.__parent__.inner.__parent__.inner.__parent__.backupDir}'
	}
};


obj11 = {
	home: '/home/jboss',
	inner: {
		a: '${__this__.__parent__.home}'
	}
};

obj12 = {
	home: '${obj1}',
	inner: {
		a: '${__parent__.home.\\()}'
	}
};

obj13 = {
	a: '${obj14}',
	x: 10
};

obj14 = {
	b: '${__parent__.x}'
};

obj15 = {
	a: 10,
	b: ['${__this__.a}', 11, 'hello']
};


expr1 = '${expr2}';
expr2 = '${expr3}';
expr3 = ['${obj1}', '\\${obj1}', '${arr1}', '${intItem}', 1, '2', true];


nexl.functions.user.isContains = function () {
	return 'Zhenya+';
};

nexl.functions.user.testFunc1 = function () {
	return 'user.testFunc1';
};

nexl.functions.user.testFunc2 = function () {
	return 'user.testFunc2';
};

function testFunc1() {
	return 'testFunc1';
}

function testFunc3() {
	return 'testFunc3';
}

function test() {
	return 'Zhenya++';
}

dirs = {
	level: 1,
	home: '/home/Zhenya',
	logs: '${__this__.home}/logs',
	cgLog: '${__this__.__this__.__this__.logs}/cg.log',

	debugLogs: {
		level: 2,
		log1: '${__parent__.home}',
		log2: '${__parent__.cgLog}',

		internal: {
			level: 3,
			log1: '${__parent__.__parent__.home}',
			log2: '${__parent__.__parent__.cgLog}',
			log3: '${__parent__.log1}',
			log4: '${__parent__.log2}',
			log5: '${__this__.log4}'
		},


		internal2: {
			level: 3,
			log5: '${__parent__.log1}',
			log6: '${__parent__.internal.log2}'
		}

	}
};
