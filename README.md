# avconv

[![Build Status](https://travis-ci.org/binarykitchen/avconv.png?branch=master)](https://travis-ci.org/binarykitchen/avconv)

Simply spawns an avconv process with any parameters and *streams* the results to you (meta data + conversion progress). Very small, fast, clean and does only this:

```javascript
// Anything you want
var params = [ ... ];

// Returns a duplex stream
var stream = avconv(params);

// Here you know it's done
stream.on('exit', function(...) {
    ...
})
```

It also can keep you informed about the progress by emitting events. That's a very unique function of this module. Link that with an UI and it will look flash. See `progress` event below.

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

## Quick examples

### Encode an avi video out of images

```javascript
var params = [
    '-f', 'image2',
    '-loglevel', 'info',
    '-i', '/tmp/images/',
    '-y', '/tmp/output.avi'
];

// Returns a duplex stream
var stream = avconv(params);

// Anytime avconv outputs any information, forward these results to process.stdout
stream.on('message', function(data) {
    process.stdout.write(data);
})
```

* Avconv consultation is not subject of this module. If you need help with parameters, have a look at http://libav.org/avconv.html
* Same goes with node streams. You can do anything with them you want. Pipe them or listen to events. Easy.
* But if your're smart, then go, have a look at the unit tests. They contain some nice examples.

### Using streams & pipes

```javascript
var params = [
    '-i', 'pipe:0', // Tell avconv to expect an input stream (via its stdin)
    '-f', 's16le',  // We only want audio back
    '-acodec',
    'pcm_s16le',
    'pipe:1'        // Tell avconv to stream the converted data (via its stdout)
];

// Get the duplex stream
var stream = avconv(params);

// Pipe a file into avconv
fs.createReadStream('video.mp4').pipe(stream);

// Pipe the audio output to a new file
stream.pipe(fs.createWriteStream('audio.raw'));
```

### How to watch for results (progress, meta data, output, errors, exit code)?

If you want to watch for errors or for exit codes from the avconv process then you should add event listeners like that:

```javascript
var stream = avconv(params);

stream.on('message', function(data) {
    process.stdout.write(data);

    /*
    This also would work because data is utf8 encoded:
    console.log(data);
    */
});

stream.on('progress', function(progress) {
    /*
    Progress is a floating number between 0 ... 1 that keeps you
    informed about the current avconv conversion process.
    */
});

stream.on('error', function(data) {
    process.stderr.write(data);
});

stream.on('data', function(data) {
    /*
    When you tell avconv to output to 'pipe:1',
    this is where the data will end up (as a buffer)
    */
});

// You can also pipe the output
stream.pipe(fs.createWriteStream('video.mp4'));

stream.once('exit', function(exitCode, signal, metadata) {
    /*
    Here you know the avconv process is finished
    Metadata contains parsed avconv output as described in the next section
    */
});
```

An exit code of 0 (zero) means there was no problem. An exit code of 127 means the program avconv could not be found. I recommend you to use a switch block to deal with various exit codes.

Depending on the log level you have passed onto the avconv process, the output might contain any useful information. Beware that warnings or errors from within the avconv process are still shown as normal output in the `data` event.

Whereas errors from the stream are rarely filled (`error` event). They happen only when there was an unix-related problem about spawning processes, memory blabbah ...

## API

### stream = avconv(params, [command = 'avconv'])

Avconv spawns a new avconv process with any given parameters. It does not validate the parameters nor mess with the results. That's all up to you. You would see avconv complaining about bad parameters in the `data` event anyway. So:

__one mandatory argument__

* params - any array list with string arguments as values (see examples)

__one optional argument__

* command - the path to the avconv executable (for example to a static binary). Defaults to 'avconv'.

__one return value__

* stream - a readable stream where you can attach well-known events like:
    * `.on('message', function(data) {...})` - a chunk of data with useful information, depending on the log level. Any warnings or errors from avconv are there too.
    * `.on('progress', function(progress) {...})` - a floating number, 0 means conversion progress is at 0%, 1 is 100% and means, it's done. Very useful if you want to show the conversion progress on an user interface.
    * `.on('data', function(data) {...})` - a buffer object with converted data (if outputting to pipe:1)
    * `.on('error', function(data) {...})` - rarely used. Would contain issues related to the OS itself.
    * `.once('exit', function(exitCode, signal, metadata) {...})` - for the exit code any integer where 0 means OK. Anything above 0 indicates a problem (exit code). The signal tells how the process ended, i.E. can be a SIGTERM you killed it with `stream.kill()`. If it's null, then it ended normally.

And of course, you can `.kill()` the stream, if you want to abort in the middle. It will kill the process in cold blood and delegate an `exit` event to avconv's internals.

### Metadata object
Most of the output of avconv is parsed into a metadata object accessable in the `exit` event.

__Please note that parsing of some stream properties may fail, resulting in `null` or `NaN` values.__
```javascript
// converting an flv file to webm
{
    input: {
        duration: 32056, // milliseconds
        start: 0,
        bitrate: null,
        stream: [
            [
                {
                    type: "video",
                    codec: "h264",
                    format: "yuv420p",
                    resolution: [ 320, 240 ],
                    bitrate: 202, // kb/s
                    fps: 29.92
                },{
                    type: "audio",
                    codec: "aac",
                    samplerate: 22050, // Hz
                    channels: 2, // will be 6 for 5.1 etc.
                    sampleformat: "fltp",
                    bitrate: 63 // kbs
                }
            ]
        ]
    },
    output: {
        stream: [
            [
                {
                    type: "video",
                    codec: "libvpx",
                    format: "yuv420p",
                    resolution: [ 320, 240 ],
                    bitrate: 200
                },{
                    type: "audio",
                    codec: "libvorbis",
                    samplerate: 22050,
                    channels: 2,
                    sampleformat: "fltp",
                    bitrate: null
                }
            ]
        ]
    }
}
``` 

## Changelog

See History.md

## Contributors

* Michael Heuberger <michael.heuberger@binarykitchen.com>
* Jelle De Loecker <jelle@kipdola.be>
* Jan Scheurer <lj1102@googlemail.com>
* You?

## License

MIT
