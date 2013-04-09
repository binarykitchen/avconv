module.exports = avconv;

var   spawn = require('child_process').spawn
    , Stream = require('stream');

function avconv(params) {
    
    var   stream = new Stream()
        , avconv = spawn('avconv', params);

    stream.readable = true;

    // general avconv output is always written into stderr
    if (avconv.stderr)
        avconv.stderr.on('data', function(data) {
            stream.emit('data', data);
        });

    // just in case if there is something interesting
    if (avconv.stdout)
        avconv.stdout.on('data', function(data) {
            stream.emit('data', data);
        });

    avconv.on('error', function(data) {
        stream.emit('error', data);
    });

    // new stdio api introduced the exit event not waiting for open pipes
    var eventType = avconv.stdio ? 'close' : 'exit';
    
    avconv.on(eventType, function(exitCode) {
        stream.emit('end', exitCode);
    });
    
    return stream;
}