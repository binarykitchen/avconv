# avconv

Simply spawns an avconv process with any parameters and *streams* the result to you. Very small, fast, clean and does only this.

It also keeps you informed about the progress by emitting events. That's a very unique function of this module.

## Installation

To install avconv, use [npm](http://github.com/isaacs/npm):

    $ npm install avconv

Then in your node.js app, get reference to the function like that:

```javascript
var avconv = require('avconv');
```

## Quick example

### Make an avi video out of images

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
* But have a look at the unit tests. They contain some nice examples.

### How to watch for results (progress, output, errors, exit code)?

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
    progress is a floating number between 0 ... 1 that keeps you
    informed about the current avconv conversion process.
    */
});

stream.on('error', function(data) {
    process.stderr.write(data);
});

stream.once('end', function(exitCode) {
    // here you knows the avconv process is finished
    ...
});
```

An exit code = 0 (zero) means there was no problem. An exit code of 127 means the program avconv could not be found. I recommend you to use a switch block to deal with various exit codes.

Depending on the log level you have passed onto the avconv process, the output might contain any useful information. Beware that warnings or errors from within the avconv process are still shown as normal output in the `data` event.

Whereas errors from the stream are rarely filled ('error' event). They happen only when there was an unix-related problem about spawning processes, memory blabbah ...

## API

### avconv(params)

Avconv spawns a new avconv process with any given parameters. It does not validate the parameters nor mess with the results. That's all up to you.

__arguments__

* params - any array list with string arguments

__return value__

* stream - a readable stream where you can attach well-known events like:
    * .on('data', function(data) {...}) - a chunk of data with useful information, depending on the log level. Any warnings or errors from avconv are there too.
    * .on('progress', function(progress) {...}) - a floating number, 0 means conversion progress is at 0%, 1 is 100% and means, it's done. Very useful if you want to show the conversion progress on an user interface,
    * .on('error', function(data) {...}) - rarely used. Would contain issues related to the OS itself.
    * .once('end', function(exitCode) {...}) - any integer where 0 means OK. Anything above 0 indicates a problem (exit code).

## License

MIT
