# eventist

[![Build Status](https://travis-ci.org/valango/eventist.svg?branch=master)](https://travis-ci.org/valango/eventist)
[![Coverage Status](https://coveralls.io/repos/valango/eventist/badge.svg?branch=master&service=github)](https://coveralls.io/github/valango/eventist?branch=master)

Event emitter for modular designs.

**Design goals:**

* minimalistic extendable API;
* support for application profiling and testing on both front- and back-end;
* implement all this with minimum amount of code.

**NB:** The release 1.0 conveniently supports using instance methods as event
handlers. Enhanced API makes [preventing memory leaks](#prevent-leaks) much
easier.

## Installation

```
 > npm install eventist
```
or
```
 > bower install eventist
```

## Usage
Take a look at and play with [code samples](examples/README.md) and
*Special Patterns* below.

## Main API

### emit ( event {, arguments} )
Call *synchronously* the handlers registered for the *event*.
When a handler returns anything else than `undefined`, *emit()* will return
the same value immediately, perhaps leaving some handlers untouched.

Handlers will be invoked starting from the most recently registered one.
Setting or removing handlers during the emit loop has no effect
on handling the current event.

* ***event*** string.
* ***arguments*** are optional and can be of any type.
* ***Returns:*** `undefined` or the value returned by any handler.

### send ( [callback ,] event {, arguments} )
Put event into queue to be called *asynchronously* on the next timer tick.
If *callback* is supplied,
then Eventist will invoke it with the following argument values:

* `null` or the exception value if one was caught;
* *return value* return value from event processing;
* array containing the `event` and all `arguments`.

If callback is not supplied, then exception from processing will not be caught.

* ***callback*** is `function(*,*,Array<*>)` .
* ***event*** string.
* ***arguments*** are optional and can be of any type.
* ***Returns:*** instance of itself for chaining.
* ***Throws:*** any exception from event processing if `callback` is missing.

### on ( event, handler[, instance] )
Register a handler (function or method) for event. No checks for duplicates.

* ***event*** string.
* ***handler*** function that will be called with arguments supplied
to *emit()*. See return value handling above.
* ***instance*** object instance.
* ***Returns:*** instance of itself for chaining.
* ***Throws:***  `TypeError` upon illegal argument type.

### once ( event, handler[, instance] )
Same as *on()*, but the handler will be removed right after it gets called.

### off ( event, handler[, instance] )
Remove previously registered handler for the `event`, if found.
If duplicate registrations were made, only the last one will be undone.
`TypeError` exception will be thrown if *event* is not a string. 

* ***event*** string.
* ***handler*** function previously registered via *on()* or *once()*.
***or*** `true` to remove all handlers for given event.
* ***instance*** object instance.
* ***Returns:*** instance of itself for chaining.
* ***Throws:***  `TypeError` if *event* is not a string.

**NOTE:** The *instance* argument will be supplied to handler as
[thisArg](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Function/apply),
but it can be any value.

### unplug ( instance )
Remove handlers, which are methods of given *instance*, if found.

* ***instance*** object instance.
* ***Returns:*** instance of itself for chaining.
* ***Throws:***  `TypeError` exception will be thrown if *instance*
is not an object or is `null`.

## Debugging API

The following methods are intended for debugging and production code should not
use those. This API or parts of it may be deprecated soon.

### hook ( [callback] )
Set the hook callback function. Callback hook will be called by *emit()*
before any of the handlers. Callback hook function may modify the arguments
array in any way, before it will be applied to handlers. Calling the method
with falsey argument will remove the hook callback.

* ***callback*** function receiving array of all arguments supplied to emit();
* ***Returns:*** previous hook callback or null;
* ***Throws:***  `TypeError` if `callback` is not falsey and is not a function.

### reporter ( [callback] )
Sets a callback to be called in the end of every call of *emit()* or *send()*
with arguments `event`, `count` and `args`, 
*count* being a number of handlers actually
executed on particular *event*. Otherwise, it is similar to *hook()* method.

* ***callback*** function receiving *count* of handlers invoked and the *event*
itself;
* ***Returns:*** previous hook callback or null;
* ***Throws:***  `TypeError` if `callback` is not falsey and is not a function.

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

## Patterns

### <a name=prevent-leaks></a>Preventing memory leaks
If code like `eventist.on(someEvent, objectsMethod, objectInstance)`
is executed, then `eventist.unplug(objectInstance)` should be called before
discarding the object instance. Failure to do so will result in memory leak.

Before v1.0 the only way to use instance method as event handler was to use
closures, which resulted in ugly code.

### Reporting unhandled events
This feature comes handy for fishing out possible event name typo errors.

```javascript
  var eventist = new Eventist();
  
  eventist.reporter (function (count, event) {
      count || console.log('UNHANDLED:', event);
  });
  ...
```

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
