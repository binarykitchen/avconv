var testCase   = require('nodeunit').testCase,
    path       = require('path'),
    fs         = require('fs'),
    ffmpegPath = require('ffmpeg-static').path,
    avconv     = require('../avconv.js'),
    AvStream   = require('../lib/avstream.js'),
    exampleDir = path.join(__dirname, 'example');

module.exports = testCase({
    'avconv 11.12': function(t) {
        var expected = require(path.join(exampleDir, 'avconv_11.12-6:11.12-1~deb8u1.json'));
            stream = avconv([ '-c', 'cat ' + path.join(exampleDir, 'avconv_11.12-6:11.12-1~deb8u1.out') + ' >&2' ], 'sh');

        stream.on('error', function(data) {
            t.ok(false, 'Stream error');
            t.done();
        });

        stream.once('exit', function(exitCode, signal, metadata) {
            t.deepEqual(metadata, expected);
            t.done();
        });
    },

    'avconv, comma in parenthesis': function(t) {
        var expected = require(path.join(exampleDir, 'avconv_comma_in_parenthesis.json'));
            stream = avconv([ '-c', 'cat ' + path.join(exampleDir, 'avconv_comma_in_parenthesis.out') + ' >&2' ], 'sh');

        stream.on('error', function(data) {
            t.ok(false, 'Stream error');
            t.done();
        });

        stream.once('exit', function(exitCode, signal, metadata) {
            t.deepEqual(metadata, expected);
            t.done();
        });
    },

    'ffmpeg 3.2': function(t) {
        var expected = require(path.join(exampleDir, 'ffmpeg_3.2.14-1~deb9u1.json'));
            stream = avconv([ '-c', 'cat ' + path.join(exampleDir, 'ffmpeg_3.2.14-1~deb9u1.out') + ' >&2' ], 'sh');

        stream.on('error', function(data) {
            t.ok(false, 'Stream error');
            t.done();
        });

        stream.once('exit', function(exitCode, signal, metadata) {
            t.deepEqual(metadata, expected);
            t.done();
        });
    },
});
