/**
 * eventist.js
 *
 * @author Villem Alango <villem.alango@gmail.com>
 */

/*!
 Eventist: event emitter for modular designs
 */
!(function (exports) {

  'use strict';

  /* globals module: false, setTimeout: false */

  var FUNCTION = 'function'
    , STRING   = 'string'
    , OBJECT   = 'object'
    , UNDEF    = void 0
    , EVM      = '_eventistMark'
    , EVO      = '_eventistOnce'
    , slice    = Array.prototype.slice
    , myMark   = {}
    ;

  var fail = function (msg, method) {
    throw new TypeError('Eventist#' + method + ': ' + msg + '!');
  };

  var mustBe = function (what, argument, message, place) {
    if (what !== typeof argument) {
      message = [message, 'must', 'be', what].join(' ');
      fail(message, place);
    }
  };

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
    this._events = {};
    this._depth = 0;
  }

  var proto = Eventist.prototype;

  /**
   * Register a `handler` function for an `event`.
   *
   * @param {string}      event
   * @param {function()}  handler
   * @throws {TypeError}  on illegal type of argument
   * @returns {Eventist}  object instance for chaining.
   */
  proto.on = function (event, handler) {
    var dict = this._events, handlers, here = 'on';

    mustBe(STRING, event, 'event', here);
    mustBe(FUNCTION, handler, 'handler', here);

    if ((handlers = dict[event]) !== UNDEF) {
      handlers.push(handler);
    } else {
      dict[event] = [handler];
    }
    return this;
  };

  /**
   * Same as `Eventist::on()`,
   * but the `handler` will be removed right after it gets called.
   *
   * @param {string}      event
   * @param {function()}  handler
   * @throws {TypeError}  on illegal type of argument
   * @returns {Eventist}  object instance for chaining.
   */
  proto.once = function (event, handler) {
    var here = 'once';

    mustBe(STRING, event, 'event', here);
    mustBe(FUNCTION, handler, 'handler', here);

    var self = this, once = function () {
      var res = handler.apply(self, arguments);
      self.off(event, once);
      return res;
    };
    once[EVM] = myMark;
    once[EVO] = handler;
    return this.on(event, once);
  };

  /**
   * Remove previously registered handler for the `event`, if found.
   *
   * If duplicate registrations were made, only the last one will be undone.
   * `TypeError` exception will be thrown if `event` is not a string.
   *
   * @param {string}      event
   * @param {function()|boolean}  handler - `true` to remove all handlers.
   * @throws {TypeError}  on illegal type of `event`.
   * @returns {Eventist}  object instance for chaining.
   */
  proto.off = function (event, handler) {
    var events = this._events, handlers, i, entry;

    mustBe(STRING, event, 'event', 'off');

    if ((handlers = events[event]) !== UNDEF) {
      if (handler === true) {
        delete events[event];
        return this;
      }
      i = handlers.length;
      while (--i >= 0) {
        if ((entry = handlers[i]) === handler ||
          entry[EVM] === myMark && entry[EVO] === handler) {
          handlers.splice(i, 1);
          if (handlers.length === (i = 0)) {
            delete events[event];
          }
        }
      }
    }
    return this;
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
  proto.emit = function (event) {
    var handlers,
        res = UNDEF, args, exec, i;

    args = slice.call(arguments);
    args.shift(1);

    if ((handlers = this._events[event]) !== UNDEF) {
      handlers = handlers.slice();
      exec = this.execute.bind(this);
      i = handlers.length;
      this._depth += 1;
      try {
        do {
          res = exec(handlers[--i], args, event);
        } while (res === UNDEF && i > 0);
      } catch (e) {
        this._depth -= 1;
        throw e;
      }
      this._depth -= 1;
    }
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
  proto.send = function (callback) {
    var self = this, args = slice.call(arguments);

    if (FUNCTION === typeof callback) {
      args.shift(1);
    } else {
      callback = null;
    }

    setTimeout(function () {
      var res, err = null;
      try {
        res = self.emit.apply(self, args);
      } catch (e) {
        if (!callback) {
          throw e;
        }
        err = e;
      }
      callback && callback(err, res, args);
    }, 0);

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
  proto.depth = function () {
    return this._depth;
  };

  /**
   * Return a dictionary object of handler counts for event types.
   *
   * @returns {object}
   */
  proto.info = function () {
    var res = {}, key, evs = this._events;

    /* jshint forin: false */
    for (key in evs) {
      res[key] = evs[key].length;
    }
    /* jshint forin: true */
    return res;
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
  proto.execute = function (handler, args) {
    return handler.apply(this, args);
  };

  /* ********************************************************
    Wrapper/export code for different environments.
   */

  /* istanbul ignore next */
  if (FUNCTION === typeof define &&
    define.amd &&
    OBJECT === typeof define.amd) {
    define(function () {          // amd
      return Eventist;
    });
  } else if (OBJECT === typeof module && module.exports) {
    module.exports = Eventist;    // node
  } else {
    exports = exports || this;
    exports.Eventist = Eventist;  // global
  }

}.call(this));
