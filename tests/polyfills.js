/**
 * tests/polyfills.js
 *
 * @author Villem Alango <villem.alango@gmail.com>
 * @created 31.10.15 15:55
 * @license http://opensource.org/licenses/MIT
 */

(function() {

  'use strict';

  /* eslint no-extend-native:0 */

  if (navigator && navigator.userAgent.indexOf('PhantomJS/') >= 0) {
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
  }
})();
