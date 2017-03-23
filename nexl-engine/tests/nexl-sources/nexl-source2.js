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
	backupDir: '${_this_.home}/backup',
	runsDir: '${_this_.home}/runs',
	start: '${_this_.runsDir}/run.sh',
	x: ['${_this_.runsDir}', '${intItem}', '${_this_.start}', '${obj7.home}'],
	y: {
		home: 'Earth',
		a: '${_this_.home}'
	}
};

obj8 = {
	home: '/sweetHome'
};

obj9 = {
	level: 1,
	home: '/home/nexl',
	parent1: '${_this_._parent_}',
	parent2: '${_parent_._this_}',
	this1: '${._this_.home}',
	this2: '${._this_._this_.home}',
	parent3: {
		level: 2,
		a1: '${_this_._parent_.home}',
		a2: '${_parent_.home}',
		a3: '${_parent_._this_.home}',
		a4: '${_parent_._parent_.home}',
		x: 10,
		inner: {
			level: 3,
			b1: '${_parent_.x}',
			b2: '${@${_parent_.x}}',
			b3: '${_parent_._parent_.home}'
		}
	}
};

obj10 = {
	home: '/home/jboss',
	backupDir: '${_this_.home}/BACKUP',
	inner: {
		x1: '${_parent_.backupDir}',
		x2: '${_parent_.inner._parent_.inner._parent_.inner.x3}',
		x3: 10,
		x4: '${_parent_.inner._parent_.inner._parent_.inner._parent_.backupDir}'
	}
};


obj11 = {
	home: '/home/jboss',
	inner: {
		a: '${_this_._parent_.home}'
	}
};

obj12 = {
	home: '${obj1}',
	inner: {
		a: '${_parent_.home.\\()}'
	}
};

obj13 = {
	a: '${obj14}',
	x: 10
};

obj14 = {
	b: '${_parent_.x}'
};

obj15 = {
	a: 10,
	b: ['${_this_.a}', 11, 'hello']
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

function not() {
	return 'Zhenya++';
}

dirs = {
	level: 1,
	home: '/home/Zhenya',
	logs: '${_this_.home}/logs',
	cgLog: '${_this_._this_._this_.logs}/cg.log',

	debugLogs: {
		level: 2,
		log1: '${_parent_.home}',
		log2: '${_parent_.cgLog}',

		internal: {
			level: 3,
			log1: '${_parent_._parent_.home}',
			log2: '${_parent_._parent_.cgLog}',
			log3: '${_parent_.log1}',
			log4: '${_parent_.log2}',
			log5: '${_this_.log4}'
		},


		internal2: {
			level: 3,
			log5: '${_parent_.log1}',
			log6: '${_parent_.internal.log2}'
		}

	}
};


items = [1, 'a', '_this_', '_parent_', '_this_', '_parent_', '_this_._this_.a', 71, '${intItem}'];

xxx = '${undefinedVar}';

deepThisTest = {
	a: [1, 2, 3],
	b: 2,
	c: '${_this_.a?nexl.functions.system.isContains( ${_this_.b} )}',
	d: '${undefinedVar@${_this_.a}}',
	e: {
		f: '${_this_._parent_.b?isEquals( ${_parent_.d[1]} )}',
		g: '${_this_._parent_.b?isEquals( ${_parent_.d[2]} )}'
	}
};