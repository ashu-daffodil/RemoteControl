/**
 * Created by ashu on 30/5/15.
 */



var argv = process.argv;
var params = argv[2];

var child = require('child_process').exec(params, {detached: true, stdio: 'ignore'});
child.unref();