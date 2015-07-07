define(function () {

    'use strict';

    /* jshint freeze: false */
    /*
     Polyfill for patching a PhantomJs issue #10522.
     @see(https://github.com/ariya/phantomjs/issues/10522)
     Thanks to: @andreaugusto / @creationix !
     */
    Function.prototype.bind = Function.prototype.bind || function (thisp) {
        var fn = this;
        return function () {
          return fn.apply(thisp, arguments);
        };
      };
    /* jshint freeze: true */

    var EV1 = 'testEv1', ENO = 'testEvNope', TARGET = 'lib/eventist';
    var mEm, em, ev, event, count, msg
      , noop = function () {
        };

    //
    //  The following three main test suites differ only in loading strategy.
    //
    describe('AMD', function () {

      beforeAll(function (done) {
        require([TARGET], function (module) {
          mEm = module;
          done();
        });
      });

      afterAll(function () {
        requirejs.undef(TARGET);
      });

      describeTests();
    });

    describe('WIN', function () {

      var d = define;

      beforeAll(function (done) {
        window.define = void 0;
        require([TARGET], function () {
          mEm = window.Eventist.factory;
          done();
        });
      });

      afterAll(function () {
        window.define = d;
        requirejs.undef(TARGET);
      });

      describeTests();
    });

    describe('NODE', function () {

      var d = define;

      beforeAll(function (done) {
        window.define = void 0;
        window.module = {exports: true};
        require([TARGET], function () {
          mEm = module.exports;
          done();
        });
      });

      afterAll(function () {
        window.define = d;
        window.module = void 0;
        requirejs.undef(TARGET);
      });

      describeTests();
    });

    // ****************************************************
    // Actual test code
    // ****************************************************

    function describeTests() {
      describe('Default initialization', function () {

        beforeEach(function () {
          (em = mEm()) && reset();
        });
        testBasicFunctionality();
      });

      describe('Multiple emitters', function () {
        var em1, c1;

        beforeEach(function () {
          (em = mEm()) && reset();
          (em1 = mEm()) && (c1 = 0);
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
    }

    function testBasicFunctionality() {
      testChecks();
      testOn();
      testOnce();
      testOff();
      testSend();
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
          }).toThrowError(TypeError);
        });
      it('once() should throw TypeError when event type not string',
        function () {
          expect(function () {
            em.once(this, listener);
          }).toThrowError(TypeError);
        });
      it('on() should throw TypeError when listener is not a function',
        function () {
          expect(function () {
            em.on(EV1, this);
          }).toThrowError(TypeError);
        });
      it('once() should throw TypeError when listener is not a function',
        function () {
          expect(function () {
            em.once(EV1);
          }).toThrowError(TypeError);
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

      it('should invoke handler', function (done) {

        em.once(EV1, function () {
          done();
        }).send(EV1);
      });

      it('callback should get async context', function (done) {

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
        window.onerror = function (message) {
          expect(message.split(' ').pop()).toBe('intended');
          done();
        };
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
      it('should work with duplicated listeners', function () {
        em.on(EV1, listener)      // normal listener
          .on(EV1, listener)      // normal listener
          .on(EV1, function () {  // special one returning non-undefined
            count += 1;
            return null;
          })
          .on(EV1, listener);     // normal listener (should never fire)
        expect(emit(EV1)).toBe(null);
        expect(count).toBe(3);
      });
    }
  }
);
