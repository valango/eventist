/*!
 Eventist: event emitter for modular designs.
 */
!(function () {
  'use strict';

  /* globals module: false, window: false, setTimeout: false */

  var FUNCTION = 'function'
    , STRING   = 'string'
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

  var Eventist = function () {
        this._events = {};
        this._depth = 0;
      }
    , prot     = Eventist.prototype
    ;

  prot.execute = function (cb, args) {
    return cb.apply(this, args);
  };

  prot.on = function (key, cb) {
    var dict = this._events, handlers;

    string(key);
    callable(cb);

    if ((handlers = dict[key]) !== UNDEF) {
      handlers.push(cb);
    } else {
      dict[key] = [cb];
    }
    return this;
  };

  prot.once = function (key, cb) {
    string(key);
    callable(cb);

    var self = this, once = function () {
      var res = cb.apply(self, arguments);
      self.off(key, once);
      return res;
    };
    once[EVM] = myMark;
    once[EVO] = cb;
    return this.on(key, once);
  };

  prot.off = function (key, cb) {
    var events = this._events, handlers, i, entry;

    string(key);

    if ((handlers = events[key]) !== UNDEF) {
      if (cb === true) {
        delete events[key];
        return this;
      }
      i = handlers.length;
      while (--i >= 0) {
        if ((entry = handlers[i]) === cb ||
          entry[EVM] === myMark && entry[EVO] === cb) {
          handlers.splice(i, 1);
          if (handlers.length === (i = 0)) {
            delete events[key];
          }
        }
      }
    }
    return this;
  };

  prot.emit = function (key) {
    var handlers,
        res = UNDEF, args, exec, i = 0, l;

    args = slice.call(arguments);
    args.shift(1);

    if ((handlers = this._events[key]) !== UNDEF) {
      handlers = handlers.slice();
      exec = this.execute.bind(this);
      l = handlers.length;
      this._depth += 1;
      try {
        do {
          res = exec(handlers[i], args, key);
        } while (res === UNDEF && ++i < l);
      } catch (e) {
        this._depth -= 1;
        throw e;
      }
      this._depth -= 1;
    }
    return res;
  };

  prot.send = function (cb) {
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
          if(!cb){
            throw e;
          }
          err = e;
        }
        cb && cb(err, res, args);
    }, 0);
  };

  prot.depth = function () {
    return this._depth;
  };

  prot.info = function () {
    var res = {}, key, evs = this._events;

    /* jshint forin: false */
    for (key in evs) {
      res[key] = evs[key].length;
    }
    /* jshint forin: true */
    return res;
  };

  var factory = Eventist.factory = function () {
    return new Eventist();
  };

  if (FUNCTION === typeof define &&
    define.amd &&
    'object' === typeof define.amd ) {

    // AMD. Register as an anonymous module.
    define(function () {
      return factory;
    });
  } else if ('undefined' !== typeof module && module.exports) {
    module.exports = factory;
  } else {
    window.Eventist = Eventist;
  }

}());
