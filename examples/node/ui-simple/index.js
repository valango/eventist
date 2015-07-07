/**
 * Simple UI receives translates user input and performs rudimentary
 * output functions.
 */

'use strict';

var name     = 'ui-simple'
  , bus
  , prompt   = 'OHAI'
  , readline = require('readline'),
    rl       = readline.createInterface(process.stdin, process.stdout);

var setPrompt = function (msg) {
  prompt = msg + '> ';
  rl.setPrompt(prompt);
};

var clear = function(){
  readline.cursorTo(process.stdout, 0, 0);
  readline.clearScreenDown(process.stdin);
};

var logics = function (cmd, a1) {
  switch (cmd) {

    case 'clear':
      clear();
      break;

    case 'say':
      console.log(a1);
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
  rl.prompt();


  rl.on('line', function (line) {
    var input = line.trim();

    bus.send('user', input);
    rl.prompt();
  }).on('close', function () {
    bus.off('ui', logics).emit('app', 'close');
  });

};

module.exports = init;
