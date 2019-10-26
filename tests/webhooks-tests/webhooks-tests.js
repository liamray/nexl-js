const crypto = require('crypto');
const express = require('express');
const bodyParser = require('body-parser');

const sigHeaderName = 'X-Hub-Signature';

const app = express();
app.use(bodyParser.json());

function verifyPostData(req, res, next) {
	const payload = JSON.stringify(req.body);
	if (!payload) {
		return next('Request body empty')
	}

	const hmac = crypto.createHmac('sha1', secret);
	const digest = 'sha1=' + hmac.update(payload).digest('hex');
	const checksum = req.get(sigHeaderName);
	if (!checksum || !digest || checksum !== digest) {
		return next(`Request body digest (${digest}) did not match ${sigHeaderName} (${checksum})`)
	}
	return next()
}

app.post('/', verifyPostData, function (req, res) {
	res.status(200).send('Request body was signed')
});

app.use((err, req, res, next) => {
	if (err) {
		console.error(err);
		res.status(403).send('Request body was not signed or verification failed');
	}
});