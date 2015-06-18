/**
 * Created by ashu on 30/5/15.
 */

var Q = require("q");
var express = require('express');
var bodyParser = require('body-parser');
var ChildProcess = require('child_process');
var app = express();

var callStatusMap = {};

app.use(bodyParser.json());

app.use(bodyParser.urlencoded({extended: false}));

app.all('/execute/remote', function (req, res) {
    var reqId = undefined;
    var execCmd = undefined;
    var type = req.param("type");
    var params = req.param("parameters");
    if (typeof params === "string") {
        params = JSON.parse(params);
    }
    switch (type) {
        case "terminal" :
            reqId = getRandomId();
            callStatusMap[reqId] = {status: "pending"};
            var execPath = params[0];
            execCmd = params[1];
            res.writeHead(200);
            res.write(JSON.stringify({reqId: reqId}));
            res.end();
            runCommandInTerminal(execPath, execCmd, reqId);
            break;
        case "mongo" :
            execCmd = params[0];
            res.writeHead(200);
            res.write(JSON.stringify({result: "OK Mongo"}));
            res.end();
            runMongodInstance(execCmd);
            break;
        case "node" :
            var serverPath = params[0];
            var fileName = params[1];
            var cla = params[2];
            res.writeHead(200);
            res.write(JSON.stringify({result: "OK Node"}));
            res.end();
            runNodeServer(serverPath, fileName, cla);
            break;
        case "script" :
            reqId = getRandomId();
            callStatusMap[reqId] = {status: "pending"};
            var args = params[0];
            var scriptPath = params[1];
            res.writeHead(200);
            res.write(JSON.stringify({reqId: reqId}));
            res.end();
            runCommandInScript(args, scriptPath, reqId);
            break;
        default:
            console.error("Invalid case");
            res.writeHead(200);
            res.write("Invalid case");
            res.end();
    }
});

app.all('/execute/callStatus', function (req, res) {
    var reqId = req.param("reqId");
    var reqResp = callStatusMap[reqId];
    console.log("callStatus : id : " + reqId);
    console.log("reqResp  : " + JSON.stringify(reqResp));
    res.writeHead(200);
    res.write(JSON.stringify(reqResp));
    res.end();
    // TODO clear result from callHistory
    if (reqResp.result) {
        delete callStatusMap.reqId;
    }
});

app.all('/', function (req, res) {
    res.writeHead(200);
    res.write("Server running on port 4000.");
    res.end();
});

app.listen(4000);

function runCommandInTerminal(path, command, reqId) {
    var args = command;
    var out = {};
    var exec = ChildProcess.exec;
    exec(args, {cwd: path}, function (error, stdout, stderr) {
        out.error = error;
        out.stdout = stdout;
        out.stderr = stderr;
        callStatusMap[reqId].result = out;
        callStatusMap[reqId].status = "done";
    });
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

function runCommandInScript(args, scriptPath, reqId) {
    console.log("args : " + args);
    console.log("scriptPath : " + scriptPath);
    var out = {};
    var cwd = process.cwd();
    var execFile = ChildProcess.execFile;
    execFile(scriptPath, args, {cwd: cwd}, function (error, stdout, stderr) {
        out.error = error;
        out.stdout = stdout;
        out.stderr = stderr;
        callStatusMap[reqId].result = out;
        callStatusMap[reqId].status = "done";
        console.log("out in script : "+JSON.stringify(out));
    });
}

function getRandomId() {
    return (+new Date()).toString(36);
}

