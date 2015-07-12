/**
 * Filter all invalid user inputs.
 *
 * @author Villem Alango <villem.alango@gmail.com>
 */

'use strict';

var bus, count = 0;

/*
 Event app/bad-user/command is emitted by decoder on unknown command.
 Replacement to this command can be sent as a return value.
 */
var translate = function (command) {

  if (command === 'bad-user') {
    if (--count <= 0) {   // Provide help, but not too often.
      count = 5;
      return 'help';
    }
    bus.send('ui', 'prompt');
    return null;          // User input will be ignored.
  }
};

/*
 Because being registered after original decoder, this handler receives
 user input before the original one and can effectively filter/translate
 everything.
 */
var decode = function (command) {
  if (command === 'help') {       // Eat 'help' command...
    if (count !== 5) {            // except when it was sent by ourselves.
      bus.send('ui', 'prompt');
      return true;  // Just disable it
    }
  } else if (command === 'filter off') {  // Process special command here.
    bus.send('ui', 'say', 'disbling safety filter...')
      .off('app', translate).off('user', decode)
      .send('ui', 'set.prompt', 'OHAY').send('ui', 'prompt');
    return true;
  }
  // Returning undefined value here allows the original decoder to be invoked.
};

var init = function (busInstance) {

  (bus = busInstance)
    .on('app', translate)
    .on('user', decode)
    .send('module.connected', 'filter')
    .send('ui', 'set.prompt', 'BABY');
};

module.exports = init;
