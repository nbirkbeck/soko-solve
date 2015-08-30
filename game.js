goog.provide('soko.game');

goog.require('soko.Solver');
goog.require('soko.Level');
goog.require('soko.Heap');
goog.require('soko.constants');
goog.require('soko.levels.microa');
goog.require('soko.levels.microc');


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
  '    ###### \n'
];


/** @export */
soko.game = function() {
  var solution;
  var constants = soko.constants;
  var canvas = document.getElementById('canvas');
  var context = canvas.getContext('2d');
  var index = soko.levels.microc.length - 1;
  var level = new soko.Level(soko.levels.microc[index]);
  var state = level.getInitialState();
  level.draw(state, context);
  
  document.addEventListener('keypress', function(event) {
    var code = event.keyCode || event.charCode;
    console.log(code);
    if (code == 49 || code == 50) {
      if (code == 49) index--;
      else index++;
      level = new soko.Level(soko.levels.microc[index]);
      state = level.getInitialState();
      level.draw(state, context);
      solution = [];
    }
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
      if (solution === undefined || solution.length == 0) {
	var solvers = [
	  new soko.Solver(soko.heuristic.AbstractHeuristic, soko.Heap, false),
	  new soko.Solver(soko.heuristic.AbstractHeuristic, soko.Heap, true),
//	  new soko.Solver(),
//	  new soko.Solver(soko.heuristic.NullHeuristic, soko.Queue, true),
	  new soko.Solver(soko.heuristic.SimpleHeuristic, soko.Heap),
	  new soko.Solver(soko.heuristic.SimpleHeuristic, soko.Heap, true)
	];
	solvers.forEach(function(solver) {
	  // solver.print = true;
          solution = solver.solve(level, state);
	  console.log(solver.solverStats);
	});
        state = solution.pop();
      } else if (solution.length) {
        state = solution.pop();
      }
    }
    level.draw(state, context);
  }, false);
};

goog.exportSymbol("soko.game", soko.game);