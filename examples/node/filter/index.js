/**
 * Filter all invalid user inputs.
 *
 * @author Villem Alango <villem.alango@gmail.com>
 */

'use strict';

var bus, count = 0;

var logics = function (command) {

  switch (command) {
    case 'help':
    case 'clear':
    case 'filter':
    case 'hello':
    case 'log':
    case 'log on':
    case 'log off':
    case 'exit':
    case 'quit':
      return void 0;
  }
  if (--count <= 0) {
    bus.send('user', 'help');
    count = 5;
  }
  return true;
};

var init = function (busInstance) {

  bus = busInstance;

  bus
    .on('user', logics)
    .send('module.connected', 'filter')
    .send('ui', 'set.prompt', 'BABY');
};

module.exports = init;
