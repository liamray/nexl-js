LDAP_CONFIG = {
	refreshRate: 10,

	url: 'ldap://localhost:389',
	baseDN: 'DC=test',
	username: 'xxx',
	attributes: {
		user: ["sAMAccountName"]
	}
};

BALANCER_CONFIG = {
	interface: '0.0.0.0',
	port: 80
};
