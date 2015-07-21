/**
 * Decoder translates user input into some sort of application actions.
 *
 * @author Villem Alango <villem.alango@gmail.com>
 */

'use strict';

var bus;
var tolerance = 1;  // Crossing 0 threshold will start suicide sequence.
var retry = false;  // Flag preventing potential message translation deadlock.
var decode;

/**
 * Make a last attempt to handle unknown user input and succumb to depression
 * if that fails.
 *
 * @param {string} command
 */
var lastTry = function (command) {

  var res = !retry && bus.emit('app', 'bad-user', command);

  if (res !== void 0) { // Take a chance with translated value.
    res && (retry = true) && bus.send('user', res);
  } else if (tolerance) {
    bus.send('ui', 'say',
      ['I do not understand! Type "help", if you mind...',
        tolerance, 'try is left.'].join(' '));
    --tolerance;
    bus.send('ui', 'prompt');
  } else {              // Module suicide - letting the whole world to know.
    bus.off('user', decode);
    bus.send('module.quit', 'decoder');
    bus = void 0;
  }
};

//  Handle the 'user' events and return true to indicate it's done.
/* jshint maxcomplexity:12 */
decode = function (command) {

  command = command.trim();

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
      return true;  //  Avoid an extra prompt.

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

    case '':
      break;

    default:
      return lastTry(command);
  }
  retry = false;  // Here after successful processing -
  tolerance = 1;  // reset the doom counter.
  bus.send('ui', 'prompt');
  return true;
};

var init = function (busInstance) {

  (bus = busInstance)
    .on('user', decode)
    .send('module.connected', 'decoder');
};

module.exports = init;
