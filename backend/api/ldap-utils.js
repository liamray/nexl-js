const ldap = require('ldapjs-no-python');
const logger = require('./logger');
const utils = require('./utils');

USER_PRINCIPAL_NAME = 'userPrincipalName';
SAM_ACCOUNT_NAME = 'sAMAccountName';

function authUser(opts) {
	return new Promise(
		(resolve, reject) => {
			function unbind() {
				client.unbind(err => {
					if (err) {
						logger.log.error('Failed to unbind ldap object. Reason : [%s]', utils.formatErr(err));
					}
				});
			}

			function authUser(username) {
				if (username === undefined) {
					reject(`The [${opts.username}] user was found in LDAP but it doesn't have a [${USER_PRINCIPAL_NAME}] field`);
					return;
				}

				client.bind(username, opts.password, err => {
					unbind();

					if (err) {
						reject(err);
						return;
					}

					resolve();
				});
			}

			function findUser() {
				var findBy = SAM_ACCOUNT_NAME;
				if (opts.ldap.findBy !== undefined) {
					findBy = opts.ldap.findBy;
				}

				const searchOptions = {
					scope: "sub",
					filter: `(${findBy}=${opts.username})`,
					attributes: [USER_PRINCIPAL_NAME]
				};

				const result = [];

				client.search(opts.ldap.adSuffix, searchOptions, (err, res) => {
					if (err) {
						unbind();
						reject(err);
						return;
					}

					res.on('searchEntry', entry => {
						result.push(entry.object);
					});

					res.on('searchReference', referral => {
					});

					res.on('error', err => {
						unbind();
						reject(err);
					});

					res.on('end', res => {
						if (result.length < 1) {
							unbind();
							reject('No users found');
							return;
						}
						if (result.length > 1) {
							unbind();
							reject('Found multiple users');
							return;
						}
						authUser(result[0][USER_PRINCIPAL_NAME]);
					});

				});

			}

			// creating ldap client
			const client = ldap.createClient({
				url: opts.ldap.url
			});
			client.on('error', function (err) {
				unbind();
				reject(err);
			});

			if (opts.ldap.userPrincipalName !== undefined) {
				client.bind(opts.ldap.userPrincipalName, opts.ldap.password, err => {
					if (err) {
						unbind();
						reject(err);
						return;
					}

					findUser();
				});
			} else {
				findUser();
			}

		}
	);
}

/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
module.exports = authUser;
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
