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

app.all('/execute/remote', function (req, res) {
    var type = req.param("type");
    var params = req.param("parameters");
    if (typeof params === "string") {
        params = JSON.parse(params);
    }
    switch (type) {
        case "terminal" :
            var execPath = params[0];
            var execCmd = params[1];
            return runCommandInTerminal(execPath, execCmd).then(function (result) {
                console.log("res in terminal : " + JSON.stringify(result));
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
            var serverPath = params[0];
            var fileName = params[1];
            var cla = params[2];
            console.log("serverPath :" + serverPath);
            console.log("fileName :" + fileName);
            console.log("cla :" + cla);
            try {
                runNodeServer(serverPath, fileName, cla);
            } catch (e) {
                console.error(e);
            }

            res.writeHead(200);
            res.write("OK Node ");
            res.end();
            break;
        case "script" :
            var args = params[0];
            var scriptPath = params[1];
            return runCommandInScript(args, scriptPath).then(function (result) {
                console.log("res in script : " + JSON.stringify(result));
                if (!result) {
                    result = "OK";
                }
                res.writeHead(200);
                res.write(JSON.stringify(result));
                res.end();
            }).fail(function (err) {
                console.error("script error : "+err);
                res.writeHead(200);
                res.write("Execute Failed !");
                res.end();
            });
            break;
        default:
            console.error("Invalid case");
            res.writeHead(200);
            res.write("Invalid case");
            res.end();
    }
});

app.all('/', function (req, res) {
    res.writeHead(200);
    res.write("Server running on port 4000.");
    res.end();
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
    console.log("runNodeServer ... done");
}

function runCommandInScript(args, scriptPath) {
    console.log("args : " + args);
    console.log("scriptPath : " + scriptPath);
    var d = Q.defer();
    var out = {};
    var cwd = process.cwd();
    var execFile = ChildProcess.execFile;
    execFile(scriptPath, args, {cwd: cwd}, function (error, stdout, stderr) {
        out.error = error;
        out.stdout = stdout;
        out.stderr = stderr;
        d.resolve(out);
    });
    return d.promise;
}

