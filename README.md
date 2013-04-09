# avconv

simply spawns an avconv process with any parameters and returns the result to you. very small, fast, clean and does only this.

## installation
    
to install avconv, use [npm](http://github.com/isaacs/npm):

    $ npm install avconv
    
then in your node.js app, get reference to the function like that:
    
```javascript
var avconv = require('avconv');
```

## quick example

### make an avi video out of images

```javascript
var params = [
    '-f', 'image2',
    '-loglevel', 'info',
    '-i', '/tmp/images/',
    '-y', '/tmp/output.avi'
];

var stream = avconv(params); // returns a readable stream
stream.pipe(process.stdout); // anytime avconv outputs anything, forward these results to process.stdout
```

* avconv consultation is not subject of this module. if you need help with parameters, have a look at http://libav.org/avconv.html
* same goes with node streams. you can do anything with them you want. pipe them or write data inside callbacks. easy.

### how to watch for results (output, errors, exit code)

if you want to watch for errors or for exit codes from the avconv process then you should add event listeners like that:

```
var stream = avconv(params);

stream.on('data', function(data) {
    process.stdout.write(data);
});

stream.on('error', function(data) {
    process.stderr.write(data);
});

stream.once('end', function(exitCode) {
    // here you knows the avconv process is finished
    ...
});
```

an exit code = 0 (zero) means there was no problem. an exit code of 127 means the program avconv could not be found. i recommend you to use a switch block to deal with various exit codes.

depending on the log level you have passed onto the avconv process, the output might contain any useful information. beware that warnings or errors from within the avconv process are still shown as normal output (on 'data'). errors from the stream are rarely filled. they will happen only if there was an unix-related problem about spawning processes, memory etc.

## api

### avconv(params)

avconv spawns a new avconv process with any given parameters. it does not validate the parameters nor mess with the results. that's all up to you.
 
__arguments__

* params - any array list with string arguments

__return value__

* stream - a readable stream where you can attach three well-known events:
    * data - a string with useful information, depending on the log level. any warnings or errors from avconv are there too.
    * error - rarely used. would contain issues related to the OS itself.
    * end - any integer where 0 means OK. anything above 0 indicates a problem (exit code).

## license

MIT