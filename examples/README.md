# Eventist examples

## Node examples

**NB:** To run the examples, you'll need [Node.js](https://nodejs.org/)
to be installed globally!

All \*.js files in 
[examples/node](node/) directory are application main files.

To run the example from current directory, use terminal command:
```
 > node node/terminal
```

### console
Shows how to use event system to loosely couple application modules and
achieve encapsulation. Each module knows only it's own domain plus *eventist*
API. The decoder (command interpreter) module is loaded after the first
user input, simulataing a lazy loading scenario.

The available user commands are:
  * `hello` - the app will respond politely;
  * `help` - gusess what;
  * `clear` - clears the screen;
  * `exit` or `quit` - do the obvious thing;
  * `log off` - turns message logging off;
  * `log on` - ... back again;
  * `filter` - activate user input filtering so the interpreter will not get angry;
  * `filter off` - will disable user input filtering.
  
Two illegal commands in a row will put the app into suicidal mode.
