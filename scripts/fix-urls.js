const fs = require('fs');
var fileName = process.argv[2];
var indexHtml = fs.readFileSync(fileName) + '';
indexHtml = indexHtml.replace(/src="/g, 'src="/nexl/site/').replace(/<link href="/g, '<link href="/nexl/site/');
fs.writeFileSync(fileName, indexHtml);