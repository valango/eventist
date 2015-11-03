/**
 * eventistSpec.js
 *
 * These tests run under different environments.
 *
 * @author Villem Alango <villem.alango@gmail.com>
 */

(function (global) {

  'use strict';

  /* jshint node: true */

  var TARGET = 'lib/eventist';

  var initialize, testTarget, env = '?';

// ****************************************************
// Set-up code for different environments.
// ****************************************************

  if ('function' === typeof define && define.amd) {
    env = 'AMD';
    initialize = function (done) {
      require([TARGET], function (target) {
        testTarget = target;
        done();
      });
    };
  } else if ('object' === typeof module && module.exports) {
    env = 'NODE';
    initialize = function () {
      testTarget = require('../../' + TARGET);
    };
  } else {
    env = 'WIN';
    initialize = function () {
    };
    testTarget = global.Eventist;
  }


// ****************************************************
// Actual test code
// ****************************************************

  var EV1 = 'testEv1', ENO = 'testEvNope';

  var em, ev, event, count, msg
    , noop = function () {
      };

// ****************************************************
// Test descriptions.
// ****************************************************

  describe('Eventist', function () {

    beforeAll(initialize);

    describe('Default initialization', function () {

      beforeEach(function () {
        (em = testTarget()) && reset();
      });
      testBasicFunctionality();
    });

    describe('Multiple emitters', function () {
      var em1, c1;

      beforeEach(function () {
        (em = testTarget()) && reset();
        (em1 = testTarget()) && (c1 = 0);
      });

      it('should not interfere', function () {
        em.on(EV1, listener);
        em1.on(EV1, function () {
          c1 += 1;
        });
        em.emit(EV1);
        expect(c1).toBe(0);
        expect(count).toBe(1);
        em1.emit(EV1);
        em1.emit(EV1);
        expect(c1).toBe(2);
        expect(count).toBe(1);
      });
    });
  });

  function testBasicFunctionality() {
    testChecks();
    testOn();
    testOnce();
    testOff();
    testSend();
    testHook();
    testEmitReporter();
    testSendReporter();
    testDepth();
    testInfo();
    testMulti();
    testReturn();
  }

//  Check if the event data is preserved and increment the counter.
  function listener() {
    ev = Array.prototype.join.call(arguments, '-');

    msg ||
    ev === event ||
    (msg = [count, ': "', event, '", got "', ev, '"'].join(''));
    count += 1;
  }

//  test driver remembering the original event data
  function emit() {
    var args = Array.prototype.slice.call(arguments);
    args.shift(1);
    event = args.join('-');
    return em.emit.apply(em, arguments);
  }

  function reset() {
    (event = ev = void 0) || (count = 0) || (msg = '');
  }

  function testChecks() {
    it('on() should throw TypeError when event type not string',
      function () {
        expect(function () {
          em.on(this, listener);
        }).toThrowError(TypeError, /Eventist#on: /);
      });
    it('once() should throw TypeError when event type not string',
      function () {
        expect(function () {
          em.once(this, listener);
        }).toThrowError(TypeError, /Eventist#once: /);
      });
    it('on() should throw TypeError when listener is not a function',
      function () {
        expect(function () {
          em.on(EV1, this);
        }).toThrowError(TypeError, /Eventist#on: /);
      });
    it('once() should throw TypeError when listener is not a function',
      function () {
        expect(function () {
          em.once(EV1);
        }).toThrowError(TypeError, /Eventist#once: /);
      });
    it('hook() should throw TypeError when hook callback is not a function',
      function () {
        expect(function () {
          em.hook('a');
        }).toThrowError(TypeError, /Eventist#hook: callback/);
      });
    it('hook() should throw TypeError when reporter callback is not a function',
      function () {
        expect(function () {
          em.reporter('a');
        }).toThrowError(TypeError, /Eventist#reporter: callback/);
      });
  }

  function testOn() {
    it('should work with em.on()', function () {
      var n = noop.bind(null);
      emit(EV1, 1, 2);
      em.on(EV1, listener).on(EV1, noop).on(EV1, n);
      expect(count).toBe(0);
      expect(msg).toBe('');
      emit(EV1, 1, 2, 3, 4, 5);
      expect(count).toBe(1);
      emit(EV1, 1, 2, 3, 4, 5, 6);
      emit(ENO);
      em.off(EV1, listener).off(EV1, noop).off(EV1, n);
      emit(EV1, 1, 2, 3, 4, 5, 6, 7);
      expect(count).toBe(2);
      expect(msg).toBe('');
    });
  }

  function testOff() {
    it('should discard handlers properly', function () {
      em.on(EV1, listener).once(EV1, noop).off('NOPE', true);
      expect(Object.keys(em.info()).length).toBe(1);
      expect(Object.keys(em.off(EV1, true).info()).length).toBe(0);
    });
    it('should discard unfired once handler', function () {
      em.once(EV1, listener).off(EV1, listener);
      expect(Object.keys(em.info()).length).toBe(0);
    });
  }

  function testHook() {
    it('should be called even without handlers', function () {
      var was = false;
      var h = function (args) {
        was = args[0];
      };
      expect(em.hook(h)).toBe(null);
      em.emit(EV1);
      expect(was).toBe(EV1);
      expect(em.hook()).toBe(h);
      expect(em.hook(false)).toBe(null);
    });
    it('should be able to modify everything', function () {
      em.on(EV1, listener).hook(function (args) {
        if (args.length === 0) {
          args.push(EV1);
          args.push(22);
        }
        event = args.join('-');
      });
      em.emit(EV1, 0);
      expect(count).toBe(1);
      expect(event).toBe('testEv1-0');
      em.emit();
      expect(count).toBe(2);
      expect(event).toBe('testEv1-22');
    });
  }

  function testEmitReporter() {
    var res = [];
    it('emit should set event type and count of invocations', function () {
      em.once(EV1, listener).reporter(function (count, event) {
        res.push(event);
        res.push(count);
      });
      em.emit(EV1, 1);
      em.emit(EV1, 1);
      expect(res[0]).toBe(EV1);
      expect(res[1]).toBe(1);
      expect(res[2]).toBe(EV1);
      expect(res[3]).toBe(0);
    });
  }

  function testSendReporter() {
    it('send should set event type and count of invocations = 1', function (done) {
      em.once(EV1, listener).reporter(function (count, event) {
        expect(event).toBe(EV1);
        expect(count).toBe(1);
        done();
      });
      em.send(EV1, 1);
    });
    it('send should set event type and count of invocations = 0', function (done) {
      em.reporter(function (count, event) {
        expect(event).toBe(EV1);
        expect(count).toBe(0);
        done();
      });
      em.send(EV1, 1);
    });
  }

  function testOnce() {
    it('should work with em.once()', function () {
      em.once(EV1, listener);
      expect(count).toBe(0);
      emit(EV1, 1, 2, 3, 4, 5);
      emit(EV1, 1, 2, 3, 4, 5, 6);
      em.emit(ENO);
      expect(count).toBe(1);
      expect(msg).toBe('');
    });
  }

  function testSend() {

    it('callback even if there was no handlers', function (done) {

      em.send(function (err, res, args) {
        expect(err).toBe(null);
        expect(res).toBe(void 0);
        expect(args.length).toBe(2);
        expect(args[0]).toBe(EV1);
        expect(args[1]).toBe(12);
        done();
      }, EV1, 12);
    });

    it('callback should get return value', function (done) {

      em.once(EV1, function () {
        return 22;
      }).send(function (err, res, args) {
        expect(err).toBe(null);
        expect(res).toBe(22);
        expect(args.length).toBe(2);
        expect(args[1]).toBe(12);
        done();
      }, EV1, 12);
    });

    it('callback should catch exception', function (done) {

      em.once(EV1, function () {
        throw new Error('Baah');
      }).send(function (err, res, args) {
        expect(err.message).toBe('Baah');
        expect(res).toBe(void 0);
        expect(args.length).toBe(2);
        expect(args[1]).toBe(12);
        done();
      }, EV1, 12);
    });

    it('no callback should leak exception', function (done) {
      // Catch what you can't... ;-)
      if (env === 'NODE') {
        process.once('uncaughtException', function (e) {
          //console.log('CATCH-G:', e);
          if ('string' === typeof e) {
            expect(e.split(' ').pop()).toBe('intended');
            //process.on('uncaughtException', void 0);
            done();
          }
        });
      } else {
        global.onerror = function (e) {
          expect(e.split(' ').pop()).toBe('intended');
          done();
        };
      }
      em.once(EV1, function () {
        throw 'intended';
      }).send(EV1, 12);
    });
  }

  function testDepth() {
    it('should provide level information', function () {
      expect(em.depth()).toBe(0);
      em.once(EV1, function () {
        expect(em.depth()).toBe(1);
        em.once(ENO, function () {
          expect(em.depth()).toBe(2);
        }).emit(ENO);
      }).emit(EV1);
    });
  }

  function testInfo() {
    it('should give empty info at start', function () {
      expect(Object.keys(em.info()).length).toBe(0);
    });
    it('should give correct info on handlers set', function () {
      var r;
      r = em.on(EV1, listener).on(EV1, listener).info();
      expect(Object.keys(r).length).toBe(1);
      expect(r[EV1]).toBe(2);
      r = em.off(EV1, listener).info();
      expect(Object.keys(r).length).toBe(1);
      expect(r[EV1]).toBe(1);
      expect(Object.keys(em.off(EV1, listener).info()).length).toBe(0);
    });
  }

  function testMulti() {
    it('should work with duplicated listeners', function () {
      em.on(EV1, listener).on(EV1, listener).off(ENO, listener);
      emit(EV1);              // 2 listeners
      expect(count).toBe(2);
      em.off(EV1, listener);  // should remove the last
      emit(EV1);
      expect(count).toBe(3);
      expect(msg).toBe('');
    });
  }

  function testReturn() {
    it('should return non-undefined value immediately', function () {
      em.on(EV1, listener)      // normal listener (should not fire)
        .on(EV1, listener)      // normal listener(should not fire)
        .on(EV1, function () {  // special one returning non-undefined
          count += 1;
          return null;
        })
        .on(EV1, listener);     // normal listener (should fire)
      expect(emit(EV1)).toBe(null);
      expect(count).toBe(2);
    });
  }
}(this));
