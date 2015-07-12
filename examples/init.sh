#!/bin/bash
echo "Initializing ./examples dubdirectory ..." 

if [ ! -d examples/node/node_modules ]; then
  mkdir examples/node/node_modules
fi
if [ ! -d examples/node/node_modules/eventist ]; then
  mkdir examples/node/node_modules/eventist
fi
cp p*.json examples/node/node_modules/eventist
cp -R lib examples/node/node_modules/eventist

echo "DONE!"