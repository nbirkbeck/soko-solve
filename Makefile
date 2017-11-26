SOURCES := $(wildcard *.js levels/*.js)
binary/soko-compiled.js: $(SOURCES)
	closure-compiler --js_output_file=binary/soko-compiled.js $(SOURCES)
