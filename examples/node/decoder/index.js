/**
 * Decoder translates user input into some sort of application actions.
 *
 * @author Villem Alango <villem.alango@gmail.com>
 */

'use strict';

var bus;
var tolerance = 1;

var logics = function (command, a) {

  switch (command) {
    case 'help':
      bus.send('ui', 'say',
        'Available commands: clear, filter, help, log on, log off, hello, exit, quit');
      break;
    case 'clear':
      bus.send('ui', 'clear');
      break;
    case 'filter':
      bus.send('app', 'load.filter');
      return true;
    case 'hello':
      bus.send('ui', 'say', 'world!');
      break;
    case 'log':
    case 'log on':
      bus.send('app', 'log', 1);
      break;
    case 'log off':
      bus.send('app', 'log', 0);
      break;
    case 'exit':
    case 'quit':
      bus.send('app', 'close');
      break;
    default:
      if (tolerance) {
        bus.send('ui', 'say',
          ['I do not understand! Type "help" if you mind...', tolerance, 'try left.'].join(' '));
        --tolerance;
        bus.send('ui', 'prompt');
      } else {
        bus.off('user', logics);
        bus.send('module.quit', 'decoder');
        bus = void 0;
      }
      return;
  }
  tolerance = 1;
  bus.send('ui', 'prompt');
  return true;
};

var init = function (busInstance) {

  bus = busInstance;

  bus
    .on('user', logics)
    .send('module.connected', 'decoder');
};

module.exports = init;
