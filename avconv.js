"use strict";

var spawn  = require('child_process').spawn,
    Stream = require('stream');

// Converts a avconv time format to milliseconds
function toMilliSeconds(time) {
    var d  = time.split(/[:.]/),
        ms = 0;

    if (d.length === 4) {
        ms += parseInt(d[0], 10) * 3600 * 1000;
        ms += parseInt(d[1], 10) * 60 * 1000;
        ms += parseInt(d[2], 10) * 1000;
        ms += parseInt(d[3], 10);
    } else {
        ms += parseInt(d[0], 10) * 1000;
        ms += parseInt(d[1], 10);
    }

    return ms;
}

// Extract duration from avconv data
function findDuration(data) {
    var result = /duration: (\d+:\d+:\d+.\d+)/i.exec(data),
        duration;

    if (result && result[1]) {
        duration = toMilliSeconds(result[1]);
    }

    return duration;
}

// Extract time frame from avconv data
function findTime(data) {
    var time;

    if (data.substring(0, 5) === 'frame') {
        var result = /time=(\d+.\d+)/i.exec(data);

        if (result && result[1]) {
            time = toMilliSeconds(result[1]);
        }
    }

    return time;
}

function findVideoMetaData(data) {
    var result = /Stream #([^:]+): Video: ([^,]+), ([^,]+), (\d+)x(\d+)/.exec(data),
        meta;

    if (result && result[1]) {

        meta = {
            video: {
                track:     result[1],
                codec:     result[2],
                format:    result[3],
                width:     parseInt(result[4]),
                height:    parseInt(result[5])
            }
        };
    }

    return meta;
}

module.exports = function avconv(params) {

    var stream = new Stream(),
        avconv = spawn('avconv', params);

    stream.readable = true;

    // General avconv output is always written into stderr
    if (avconv.stderr) {

        avconv.stderr.setEncoding('utf8');

        var duration,
            time,
            progress,
            meta;

        avconv.stderr.on('data', function(data) {

            time = null;

            if (!duration) {
                duration = findDuration(data);
            } else {
                time = findTime(data);
            }

            if (duration && time) {
                progress = time / duration;

                if (progress > 1) {
                    progress = 1; // Fix floating point error
                }

                // Tell the world that progress is made
                stream.emit('progress', progress);
            }

            if (!meta) {
                meta = findVideoMetaData(data);

                if (meta) {
                    // Share the meta data we found
                    stream.emit('meta', meta);
                }
            }

            stream.emit('data', data);
        });
    }

    // Just in case if there is something interesting
    if (avconv.stdout) {
        avconv.stdout.setEncoding('utf8');
        avconv.stdout.on('data', function(data) {
            stream.emit('data', data);
        });
    }

    avconv.on('error', function(data) {
        stream.emit('error', data);
    });

    // New stdio api introduced the exit event not waiting for open pipes
    var eventType = avconv.stdio ? 'close' : 'exit';

    avconv.on(eventType, function(exitCode, signal) {
        stream.emit('end', exitCode, signal);
    });

    stream.kill = function() {
        avconv.kill();
    };

    return stream;
};
