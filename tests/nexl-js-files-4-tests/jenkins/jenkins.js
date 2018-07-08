DEF_CHOICE = '------';

function isObject(item) {
	return Object.prototype.toString.call(item) === '[object Object]';
}

function keys(obj, level) {
	if (!isObject(obj)) {
		return obj;
	}

	level = parseInt(level);

	if (level === 0) {
		return Object.keys(obj);
	}

	var result = [];
	for (var key in obj) {
		var val = obj[key];
		if (isObject(val)) {
			var x = keys(val, level - 1);
			result = result.concat(x);
		}
	}

	return result;
}

A_1_DEPLOY_DEF = {
	A_IFC: {
		'X': ['server1', 'server2'],
		'Y': ['server3', 'server4']
	}
};

A_1_DEPLOY = '${IFCS_A+${A_1_DEPLOY_DEF}}';


A = {
	ARTIFACTS: {
		Trunk: 'http://jenkins:8080/job/x.war',
		RC: 'http://jenkins:8080/job/y.war',
		Production: 'http://jenkins:8080/job/z.war'
	},

	JNDIS: {
		'A': 'server1',
		'B': ['server2', 'server3'],
		'C': 'serve41',
		'D': 'server5',
		'E': 'server6',
		'F': 'server7',
		'G': ['server8', 'server9', 'server10', 'server11']
	},

	BRANCH_CHOICES: '${DEF_CHOICE#A+${_this_.ARTIFACTS~K}&\n}',
	JNDI_CHOICES: '${DEF_CHOICE#A+${_this_.JNDIS~K}&\n}'
};
