/**
 * Console app does nothing clever. Most of code below is actually suicidal.
 *
 * @author Villem Alango <villem.alango@gmail.com>
 */

'use strict';

var bus = require('eventist')();
var emit = bus.emit;

bus.emit = function () {
  emit.apply(bus, ['ui', 'log', Array.prototype.join.call(arguments, '::')]);
  return emit.apply(bus, arguments);
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
      bus.send('ui', 'say', 'Have a great day!');
      process.exit(0);
    }
  })
;

// Here we load functional modules

require('./ui-simple')(bus);
require('./decoder')(bus);
// Now we are good to go...
bus.send('ui', 'prompt');
