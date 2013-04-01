module.exports = avconv;

var spawn = require('child_process').spawn;

function avconv(params, callback) {
    
    var   stdout = ''
        , stderr = ''
        , avconv = spawn('avconv', params);

    // general avconv output is always written into stderr
    if (avconv.stderr)
        avconv.stderr.on('data', function(data) {
            // write it into stdout instead
            stdout += data;
        });

    // just in case if there is something interesting
    if (avconv.stdout)
        avconv.stdout.on('data', function(data) {
            stdout += data;
        });

    avconv.on('error', function(data) {
        if (data.length)
            data += ' ';
        
        stderr += data;
    });

    // new stdio api introduced the exit event not waiting for open pipes
    var eventType = avconv.stdio ? 'close' : 'exit';
    
    avconv.on(eventType, function(code) {
        callback(code, stdout, stderr);
    });
}