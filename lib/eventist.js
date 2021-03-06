/**
 * eventist.js
 *
 * @author Villem Alango <villem.alango@gmail.com>
 */

/*!
 Eventist: event emitter for modular designs
 */
!(function w_(exports) {

  'use strict';

  /* globals module: false, setTimeout: false */

  var FUNCTION = 'function'
    , STRING   = 'string'
    , OBJECT   = 'object'
    , UNDEF    = void 0
    , slice    = Array.prototype.slice
    ;

  var proto = Eventist.prototype;

  /* ********************************************************
   Public API
   */

  /**
   * Factory constructor pattern makes code export simpler.
   *
   * @constructor
   */
  function Eventist() {
    if (!(this instanceof Eventist)) {
      return new Eventist();
    }
    this._events   = {};
    this._depth    = 0;
    this._hook     = null;
    this._reporter = null;
  }

  /**
   * Register a `handler` function for an `event`.
   *
   * @param {string}      event
   * @param {function()}  handler
   * @throws {TypeError}  on illegal type of argument
   * @returns {Eventist}  object instance for chaining.
   */
  proto.on = function on(event, handler, instance) {
    return this.on_(event, handler, instance);
  };

  proto.once = function on(event, handler, instance) {
    return this.on_(event, handler, instance, true);
  };

  proto.on_ = function on_(event, handler, instance, once) {
    var dict = this._events, handlers, entry;

    // @ifdef DEBUG
    var what = once ? 'once' : 'on';

    mustBe(STRING, event, 'event', what);
    mustBe(FUNCTION, handler, 'handler', what);
    if (instance !== UNDEF) {
      mustBeObject(instance, 'instance', what);
    }
    // @endif

    entry = [handler, instance];
    once && entry.push(once);

    if ((handlers = dict[event]) !== UNDEF) {
      handlers.push(entry);
    }
    else {
      dict[event] = [entry];
    }
    return this;
  };

  /**
   * Remove previously registered handler for the `event`, if found.
   *
   * If duplicate registrations were made, only the last one will be undone.
   * `TypeError` exception will be thrown if `event` is not a string.
   *
   * @param {string}      event
   * @param {function()|boolean}  handler - `true` to remove all handlers.
   * @param {object=}  instance.
   * @throws {TypeError}  on illegal type of `event`.
   * @returns {Eventist}  object instance for chaining.
   */
  proto.off = function off(event, handler, instance) {
    var self = this, events = self._events, handlers, i, entry;

    // @ifdef DEBUG
    mustBe(STRING, event, 'event', 'off');
    if (instance !== UNDEF) {
      mustBeObject(instance, 'instance', 'off');
    }
    // @endif

    if ((handlers = events[event]) !== UNDEF) {
      if (handler === true) {
        delete events[event];
        return self;
      }
      i = handlers.length;
      while (--i >= 0) {
        entry = handlers[i];
        if (entry[0] === handler && entry[1] === instance) {
          handlers.splice(i, 1);
          //  We remove only the last handler matching!
          if (handlers.length === (i = 0)) {
            delete events[event];
          }
        }
      }
    }
    return self;
  };

  proto.unplug = function unplug(instance) {
    var self = this, events = self._events, list = []
      , event, handlers, i;

    // @ifdef DEBUG
    mustBeObject(instance, 'instance', 'unplug');
    // @endif

    /* eslint guard-for-in:0 */
    for (event in events) {
      i = (handlers = events[event]).length;
      while (--i >= 0) {
        if (handlers[i][1] === instance) {
          list.push(event, handlers[i][0]);
        }
      }
    }

    for (i = list.length; --i >= 0; i -= 1) {
      self.off(list[i - 1], list[i], instance);
    }

    return self;
  };

  /**
   * Call the handlers registered for the event.
   *
   * When a handler returns anything else than `undefined`, then return
   * the same value immediately, perhaps leaving some handlers untouched.
   *
   * Handlers will be invoked starting from the most recently registered one.
   * Setting or removing handlers during the emit loop has no effect
   * on handling the current event.
   *
   * @param {string}      event
   * @returns {*}         anything returned from a handler or `undefined`.
   */
  proto.emit = function emit() {
    var handlers,
        res   = UNDEF, args, exec, event, i, entry
      , rep   = this._reporter
      , count = 0
      , hook  = this._hook
      , self  = this
      ;

    args = slice.call(arguments);
    hook && hook.call(self, args);
    event = args.shift(1);

    if ((handlers = this._events[event]) !== UNDEF) {
      handlers = handlers.slice();
      exec     = self.execute.bind(this);
      i        = handlers.length;
      self._depth += 1;
      try {
        do {
          count += 1;
          entry = handlers[--i];
          if (entry[2]) {
            self.off(event, entry[0], entry[1]);
          }
          res = exec(entry, args, event);
        } while (res === UNDEF && i > 0);
      }
      catch (e) {
        self._depth -= 1;
        throw e;
      }
      self._depth -= 1;
    }
    rep && rep(event, count, args);
    return res;
  };

  /**
   * Put event into queue to be sent asynchronously.
   *
   * If `callback` is supplied, it will be called with the following arguments:
   * 1) `null` or the exception value if one was caught;
   * 2) return value from event processing;
   * 3) array containing the `event` and all `arguments`.
   *
   * @param {function(*,*,Array<*>)} callback
   * @throws {*}  any exception from event processing if `callback` is missing.
   * @returns {Eventist}  object instance for chaining.
   */
  proto.send = function send(callback) {
    var self = this, cb, myCb, argums = slice.call(arguments);

    if (FUNCTION === typeof callback) {
      (cb = callback) && argums.shift(1);
    }
    else {
      cb = null;
    }

    // @ifdef DEBUG
    mustBe(STRING, argums[0], 'event', 'send');
    // @endif

    myCb = (function mkCb(args, cb0) {
      return function cb1() {
        var res = void 0, err = null;

        try {
          res = self.emit.apply(self, args);
        }
        catch (e) {
          err = e;
          if (!cb0) {
            if (!e.hasOwnProperty('message')) {
              // A shim for some special cases like Network error and alike.
              err = new Error(e + '');
            }
            err.message = 'Sending "' + args[0] + '": ' + err.message;
            throw err;
          }
        }
        finally {
          cb0 && cb0(err, res, args);
        }
      };
    })(argums, cb);

    setTimeout(myCb, 0);

    return self;
  };

  /* ********************************************************
   Special API - mainly for debugging
   */

  /**
   * Return recursion depth of the current event.
   *
   * @returns {number} value 0 means that emit() is not active.
   */
  proto.depth = function depth() {
    return this._depth;
  };

  /**
   * Return a dictionary object of handler counts for event types.
   *
   * @returns {object}
   */
  proto.info = function info() {
    var res = {}, key, evs = this._events;

    for (key in evs) {
      res[key] = evs[key].length;
    }
    return res;
  };

  /**
   * Set the hook callback.
   *
   * @param {function()} callback
   * @returns {null|function()} old/existing value
   */
  proto.hook = function hook(callback) {
    var old = this._hook;

    if (callback) {
      mustBe(FUNCTION, callback, 'callback', 'hook');
      this._hook = callback;
    }
    else {
      this._hook = null;
    }
    return old;
  };

  /**
   * Set the reporter callback.
   *
   * @param {function()} callback
   * @returns {null|function()} old/existing value
   */
  proto.reporter = function reporter(callback) {
    var old = this._reporter;

    if (callback) {
      mustBe(FUNCTION, callback, 'callback', 'reporter');
      this._reporter = callback;
    }
    else {
      this._reporter = null;
    }
    return old;
  };

  /**
   *  Actually call the handler function.
   *
   *  Can be overridden for debugging/profiling purposes.
   *  Should not be called directly.
   *
   * @param {function()}  handler
   * @param {Array<*>=}   args
   * @returns {*}
   */
  proto.execute = function execute(entry, args) {
    return entry[0].apply(entry[1], args);
  };

  /* ********************************************************
   Utility functions.
   */

  function fail(msg, method) {
    throw new TypeError('Eventist#' + method + ': ' + msg + '!');
  }

  function mustBe(what, argument, message, place) {
    if (what !== typeof argument) {
      fail([message, 'must', 'be', what].join(' '), place);
    }
  }

  function mustBeObject(argument, message, place) {
    if (typeof argument !== OBJECT || argument === null) {
      fail(message + ' must be an object instance', place);
    }
  }

  /* ********************************************************
   Wrapper/export code for different environments.
   */

  /* istanbul ignore next */
  /* eslint no-param-reassign:0 */
  if (FUNCTION === typeof define &&
    define.amd &&
    OBJECT === typeof define.amd) {
    define(function amd() {          // amd
      return Eventist;
    });
  }
  else if (OBJECT === typeof module && module.exports) {
    module.exports = Eventist;    // node
  }
  else {
    exports          = exports || this;
    exports.Eventist = Eventist;  // global
  }

}.call(this));
