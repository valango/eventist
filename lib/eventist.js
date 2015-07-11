/**
 * eventist.js
 *
 * @author Villem Alango <villem.alango@gmail.com>
 */

/*!
 Eventist: event emitter for modular designs.
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

  var err = function (msg) {
    throw new TypeError('Eventist: ' + msg);
  };

  /* Polyfill to avoid dependencies. */
  var callable = function (v) {
        if (FUNCTION !== typeof v) {
          err('A callable argument is expected!');
        }
      }
    , string   = function (v) {
        if (STRING !== typeof v) {
          err('Event type must be string!');
        }
      };

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

  proto.execute = function (handler, args) {
    return handler.apply(this, args);
  };

  proto.on = function (event, handler) {
    var dict = this._events, handlers;

    string(event);
    callable(handler);

    if ((handlers = dict[event]) !== UNDEF) {
      handlers.push(handler);
    } else {
      dict[event] = [handler];
    }
    return this;
  };

  proto.once = function (event, handler) {
    string(event);
    callable(handler);

    var self = this, once = function () {
      var res = handler.apply(self, arguments);
      self.off(event, once);
      return res;
    };
    once[EVM] = myMark;
    once[EVO] = handler;
    return this.on(event, once);
  };

  proto.off = function (event, handler) {
    var events = this._events, handlers, i, entry;

    string(event);

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

  proto.emit = function (event) {
    var handlers,
        res = UNDEF, args, exec, i = 0, l;

    args = slice.call(arguments);
    args.shift(1);

    if ((handlers = this._events[event]) !== UNDEF) {
      handlers = handlers.slice();
      exec = this.execute.bind(this);
      l = handlers.length;
      this._depth += 1;
      try {
        do {
          res = exec(handlers[i], args, event);
        } while (res === UNDEF && ++i < l);
      } catch (e) {
        this._depth -= 1;
        throw e;
      }
      this._depth -= 1;
    }
    return res;
  };

  proto.send = function (cb) {
    var self = this, args = slice.call(arguments);

    if (FUNCTION === typeof cb) {
      args.shift(1);
    } else {
      cb = null;
    }

    setTimeout(function () {
      var res, err = null;
      try {
        res = self.emit.apply(self, args);
      } catch (e) {
        if (!cb) {
          throw e;
        }
        err = e;
      }
      cb && cb(err, res, args);
    }, 0);
  };

  proto.depth = function () {
    return this._depth;
  };

  proto.info = function () {
    var res = {}, key, evs = this._events;

    /* jshint forin: false */
    for (key in evs) {
      res[key] = evs[key].length;
    }
    /* jshint forin: true */
    return res;
  };

  exports = exports || this;

  /* istanbul ignore next */
  if (FUNCTION === typeof define &&
    define.amd &&
    OBJECT === typeof define.amd) {
    define(function () {
      return Eventist;
    });
  } else if (OBJECT === typeof module && module.exports) {
    module.exports = Eventist;
  } else {
    exports.Eventist = Eventist;
  }

}.call(this));
