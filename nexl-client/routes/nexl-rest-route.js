/**
 * -------------------------------------------------------------------------------------------------
 * api functions
 * -------------------------------------------------------------------------------------------------
 */
var fs = require('fs');
var path = require('path');
var util = require('util');
var drivelist = require('drivelist');
var nexlEngine = require('nexl-engine');
var request = require('request');

var serverInfo = {};

// retrieves server info
(function () {
    try {
        serverInfo.version = require('../package.json').version;
    } catch (e) {
        console.log("It's not fatal but failed to print a nexl-server version. Please open me a bug. Exception : " + e);
    }
})();

function log(msg) {
    console.log(msg);
}

function isFile(statSync) {
    return statSync == null ? false : statSync.isFile();
}

function isDir(statSync) {
    return statSync == null ? false : statSync.isDirectory();
}

function getStatSync(file) {
    try {
        return fs.statSync(file);
    } catch (e) {
        log(util.format("Something wrong with [%s] file. Reason : [%s]", file, e));
        return null;
    }
}

function listFiles(req, res) {
    var dir = req.body.path;

    // ensure path ends with slash ( must for windows when listing files in c: )
    if (dir.lastIndexOf(path.sep) !== dir.length - 1) {
        dir += path.sep;
    }

    // reading dir content
    fs.readdir(dir, function (err, files) {
        if (err != null) {
            log(util.format("Something wrong with [%s] directory. Reason : [%s]", dir, err));
            res.status(500).send('Error reading [' + dir + '] directory. Reason : ' + err);
            return;
        }

        var filesArr = [];
        var dirsArr = [];

        for (var index in files) {
            var file = files[index];
            file = path.join(dir, file);

            var statSync = getStatSync(file);

            var isItFile = isFile(statSync);
            var isItDir = isDir(statSync);

            // not file and not directory ? good bye !
            if (!isItFile && !isItDir) {
                continue;
            }

            var details = {};
            details.name = file;
            details.isFile = isItFile;

            if (isItFile) {
                filesArr.push(details);
            } else {
                dirsArr.push(details);
            }
        }

        var result = {};

        result.files = dirsArr.sort().concat(filesArr.sort());

        res.send(result);
    });
}

function listMounts(req, res) {
    drivelist.list(function (error, disks) {
        if (error) {
            res.status(500).send('Got error while enumerating drives : ' + error);
            return;
        }

        var result = {
            mounts: []
        };
        for (var index in disks) {
            var mount = disks[index].mountpoint;
            result.mounts.push(mount);
        }

        result.mounts = result.mounts.sort();

        res.send(result);
    });

}

function readFile(req, res) {
    var fileName = req.body.fileName;

    fs.readFile(fileName, 'utf8', function (err, data) {
        if (err) {
            res.status(500).send('Got error while reading a file : ' + err.toString());
            return;
        }

        res.send({
            fileContent: data
        });
    });
}

function saveFile(req, res) {
    var fileName = req.body.fileName;
    var fileContent = req.body.fileContent;

    fs.writeFile(fileName, fileContent, 'utf8', function (err) {
        if (err) {
            res.status(500).send('Got error while writing a file : ' + err);
            return;
        }

        res.send({
            result: "ok"
        });
    });
}

function isExists(req, res) {
    var fileName = req.body.fileName;
    fs.exists(fileName, function (result) {
        res.send({
            isFileExists: result
        });
    });
}

function joinPath(req, res) {
    var elements = req.body.pathElements.split('\r\n');
    var result = path.join.apply(this, elements);
    res.send({path: result});
}

function makeNexlSource(nexlSourceFileName, nexlSourceFileContent) {
    if (nexlSourceFileContent === undefined) {
        return {
            asFile: {
                fileName: nexlSourceFileName
            }
        };
    }

    // nexlSource.asText.text, nexlSource.asText.path4imports
    var result = {};
    result.asText = {};
    result.asText.text = nexlSourceFileContent;
    if (nexlSourceFileName && nexlSourceFileName.length > 0) {
        result.asText.path4imports = path.dirname(nexlSourceFileName);
    }

    return result;
}

function evalNexl(req, res) {
    var nexlSourceFileName = req.body.nexlSourceFileName;
    var nexlSourceFileContent = req.body.nexlSourceFileContent;
    var nexlExpression = req.body.nexlExpression;
    var nexlArgs = req.body.nexlArgs;

    nexlArgs = JSON.parse(nexlArgs);

    var nexlSource = makeNexlSource(nexlSourceFileName, nexlSourceFileContent);

    try {
        var result = nexlEngine.evalNexlExpression(nexlSource, nexlExpression, nexlArgs);
        res.send(result);
    } catch (e) {
        res.status(500).send('Failed to evaluate nexl expression. Reason : ' + e);
    }
}


function resolveJsVariables(req, res) {
    var nexlSourceFileName = req.body.nexlSourceFileName;
    var nexlSourceFileContent = req.body.nexlSourceFileContent;

    var nexlSource = makeNexlSource(nexlSourceFileName, nexlSourceFileContent);

    try {
        var result = nexlEngine.resolveJsVariables(nexlSource);
        res.send(result);
    } catch (e) {
        res.status(500).send('Failed to resolve js variables. Reason : ' + e);
    }
}

function resolveServerInfo(req, res) {
    res.send(serverInfo);
}


/**
 * -------------------------------------------------------------------------------------------------
 * routing
 * -------------------------------------------------------------------------------------------------
 */

var express = require('express');
var router = express.Router();

router.post('/list-files', function (req, res, next) {
    listFiles(req, res);
});

router.post('/list-mounts', function (req, res, next) {
    listMounts(req, res);
});

router.post('/read-file', function (req, res, next) {
    readFile(req, res);
});

router.post('/save-file', function (req, res, next) {
    saveFile(req, res);
});

router.post('/is-exists', function (req, res, next) {
    isExists(req, res);
});

router.post('/join-path', function (req, res, next) {
    joinPath(req, res);
});

router.post('/eval-nexl', function (req, res, next) {
    evalNexl(req, res);
});

router.post('/resolve-js-variables', function (req, res, next) {
    resolveJsVariables(req, res);
});

router.post('/get-server-info', function (req, res, next) {
    resolveServerInfo(req, res);
});

module.exports = router;
