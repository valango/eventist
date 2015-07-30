/**
 * console.js
 *
 * This app does nothing clever, but it illustrates some basic patterns
 * of event-driven design.
 *
 * @author Villem Alango <villem.alango@gmail.com>
 */

'use strict';

// Event bus is the only connection between functional modules.
var bus = require('../../lib/eventist')();
var emit = bus.emit;
var logging = true;
var pendingInput = null;

//  Override the original method for logging purposes.
bus.emit = function () {
  logging &&
  emit.apply(bus, ['ui', 'log', Array.prototype.join.call(arguments, '::')]);

  return emit.apply(bus, arguments);
};

/*
 Application logic:
 - maintaining dynamic configuration and connections between modules;
 - implementing some functions of existential significance.
 */
bus
  .on('module.connected', function (name) {
    if (name === 'decoder') {
      bus.send('user', pendingInput);
    }
    return true;
  })
  .once('module.quit', function (name) {
    // Make a dramatic farewell during committing seppuku.
    bus.send('ui', 'say',
      ['Ewwww... you have killed my', name, '!!!  :,('].join(' '));
    var left = 9
      , die  = function () {  // ... doing it loud and slowly.
          if (left) {
            bus.send('ui', 'say',
              ['I\'ll die in', left, 'seconds...'].join(' '));
            left -= 3;
            setTimeout(die, 3000);
          } else {
            bus.send('ui', 'say', 'Good-bye, Cruel World!');
            bus.send('app', 'close');
          }
        };
    die();
  })
  //  Here we simulate the lazy loading scenario.
  .once('user', function (input) {
    bus.send('ui', 'say', 'Did you say "' + (pendingInput = input) + '"?');
    bus.send('ui', 'say', 'Just a second - the interpreter is being loaded...');
    setTimeout(function () {
      require('./decoder')(bus);
    }, 1000);
  })
  //  Some application-level events are handled here.
  .on('app', function (cmd, a) {
    switch (cmd) {
      case 'close':
        bus.send('ui', 'say', 'Have a great day!');
        process.exit(0);
        break;  // Just to keep jshint happy.

      case 'load.filter':
        bus.send('ui', 'say', 'loading safety filter...');
        require('./filter')(bus);
        bus.send('ui', 'prompt');
        break;

      case 'log':
        logging = !!a;
        break;

      default:
        return void 0;
    }
    return true;
  });

// Load functional modules
require('./ui-simple')(bus);
// And now we are good to go...
bus.send('ui', 'prompt');
