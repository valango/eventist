# eventist

[![GitHub version](https://badge.fury.io/gh/villu357%2Feventist.svg)](http://badge.fury.io/gh/villu357%2Feventist)
[![Build Status](https://travis-ci.org/villu357/eventist.svg?branch=master)](https://travis-ci.org/villu357/eventist)
[![Coverage Status](https://coveralls.io/repos/villu357/eventist/badge.svg?branch=master&service=github)](https://coveralls.io/github/villu357/eventist?branch=master)

Event emitter for modular designs.

***NOTE:*** *This project is anything but finished yet*.

## Design goals
* to make it easy to expand functionality;
* to support application profiling and testing on both front- and back-end;
* to implement all this with minimum amount of code.

## API

### emit ( type {, arguments} )
Call all handlers registered for event with *type*.
If a handler returns anything else than `undefined`, *emit()* will return
the same value immediately, perhaps leaving some handlers untouched.

Setting or removing handlers during the emit loop has no effect
on handling the current event.
Any particular handlers call order should not be assumed.

* ***type*** is an event type string.
* ***arguments*** are optional and can be of any type.
* ***Returns:*** `undefined` or the value returned by any handler.

### send ( [callback ,] type {, arguments} )
Put event into queue to be sent asynchronously. If *callback* is supplied,
then Eventist will invoke it with the following argument values:

* `null` or *Error instance* if there was exception thrown;
* *return value* from any event handler;
* arguments array, with *type* as it's first element.

If callback is not supplied then exception from processing will not be caught.

* ***callback*** is `function(Error=, string, ...)` .
* ***type*** is an event type string.
* ***arguments*** are optional and can be of any type.

### on ( type, handler )
Register a handler function for event type. No checks for duplicates.

* ***type*** is an event type string.
* ***handler*** function that will be called with arguments supplied
to *emit()*. See return value handling above.
* ***Returns:*** object instance for chaining.
* ***Throws:***  `TypeError` upon illegal argument type.

### once ( type, handler )
Same as *on()*, but the handler will be removed right after it gets called.

### off ( type, handler )
Remove previously registered handler(s) for event type, if found.
If duplicate registrations were made, only the last one will be undone.
`TypeError` exception will be thrown if *type* is not a string. 

* ***type*** is an event type string.
* ***handler*** function previously registered via *on()* or *once()*.
***or*** `true` to remove all handlers for given event.
* ***Returns:*** object instance for chaining.
* ***Throws:***  `TypeError` if *type* is not a string.

### depth ()
Return recursion depth of current event. Value 0 means that *emit()* is not
active.

*Eventist* makes no checks or restrictions about event recursion. 

* ***Returns:*** number.

### info ()
Return a dictionary object of handler counts for event types.
May be useful for debugging.

* ***Returns:*** Object.

### execute ( handler, arguments, type )
Actually call the handler function. You may want to override this method for
debugging/profiling purposes. This method should not be called directly.

* ***handler*** function previously registered via *on()* or *once()*.
* ***arguments*** array of those supplied to *emit()*.
* ***type*** as supplied to *emit()*.
* ***Returns:*** anything from *handler*.

## Usage Patterns

### Find out the handler giving specific response to certain event

```javascript
  var eventist = new Eventist();
  var original = eventist.execute;
  eventist.execute = function(cb, args, type) {
    var response = original.call(eventist, ev, cb);
    if(response === THIS && type === THAT){
      cb = 0; // set a breakpoint here
    }
    return response;
  }
```

### Profiling
The following example is probably not very useful by itself, but the code
before and after `emit` invocation can do something more interesting,
like maintaining profiling dictionaries etc.

```javascript
  var eventist = new Eventist();
  var count = 0, time = 0;
  var emit = eventist.emit;
  eventist.emit = function(ev) {
    var t0 = getCurrentTime();
    var res = emit.apply(eventist, arguments);
    time += getCurrentTime() - t0;
    count += 1;
    return res;
  }
```

### Sending events asynchronously
*Emitting* a new event right from a handler may result in deeply nested events,
puzzling execution track potentially hard-to-spot bugs. In such cases *send()*
may be better choice. In the following example, the return value will be
forwarded with some other data via event2 and the callback will run after this
has been processed.

```javascript
  var handler1 = function() {
    var res1 = doMyProcessing();
    eventist.send(function(err, res2, args) {
      // Process if necessary...
      }, 
      'event2', res1, somethingMore...);
    return res1; // If necessary...
  };
```
If we do not need result processing or we do not need to wait until our response
gets processed, then the *"If necessary..."* lines can be omitted.

## ToDo

* add examples;
* check for: https://github.com/zordius/gulp-jsx-coverage.
