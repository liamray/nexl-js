const crypto = require('crypto');
const express = require('express');
const bodyParser = require('body-parser');

const SECRET_HEADER = 'X-Hub-Signature';
const PORT = 8181;
const SECRET = 'nexl';

const app = express();
app.use(bodyParser.json());

function handleWebhook(req, res, next) {
    const payload = JSON.stringify(req.body);
    if (!payload) {
        return next('Request body empty')
    }

    const checksum = req.get(SECRET_HEADER);
    if (!checksum) {
        return next();
    }

    const hmac = crypto.createHmac('sha1', SECRET);
    const digest = 'sha1=' + hmac.update(payload).digest('hex');
    if (!checksum || !digest || checksum !== digest) {
        return next(`Request body digest (${digest}) did not match ${SECRET_HEADER} (${checksum})`)
    }

    return next();
}

app.post('/', handleWebhook, function (req, res) {
    res.status(200).send('Request body was signed')
});

app.use((err, req, res, next) => {
    if (err) {
        console.error(err);
        res.status(403).send('Request body was not signed or verification failed');
    }
});


app.listen(PORT, () => console.log(`Example app listening on port ${PORT}!`));