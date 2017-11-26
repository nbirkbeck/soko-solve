binary/soko-compiled.js: game.js
	closure-compiler --js_output_file=binary/soko-compiled.js *.js levels/*.js
