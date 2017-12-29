module.exports = function (req, res, next) {
	res.setHeader('Access-Control-Allow-Origin', '*');
	next();
};
