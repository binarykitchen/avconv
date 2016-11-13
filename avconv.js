var spawn    = require('child_process').spawn,
    util     = require('util'),

    AvStream = require('./lib/avstream');

function toMilliSeconds(time) {
    var d  = time.split(/[:.]/),
        ms = 0;

    if (d.length === 4) {
        ms += parseInt(d[0], 10) * 3600 * 1000;
        ms += parseInt(d[1], 10) * 60 * 1000;
        ms += parseInt(d[2], 10) * 1000;
        ms += parseInt(d[3], 10) * 10;
    } else {
        ms += parseInt(d[0], 10) * 1000;
        ms += parseInt(d[1], 10);
    }

    return ms;
}

function findDuration(data) {
    var result = /duration: (\d+:\d+:\d+.\d+)/i.exec(data),
        duration;

    if (result && result[1]) {
        duration = toMilliSeconds(result[1]);
    }

    return duration;
}

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

var
    VIDEO_META = {CODEC: 0, FORMAT: 1, RESOLUTION: 2, BITRATE: 3, FPS: 4},
    AUDIO_META = {CODEC: 0, SAMPLERATE: 1, SPATIALIZATION: 2, SAMPLEFORMAT: 3, BITRATE: 4}
;
function parseMetaData(output) {
    var
        meta = {input:{},output:{}},
        streamIndex,
        streamData,
        metaType,
        metaData,
        tmp;

    function getInteger(v) {return parseInt(v,10)}
    function getChannelCount(v){
        if (v == "mono") return 1;
        if (v == "stereo") return 2;
        if (v.indexOf('.') != -1) {
            return v.split('.').map(getInteger)
                    .reduce(function(a,b){return a+b});
        }
        return v;
    }
    // process lines
    output.split("\n").forEach(function (dataLine) {
        // get metadata type
        if (/^Input/i.test(dataLine))
            metaType = "input";
        else if (/^Output/i.test(dataLine))
            metaType = "output";
        else if (/^Stream mapping/i.test(dataLine))
            metaType = null;

        if (!metaType) return;
        metaData = meta[metaType];

        // is io meta data
        if (/^\s*Duration/.test(dataLine)) {
            dataLine
                .split(',')
                .map(function(d){return d.split(/:\s/)})
                .forEach(function(kv){metaData[kv[0].toLowerCase().trim()]=kv[1]});
            if (metaData.duration)
                metaData.duration = toMilliSeconds(metaData.duration);
            if (metaData.bitrate)
                metaData.bitrate = getInteger(metaData.bitrate);
            if (metaData.start)
                metaData.start = parseFloat(metaData.start);
        } else if (/^\s*Stream #/.test(dataLine)) { // is stream meta data
            // resolve stream indices
            tmp = dataLine.match(/#(\d+)\.(\d+)/);
            if (!tmp) return;
            streamIndex = tmp.slice(1).map(getInteger);

            // get or create stream structure
            if (!metaData.stream) metaData.stream = [];
            streamData = metaData.stream[streamIndex[0]] || (metaData.stream[streamIndex[0]] = []);
            streamData = streamData[streamIndex[1]] || (streamData[streamIndex[1]] = {});

            // get stream type
            tmp = dataLine.match(/video|audio/i);
            if (!tmp) return;
            streamData.type = tmp[0].toLowerCase();

            // prepare stream data
            tmp = dataLine.replace(/.*?(Video|Audio):/i, '').split(", ").map(function(v){
                return v.replace(/[\[\(][^\]\)]*[\]\)]?/, '')
                        .trim().replace(/ [\w\/]+$/, '').trim();
            });

            // parse stream data
            if (streamData.type == "video") {
                streamData.codec = tmp[VIDEO_META.CODEC];
                streamData.format = tmp[VIDEO_META.FORMAT];
                streamData.resolution = tmp[VIDEO_META.RESOLUTION].split("x").map(getInteger);
                streamData.bitrate = getInteger(tmp[VIDEO_META.BITRATE+(metaType=="output"?1:0)]);
                if (metaType == "input")
                    streamData.fps = parseFloat(tmp[VIDEO_META.FPS]);
            } else if (streamData.type == "audio") {
                streamData.codec = tmp[AUDIO_META.CODEC];
                streamData.samplerate = getInteger(tmp[AUDIO_META.SAMPLERATE]);
                streamData.channels = getChannelCount(tmp[AUDIO_META.SPATIALIZATION]);
                streamData.sampleformat = tmp[AUDIO_META.SAMPLEFORMAT];
                streamData.bitrate = getInteger(tmp[AUDIO_META.BITRATE]);
            }
        }
    });
    return meta;
}

module.exports = function avconv(params, command) {
    var stream = new AvStream(),
        command = command || 'avconv',
        // todo: use a queue to deal with the spawn EMFILE exception
        // see http://www.runtime-era.com/2012/10/quick-and-dirty-nodejs-exec-limit-queue.html
        // currently I have added a dirty workaround on the server by increasing
        // the file max descriptor with 'sudo sysctl -w fs.file-max=100000'
        avconv = spawn(command, params);

    // General avconv output is always written into stderr
    if (avconv.stderr) {

        avconv.stderr.setEncoding('utf8');

        var output = '',
            duration,
            time,
            progress;

        avconv.stderr.on('data', function(data) {

            time = null;

            // Keep the output so that we can parse stuff anytime,
            // i.E. duration or meta data
            output += data;

            if (!duration) {
                duration = findDuration(output);
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

            // Emit conversion information as messages
            stream.emit('message', data);
        });
    }

    // When avconv outputs anything to stdout, it's probably converted data
    if (avconv.stdout) {
        avconv.stdout.on('data', function(data) {
            stream.push(data)
        });
    }

    // Pipe the stream to avconv standard input
    if (avconv.stdin) {

        // Reduce overhead when receiving a pipe
        stream.on('pipe', function(source) {

            // Unpipe the source (input) stream from AvStream
            source.unpipe(stream);

            // And pipe it to avconv's stdin instead
            source.pipe(avconv.stdin);
        });

        // When data is written to AvStream, send it to avconv's stdin
        stream.on('inputData', function(data) {
            avconv.stdin.write(data);
        });
    }

    avconv.on('error', function(data) {
        stream.emit('error', data);
    });

    // New stdio api introduced the exit event not waiting for open pipes
    var eventType = avconv.stdio ? 'close' : 'exit';

    avconv.on(eventType, function(exitCode, signal) {
        stream.end();
        stream.emit('exit', exitCode, signal, parseMetaData(output));
    });

    stream.kill = function() {
        avconv.kill();
    };

    return stream;
};
