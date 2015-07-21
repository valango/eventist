# Eventist examples

## Node examples

You'll need Node.js to run these. All \*.js files in 
[examples/node](node/) directory are application main files.

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
