var testCase   = require('nodeunit').testCase,
    path       = require('path'),
    fs         = require('fs'),
    ffmpegPath = require('ffmpeg-static').path,
    avconv,
    AvStream;

function read(stream, callback) {
    var output = [],
        err = [];

    stream.on('message', function(data) {
        output.push(data);
    });

    stream.on('error', function(data) {
        err.push(data);
    });

    stream.once('exit', function(exitCode, signal) {
        callback(exitCode, signal, output, err);
    });
}

module.exports = testCase({

    'TC 1: stability tests': testCase({
        'loading avconv function (require)': function(t) {
            t.expect(1);

            avconv   = require('../avconv.js');
            AvStream = require('../lib/avstream.js');

            t.ok(avconv, 'avconv is loaded.');
            t.done();
        },

        'run without parameters': function(t) {
            t.expect(4);

            var stream = avconv();

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
        },

        'test the AvStream class': function(t) {
            t.expect(1);

            var stream = AvStream(),
                bytes  = 0;

            // See if all bytes are correctly emitted back as an 'inputData' event
            stream.on('inputData', function(d) {
                bytes += d.length;
            });

            stream.on('finish', function() {
                t.strictEqual(bytes, 1085887, 'all bytes have been emitted back');
                t.done();
            });

            fs.createReadStream(path.join(__dirname, 'example', 'pokemon_card.flv')).pipe(stream);
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

            stream.on('message', function(data) {
                datas += data;
            });

            stream.on('progress', function(progress) {
                t.ok(progress > previousProgress,   'Progress has been made');
                t.ok(progress <= 1,                 'Progress is never over 100%');

                previousProgress = progress;
            });

            stream.on('error', function(data) {
                errors += data;
            });

            stream.once('exit', function(exitCode, signal, meta) {
                t.strictEqual(exitCode, 0,    'Video has been successfully generated');
                t.strictEqual(errors,   '',   'No errors occured at all');
                t.strictEqual(signal, null,   'Signal is null');

                t.ok(datas.length > 0, 'There is data');
                t.ok(meta.input, 'There is meta input data');

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

            stream.once('exit', function(exitCode, signal) {

                t.strictEqual(exitCode, null,       'There is no exit code when killed');
                t.strictEqual(errors,   '',         'No errors occured at all');
                t.strictEqual(signal,   'SIGTERM',  'Signal is SIGTERM');

                t.done();
            });

            setTimeout(function() {
                stream.kill();
            }, 10);
        },

        'stream input and output': function(t) {

            var params = [
                '-i',           'pipe:0',
                '-c:v',         'libvpx',
                '-f',           'webm',
                '-deadline',    'realtime',
                'pipe:1'
            ];

            var stream = avconv(params);
            var errors = '';
            var bytes = 0;

            fs.createReadStream(path.join(this.exampleDir, 'pokemon_card.flv')).pipe(stream);

            stream.on('data', function(data) {
                bytes += data.length;
            });

            stream.on('error', function(data) {
                errors += data;
            });

            stream.once('exit', function(exitCode, signal) {

                t.strictEqual(exitCode, 0,    'avconv has exited without errors');
                t.strictEqual(errors,   '',   'No errors occured at all');
                t.strictEqual(signal, null,   'Signal is null');

                t.ok(bytes > 0, 'The conversion has succeeded');

                t.done();
            });
        }
    }),
    'TC 4: parametric avconv executable': testCase({
        'loading help (--help) from custom avconv': function(t) {
            t.expect(3);

            var stream = avconv(['--help'], ffmpegPath);

            read(stream, function(exitCode, signal, output, err) {

                t.strictEqual(exitCode,   0, 'avconv returned help');
                t.notEqual(output.length, 0, 'stdout contains help');
                t.strictEqual(err.length, 0, 'stderr is still empty');
                t.done();
            });
        }
    }),
});
