goog.provide('soko.game');

goog.require('soko.Solver');
goog.require('soko.Level');
goog.require('soko.Heap');
goog.require('soko.constants');

var LEVELS = [
  '    #####   \n' + 
    '    #   #   \n' +
    ' ####   #   \n' +
    ' # xx b #   \n' +
    ' #   b  #   \n' +
    ' #   *  #   \n' +
    ' ########   \n',
  '####   \n' +
    '#  ### \n' +
    '# bb # \n' +
    '#xxx # \n' + 
    '# *b # \n' +
    '#   ## \n' +
    '##### \n',
  '####   \n' +
    '#x ## \n' +
    '#x  # \n' +
    '#x *# \n' + 
    '##bb### \n' +
    ' # b  # \n' +
    ' #    # \n' +
    ' #  ### \n' +
    ' ####   \n', 
  ' ####### \n' +
    '## xxxx# \n' + 
    '#   ###### \n' +
    '#   b b *# \n' +
    '###  b b # \n' +
    '  ###    # \n' +
    '    ###### \n',
  '######  \n' + 
    '#    ##  \n' +
    '# b b ## \n' + 
    '## bb  # \n' +
    ' # #   # \n' +
    ' # ## ## \n' +
    ' #  x x# \n' +
    ' # *x x# \n' +
    ' #  #### \n' +
    ' ####    \n'
];

/** @export */
soko.game = function() {
  var solution;
  var constants = soko.constants;
  var canvas = document.getElementById('canvas');
  var context = canvas.getContext('2d');
  var level = new soko.Level(LEVELS[4]);
  var state = level.getInitialState();
  level.draw(state, context);
  
  document.addEventListener('keypress', function(event) {
    var code = event.keyCode || event.charCode;
    if (code == 119) {
      level.move(state, constants.Directions.UP);
    }
    if (code == 97) {
      level.move(state, constants.Directions.LEFT);
    }
    if (code == 100) {
      level.move(state, constants.Directions.RIGHT);
    }
    if (code == 115) {
      level.move(state, constants.Directions.DOWN);
    }
    if (code == 32) {
      if (solution === undefined) {
	var solver = new soko.Solver(soko.heuristic.AbstractHeuristic, soko.Heap, true);
	solver.print = true;
        solution = solver.solve(level, state);

	solver = new soko.Solver();
	solver.print = true;
        solution = solver.solve(level, state);

	solver = new soko.Solver(soko.heuristic.SimpleHeuristic, soko.Heap);
	solver.print = true;
        solution = solver.solve(level, state);

	solver = new soko.Solver(soko.heuristic.SimpleHeuristic, soko.Heap, true);
	solver.print = true;
        solution = solver.solve(level, state);

        state = solution.pop();
      } else if (solution.length) {
        state = solution.pop();
      }
    }
    level.draw(state, context);
  }, false);
};

goog.exportSymbol("soko.game", soko.game);