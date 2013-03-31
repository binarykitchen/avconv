var   testCase = require('nodeunit').testCase
    , avconv;

module.exports = testCase({

    'TC 1: stability tests': testCase({
        'loading avconv function (require)': function(t) {
            avconv = require('../avconv.js');

            t.ok(avconv, 'avconv is loaded.');
            t.done();
        },

        'run without parameters (null)': function(t) {
            avconv(null, function(code, stdout, stderr) {

                t.strictEqual(code, 1,  'avconv did nothing');
                t.notEqual(stdout, "",  'stdout is not empty');                
                t.equal(stderr, "",     'stderr is empty');
                
                t.done();
            });
        },

        'run with empty array ([])': function(t) {
            avconv([], function(code, stdout, stderr) {

                t.strictEqual(code, 1,  'avconv did nothing');
                t.notEqual(stdout, "",  'stdout is not empty');
                t.equal(stderr, "",     'stderr is empty');

                t.done();
            });
        },

        'run with invalid string parameter (fdsfdsfsdf)': function(t) {
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
            avconv(['fdsfdsfsdf'], function(code, stdout, stderr) {
                
                t.strictEqual(code, 1, 'avconv did nothing');
                t.notEqual(stdout, "", 'stdout is not empty and contains a warning about the wrong parameter');
                t.equal(stderr, "", 'stderr is still empty');
                t.done();
            });            
        }
    }),

    'TC 2: real tests': testCase({
        'loading help (--help)': function(t) {
            avconv(['--help'], function(code, stdout, stderr) {

                t.strictEqual(code, 0, 'avconv returned help');
                t.notEqual(stdout, "", 'stdout contains help');
                t.equal(stderr, "", 'stderr is still empty');
                t.done();
            });
        }
    })
});
