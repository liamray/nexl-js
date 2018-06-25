const ldap = require('ldapjs-no-python');
const logger = require('./logger');
const utils = require('./utils');

DN = 'dn';

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

function search(client, opts) {
	return new Promise(
		(resolve, reject) => {
			let filter = utils.isEmptyStr(opts.ldap.findBy) ? `(|(sAMAccountName=${opts.username})(userPrincipalName=${opts.username}))` : `${opts.ldap.findBy}=${opts.username}`;

			const searchOptions = {
				scope: "sub",
				filter: filter,
				attributes: ['dn']
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

			let promise;
			if (!utils.isEmptyStr(opts.ldap.bindDN) && !utils.isEmptyStr(opts.ldap.bindPassword)) {
				// binding to bindDN if AD doesn't allow anonymous connection
				promise = bind(client, opts.ldap.bindDN, opts.ldap.bindPassword);
			} else {
				promise = Promise.resolve();
			}

			promise.then(_ => search(client, opts))
				.then(userDN => bind(client, userDN, opts.password))
				.then(_ => {
					logger.log.debug(`The [${opts.username}] user is successfully authenticated in LDAP`);
					unbind(client);
					resolve();
				})
				.catch(err => {
					logger.log.error(`Failed to authenticated [${opts.username}] user in LDAP. Reason : [%s]`, utils.formatErr(err));
					unbind(client);
					reject();
				});
		}
	);
}

/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
module.exports = authUser;
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////