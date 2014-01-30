# avconv

[![Build Status](https://travis-ci.org/binarykitchen/avconv.png?branch=master)](https://travis-ci.org/binarykitchen/avconv)

Simply spawns an avconv process with any parameters and *streams* the results to you (meta data + conversion progress). Very small, fast, clean and does only this.

It also keeps you informed about the progress by emitting events. That's a very unique function of this module. Link that with an UI and it will look flash.

## Support
If you've found avconv useful and would like to contribute to its continued development & support, please feel free to send a donation of any size - it would be greatly appreciated!

[![Support via Gittip](https://rawgithub.com/chris---/Donation-Badges/master/gittip.jpeg)](https://www.gittip.com/binarykitchen)

## Installation

To install avconv, use [npm](http://github.com/isaacs/npm):

    $ npm install avconv

Then in your node.js app, get reference to the function like that:

```javascript
var avconv = require('avconv');
```

## Quick example

### Encode an avi video out of images

```javascript
var params = [
    '-f', 'image2',
    '-loglevel', 'info',
    '-i', '/tmp/images/',
    '-y', '/tmp/output.avi'
];

// returns a readable stream
var stream = avconv(params);

// anytime avconv outputs anything, forward these results to process.stdout
stream.pipe(process.stdout);
```

* Avconv consultation is not subject of this module. If you need help with parameters, have a look at http://libav.org/avconv.html
* Same goes with node streams. You can do anything with them you want. pipe them or listen to events. Easy.
* But if your're smart, then go, have a look at the unit tests. They contain some nice examples.

### How to watch for results (progress, meta data, output, errors, exit code)?

If you want to watch for errors or for exit codes from the avconv process then you should add event listeners like that:

```
var stream = avconv(params);

stream.on('data', function(data) {
    process.stdout.write(data);

    /*
    this also would work because data is utf8 encoded.
    console.log(data);
    */
});

stream.on('progress', function(progress) {
    /*
    Progress is a floating number between 0 ... 1 that keeps you
    informed about the current avconv conversion process.
    */
});

stream.on('meta', function(meta) {
    /*
    Meta is a json. Here an example:

        meta = {
            video: {
                track:     '0.0',
                codec:     'libvpx',
                format:    'yuv420p',
                width:     320,
                height:    240
            }
        };

    Currently it returns meta data about the first video track only. If you want more, drop an issue.
    */
});

stream.on('error', function(data) {
    process.stderr.write(data);
});

stream.once('end', function(exitCode, signal) {
    // here you knows the avconv process is finished
    ...
});
```

An exit code of 0 (zero) means there was no problem. An exit code of 127 means the program avconv could not be found. I recommend you to use a switch block to deal with various exit codes.

Depending on the log level you have passed onto the avconv process, the output might contain any useful information. Beware that warnings or errors from within the avconv process are still shown as normal output in the `data` event.

Whereas errors from the stream are rarely filled (`error` event). They happen only when there was an unix-related problem about spawning processes, memory blabbah ...

## API

### avconv(params)

Avconv spawns a new avconv process with any given parameters. It does not validate the parameters nor mess with the results. That's all up to you. You would see avconv complaining about bad parameters in the `data` event anyways. So:

__arguments__

* params - any array list with string arguments as values

__return value__

* stream - a readable stream where you can attach well-known events like:
    * `.on('data', function(data) {...})` - a chunk of data with useful information, depending on the log level. Any warnings or errors from avconv are there too.
    * `.on('progress', function(progress) {...})` - a floating number, 0 means conversion progress is at 0%, 1 is 100% and means, it's done. Very useful if you want to show the conversion progress on an user interface.
    * `.on('meta', function(meta) {...})` - returns video meta data in json.
    * `.on('error', function(data) {...})` - rarely used. Would contain issues related to the OS itself.
    * `.once('end', function(exitCode, signal) {...})` - for the exit code any integer where 0 means OK. Anything above 0 indicates a problem (exit code). The signal tells how the process ended, i.E. can be a SIGTERM you killed it with `stream.kill()`. If it's null, then it ended normally.
    * `.kill()` - call that if you want to abort avconv in the middle. It will kill the process and fire an `end` event for the stream.

## License

MIT
