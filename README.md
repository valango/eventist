# eventist

[![Build Status](https://travis-ci.org/valango/eventist.svg?branch=master)](https://travis-ci.org/valango/eventist)
[![Coverage Status](https://coveralls.io/repos/valango/eventist/badge.svg?branch=master&service=github)](https://coveralls.io/github/valango/eventist?branch=master)

Event emitter for modular designs.

## Design goals
* minimalistic easily extendable API;
* support for application profiling and testing on both front- and back-end;
* implement all this with minimum amount of code.

## Using
Take a look at and play with [code samples](examples/README.md).

## API

### emit ( event {, arguments} )
Call all handlers registered for event with *event*.
If a handler returns anything else than `undefined`, *emit()* will return
the same value immediately, perhaps leaving some handlers untouched.

Setting or removing handlers during the emit loop has no effect
on handling the current event.
Handlers will be invoked in their registration order.

* ***event*** string.
* ***arguments*** are optional and can be of any type.
* ***Returns:*** `undefined` or the value returned by any handler.

### send ( [callback ,] event {, arguments} )
Put event into queue to be sent asynchronously. If *callback* is supplied,
then Eventist will invoke it with the following argument values:

* `null` or *Error instance* if there was exception thrown;
* *return value* from any event handler;
* arguments array, with *event* as it's first element.

If callback is not supplied then exception from processing will not be caught.

* ***callback*** is `function(Error=, string, ...)` .
* ***event*** string.
* ***arguments*** are optional and can be of any type.

### on ( event, handler )
Register a handler function for event. No checks for duplicates.

* ***event*** string.
* ***handler*** function that will be called with arguments supplied
to *emit()*. See return value handling above.
* ***Returns:*** object instance for chaining.
* ***Throws:***  `TypeError` upon illegal argument type.

### once ( event, handler )
Same as *on()*, but the handler will be removed right after it gets called.

### off ( event, handler )
Remove previously registered handler(s) for event, if found.
If duplicate registrations were made, only the last one will be undone.
`TypeError` exception will be thrown if *event* is not a string. 

* ***event*** string.
* ***handler*** function previously registered via *on()* or *once()*.
***or*** `true` to remove all handlers for given event.
* ***Returns:*** object instance for chaining.
* ***Throws:***  `TypeError` if *event* is not a string.

### depth ()
Return recursion depth of current event. Value 0 means that *emit()* is not
active.

*Eventist* makes no checks or restrictions about event recursion. 

* ***Returns:*** number.

### info ()
Return a dictionary object of handler counts for event types.
May be useful for debugging.

* ***Returns:*** Object.

### execute ( handler, arguments, event )
Actually call the handler function. You may want to override this method for
debugging/profiling purposes. This method should not be called directly.

* ***handler*** function previously registered via *on()* or *once()*.
* ***arguments*** array of those supplied to *emit()*.
* ***event*** as supplied to *emit()*.
* ***Returns:*** anything from *handler*.

## Usage Patterns

### Find out the handler giving specific response to certain event

```javascript
  var eventist = new Eventist();
  var original = eventist.execute;
  eventist.execute = function(cb, args, event) {
    var response = original.call(eventist, ev, cb);
    if(response === THIS && event === THAT){
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

## Tests
The same tests can be run for different environments using the following commands:
```
  > gulp test              # --> reports/coverage/node/
  > karma start            # --> reports/coverage/browser-amd/
  > karma start --direct   # --> reports/coverage/browser/
```

## Links

* [Olical/EventEmitter](https://github.com/Olical/EventEmitter) - similar,
but slightly different project with beautiful code.
I spotted this one when I was already on final.
