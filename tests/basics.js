"use strict";

var   testCase = require('nodeunit').testCase
    , avconv;

function read(stream, callback) {
    var   output = []
        , err = [];

    stream.on('data', function(data) {
        output.push(data);
    });

    stream.on('error', function(data) {
        err.push(data);
    });

    stream.once('end', function(exitCode) {
        callback(exitCode, output, err);
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
            t.expect(3);
            
            var stream = avconv(null);
            
            read(stream, function(exitCode, output, err) {
                t.strictEqual(exitCode,   1,  'avconv did nothing');
                t.notEqual(output.length, 0,  'output is not empty');
                t.strictEqual(err.length, 0,  'err is empty');

                t.done();
            });
        },

        'run with empty array ([])': function(t) {
            t.expect(3);
            
            var stream = avconv([]);

            read(stream, function(exitCode, output, err) {
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
            
            read(stream, function(exitCode, output, err) {
                
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
            
            read(stream, function(exitCode, output, err) {

                t.strictEqual(exitCode,   0, 'avconv returned help');
                t.notEqual(output.length, 0, 'stdout contains help');
                t.strictEqual(err.length, 0, 'stderr is still empty');
                t.done();
            });
        }
    })
});
