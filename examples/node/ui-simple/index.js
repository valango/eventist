/**
 * Simple UI receives translates user input and performs rudimentary
 * output functions.
 *
 * @author Villem Alango <villem.alango@gmail.com>
*/

'use strict';

var B = '\u001B[34m'; // blue
var G = '\u001B[32m'; // green
var M = '\u001B[35m'; // magenta
var R = '\u001B[39m'; // reset
var name     = 'ui-simple'
  , bus
  , prompt   = 'OHAI'
  , readline = require('readline'),
    rl       = readline.createInterface(process.stdin, process.stdout);

var setPrompt = function (msg) {
  prompt = G + msg + '> ';
  rl.setPrompt(prompt);
};

var clear = function () {
  readline.cursorTo(process.stdout, 0, 0);
  readline.clearScreenDown(process.stdin);
};

var logics = function (cmd, a1) {
  switch (cmd) {

    case 'clear':
      clear();
      break;

    case 'say':
      console.log(M + a1 + R);
      break;

    case 'log':
      console.log(B + 'LOG: ' + a1 + R);
      break;

    case 'set.prompt':
      setPrompt(a1);
      break;

    case 'prompt':
      rl.prompt();
      break;

    default:
      return;
  }
  return true;
};

var init = function (busInstance) {

  bus = busInstance;

  bus
    .on('ui', logics)
    .send('module.connected', name);

  clear();
  setPrompt('OHAI');

  rl.on('line', function (line) {
    var input = line.trim();

    bus.send('user', input);
  }).on('close', function () {
    bus.off('ui', logics).emit('app', 'close');
  });

};

module.exports = init;
