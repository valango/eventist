/**
 * Console app does nothing clever. Most of code below is actually suicidal.
 */

'use strict';

var bus = require('eventist')();
var emit = bus.emit;

var log = console.log.bind(console);

bus.emit = function () {
  var res = emit.apply(bus, arguments);
  log('EVENT:', Array.prototype.join.call(arguments, '::'), '-->', typeof res);
  return res;
};

bus
  .on('module.connected', function () {
    return true;
  })
  .once('module.quit', function (name) {
    bus.send('ui', 'say',
      ['Ewwww... you have killed my', name, '!!!  :,('].join(' '));
    var left = 9
      , die  = function () {
          if (left) {
            bus.send('ui', 'say',
              ['I\'ll die in', left, 'seconds...'].join(' '));
            left -= 3;
            setTimeout(die, 3000);
          } else {
            bus.send('ui', 'say', 'Good-bye, Cruel World!');
            bus.send('app', 'close', 'world!');
          }
        };
    die();
  })
  .on('app', function (cmd) {
    if (cmd === 'close') {
      log('Have a great day!');
      process.exit(0);
    }
  })
;

// Here we load functional modules

require('./ui-simple')(bus);
require('./decoder')(bus);
