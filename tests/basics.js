"use strict";

var testCase  = require('nodeunit').testCase,
    path      = require('path'),
    fs        = require('fs'),
    avconv;

function read(stream, callback) {
    var output = [],
        err = [];

    stream.on('data', function(data) {
        output.push(data);
    });

    stream.on('error', function(data) {
        err.push(data);
    });

    stream.once('end', function(exitCode, signal) {
        callback(exitCode, signal, output, err);
    });
}

module.exports = testCase({

    'TC 1: stability tests': testCase({
        'loading avconv function (require)': function(t) {
            t.expect(1);

            avconv = require('../avconv.js');

            t.ok(avconv, 'avconv is loaded.');
            t.done();
        },

        'run without parameters (null) 1': function(t) {
            t.expect(4);

            var stream = avconv(null);

            read(stream, function(exitCode, signal, output, err) {
                t.strictEqual(exitCode,   1,  'avconv did nothing');
                t.notEqual(output.length, 0,  'output is not empty');
                t.strictEqual(err.length, 0,  'err is empty');
                t.strictEqual(signal, null,   'Signal is null');

                t.done();
            });
        },

        'run with empty array ([])': function(t) {
            t.expect(3);

            var stream = avconv([]);

            read(stream, function(exitCode, signal, output, err) {
                t.strictEqual(exitCode,   1, 'avconv did nothing');
                t.notEqual(output.length, 0, 'output is not empty');
                t.strictEqual(err.length, 0, 'err is empty');

                t.done();
            });
        },

        'run with invalid string parameter (fdsfdsfsdf)': function(t) {
            t.expect(1);

            t.throws(
                function() {
                    avconv('fdsfdsfsdf');
                },
                TypeError,
                'a type error must be thrown here'
            );

            t.done();
        },

        'run with invalid array parameters ([fdsfdsfsdf])': function(t) {
            t.expect(3);

            var stream = avconv(['fdsfdsfsdf']);

            read(stream, function(exitCode, signal, output, err) {

                t.strictEqual(exitCode,   1, 'avconv did nothing');
                t.notEqual(output.length, 0, 'stdout is not empty and contains a warning about the wrong parameter');
                t.strictEqual(err.length, 0, 'stderr is still empty');
                t.done();
            });
        }
    }),

    'TC 2: real tests': testCase({
        'loading help (--help)': function(t) {
            t.expect(3);

            var stream = avconv(['--help']);

            read(stream, function(exitCode, signal, output, err) {

                t.strictEqual(exitCode,   0, 'avconv returned help');
                t.notEqual(output.length, 0, 'stdout contains help');
                t.strictEqual(err.length, 0, 'stderr is still empty');
                t.done();
            });
        }
    }),

    'TC 3: do a conversion': testCase({

        setUp: function(callback) {

            this.exampleDir = path.join(__dirname, 'example');

            var source = path.join(this.exampleDir, 'pokemon_card.webm');

            try {
                fs.unlinkSync(source);
            } catch (exc) {
                // ignore if it does not exist
            }

            callback();
        },

        'convert pokemon flv to webm': function(t) {

            var params = [
                '-i',           path.join(this.exampleDir, 'pokemon_card.flv'),
                '-c:v',         'libvpx',
                '-deadline',    'realtime',
                '-y',           path.join(this.exampleDir, 'pokemon_card.webm')
            ];

            var errors = '',
                datas  = '',
                previousProgress = 0;

            var stream = avconv(params);

            stream.on('data', function(data) {
                datas += data;
            });

            stream.on('progress', function(progress) {
                t.ok(progress > previousProgress,   'Progress has been made');
                t.ok(progress <= 1,                 'Progress is never over 100%');

                previousProgress = progress;
            });

            stream.on('meta', function(meta) {
                t.strictEqual(meta.video.track,  '0.0',         'Video track number is correct');
                t.strictEqual(meta.video.codec,  'h264 (Main)', 'Video codec is correct');
                t.strictEqual(meta.video.format, 'yuv420p',     'Video format is correct');
                t.strictEqual(meta.video.width,  320,           'Video width is correct');
                t.strictEqual(meta.video.height, 240,           'Video height is correct');
            });

            stream.on('error', function(data) {
                errors += data;
            });

            stream.once('end', function(exitCode, signal) {

                t.strictEqual(exitCode, 0,    'Video has been successfully generated');
                t.strictEqual(errors,   '',   'No errors occured at all');
                t.strictEqual(signal, null,   'Signal is null');

                t.ok(datas.length > 0, 'There is data');

                t.done();
            });
        },

        'convert and kill in the middle': function(t) {

            var params = [
                '-i',           path.join(this.exampleDir, 'pokemon_card.flv'),
                '-c:v',         'libvpx',
                '-deadline',    'realtime',
                '-y',           path.join(this.exampleDir, 'pokemon_card.webm')
            ];

            var errors = '';

            var stream = avconv(params);

            stream.on('error', function(data) {
                errors += data;
            });

            stream.once('end', function(exitCode, signal) {

                t.strictEqual(exitCode, null,       'There is no exit code when killed');
                t.strictEqual(errors,   '',         'No errors occured at all');
                t.strictEqual(signal,   'SIGTERM',  'Signal is SIGTERM');

                t.done();
            });

            setTimeout(function() {
                stream.kill();
            }, 10);
        }
    })
});
