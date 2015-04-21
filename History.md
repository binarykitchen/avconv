3.0.0 / 2015-04-22
==================

 * Rebuild meta data parsing (breaking):
   - the `meta` event has been removed, metadata is now provided as third argument to the `exit` listener
   - metadata format changed to a more generic per stream structure, [see readme](https://github.com/binarykitchen/avconv#metadata-object).

2.0.0 / 2014-05-14
==================

 * Change events (breaking):
   - use `.on('message', ...)` instead of `.on('data', ...)`
   - use `.on('exit', ...)` instead of `.on('end', ...)`
 * New event:
   - `.on('data', ...)` - a buffer object with converted data (if outputting to pipe:1)
 * Add support for pipe:0 and pipe:1
 * Uses a duplex stream internally instead of a readable stream
