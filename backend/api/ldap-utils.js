const ldap = require('ldapjs-no-python');
const logger = require('./logger');
const utils = require('./utils');

DN = 'dn';
SAM_ACCOUNT_NAME = 'sAMAccountName';

function unbind(client) {
	client.unbind(err => {
		if (err) {
			logger.log.error('Failed to unbind LDAP binding. Reason : [%s]', utils.formatErr(err));
		}
	});
}

function bind(client, bindDN, bindPassword) {
	return new Promise(
		(resolve, reject) => {
			client.bind(bindDN, bindPassword, err => {
				if (err) {
					reject(err);
					return;
				}

				resolve();
			});
		}
	);
}

// binds directly by opts.username and opts.password ( not by ldap's username and password )
function bindDirectly(client, opts, resolve, reject) {
	return bind(client, opts.username, opts.password)
		.then(_ => {
			unbind(client);
			resolve();
		})
		.catch(_ => {
			unbind(client);
			reject();
		});
}

function search(client, opts) {
	return new Promise(
		(resolve, reject) => {
			let filter = utils.isEmptyStr(opts.ldap.findBy) ? `${SAM_ACCOUNT_NAME}=${opts.username}` : `${opts.ldap.findBy}=${opts.username}`;

			const searchOptions = {
				scope: "sub",
				filter: filter,
				attributes: ['userPrincipalName']
			};

			const result = [];

			client.search(opts.ldap.baseDN, searchOptions, (err, res) => {
				if (err) {
					reject(err);
					return;
				}

				res.on('searchEntry', entry => {
					result.push(entry.object);
				});

				res.on('searchReference', referral => {
				});

				res.on('error', err => {
					reject(err);
				});

				res.on('end', res => {
					if (result.length < 1) {
						reject('No users found');
						return;
					}

					if (result.length > 1) {
						reject('Found multiple users');
						return;
					}

					const dn = result[0][DN];
					if (dn === undefined) {
						reject(`The [${opts.username}] user was found but it doesn't have a [${DN}] attribute`);
					} else {
						resolve(dn);
					}
				});
			});
		}
	);
}

function authUser(opts) {
	return new Promise(
		(resolve, reject) => {
			// creating ldap client
			const client = ldap.createClient({
				url: opts.ldap.url
			});

			// error handler
			client.on('error', function (err) {
				unbind(client);
				reject(err);
			});

			// bindDN not provided ? trying to bind ( authenticate ) directly by opts.username and opts.password
			if (utils.isEmptyStr(opts.ldap.bindDN)) {
				// binding to username & password
				bindDirectly(client, opts, resolve, reject);
				return;
			}

			// binding to bindDN
			bind(client, opts.ldap.bindDN, opts.ldap.bindPassword)
				.then(_ => search(client, opts))
				.then(userDN => bind(client, userDN, opts.password))
				.then(_ => {
					unbind(client);
					resolve();
				})
				// previous stuff didn't work, trying to bind directly
				.catch(_ => bindDirectly(client, opts, resolve, reject));
		}
	);
}

/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
module.exports = authUser;
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////