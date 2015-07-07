/**
 * Decoder translates user input into some sort of application actions.
 */

'use strict';

var bus;
var tolerance = 1;

var logics = function(command){

  switch(command) {
    case 'clear':
      bus.send('ui', 'clear');
      break;
    case 'hello':
      bus.send('ui', 'say', 'world!');
      break;
    case 'exit':
    case 'quit':
      bus.send('app', 'close');
      break;
    default:
      if(tolerance){
        console.log('I do not understand...', tolerance, 'try left.');
        --tolerance;
      }else{
        bus.off('user', logics);
        bus.send('module.quit', 'decoder');
        bus = void 0;
      }
      return;
  }
  tolerance = 1;
  return true;
};

var init = function(busInstance){

  bus = busInstance;

  bus
    .on('user', logics)
    .send('module.connected', 'decoder');
};

module.exports = init;
