/**
 * Created by ashu on 30/5/15.
 */

var Q = require("q");
var express = require('express');
var bodyParser = require('body-parser');
var ChildProcess = require('child_process');
var app = express();

app.use(bodyParser.json());

app.use(bodyParser.urlencoded({extended: false}));

app.get('/execute/remote', function (req, res) {
    var type = req.param("type");
    var execCmd = req.param("execCmd");
    var execPath = req.param("execPath");
    switch (type) {
        case "terminal" :
            return runCommandInTerminal(execPath, execCmd).then(function (result) {
                if (!result) {
                    result = "OK";
                }
                res.writeHead(200);
                res.write(JSON.stringify(result));
                res.end();
            }).fail(function (err) {
                res.writeHead(200);
                res.write("Execute Failed !");
                res.end();
            });
            break;
        case "mongo" :
            runMongodInstance(execCmd);
            res.writeHead(200);
            res.write("OK Mongo ");
            res.end();
            break;
        case "node" :
            var serverPath = req.param("serverPath");
            var fileName = req.param("fileName");
            var cla = req.param("cla");
            runNodeServer(serverPath, fileName, cla);
            res.writeHead(200);
            res.write("OK Node ");
            res.end();
            break;
        default:
            console.error("Invalid case");
            res.writeHead(200);
            res.write("Invalid case");
            res.end();
    }
});

app.listen(4000);

function runCommandInTerminal(path, command) {
    var d = Q.defer();
    var args = command;
    var out = {};
    var exec = ChildProcess.exec;
    exec(args, {cwd: path}, function (error, stdout, stderr) {
        out.error = error;
        out.stdout = stdout;
        out.stderr = stderr;
        d.resolve(out);
    });
    return d.promise;
}

function runMongodInstance(command) {
    var cwd = process.cwd();
    var child = ChildProcess.spawn(process.execPath, ["runMongod.js", command], {
        detached: true,
        cwd: cwd,
        stdio: 'ignore'
    });
    child.unref();
}

function runNodeServer(serverPath, fileName, cla) {
    var cwd = process.cwd();
    var child = ChildProcess.spawn(process.execPath, ["runNodeServer.js", serverPath, fileName, cla], {
        detached: true,
        cwd: cwd,
        stdio: 'ignore'
    });
    child.unref();
}

