goog.provide('soko.game');

goog.require('soko.Solver');
goog.require('soko.Level');
goog.require('soko.Heap');
goog.require('soko.constants');
goog.require('soko.levels.microa');
goog.require('soko.levels.microc');

/**
 * Collections of levels (manually converted from android boxpusher game)
 */
var levelpacks = [
  {"name": "microa", "levels": soko.levels.microa},
  {"name": "microc", "levels": soko.levels.microc}
];


/**
 * This is a simple driver program.
 */
soko.game = function() {
  var levelPackIndex = 0;
  var levelIndex = 0;
  var solution;
  var constants = soko.constants;
  var nameEl = document.getElementById('name');
  var resultsEl = document.getElementById('results');
  var canvas = document.getElementById('canvas');
  var context = canvas.getContext('2d');
  var level;
  var state;
  var solvers;
  var solverIndex = 0;

  /**
   * Advance to the next level.
   * @param {number} offset the offset to add to current level.
   */
  function advanceLevel(offset) {
    levelIndex += offset;
    if (levelIndex < 0) {
      levelPackIndex = (levelPackIndex - 1 + levelpacks.length) % levelpacks.length;
      levelIndex = levelpacks[levelPackIndex].levels.length - 1;
    }
    if (levelIndex >= levelpacks[levelPackIndex].levels.length) {
      levelPackIndex = (levelPackIndex + 1) % levelpacks.length;
      levelIndex = 0;
    }
    nameEl.innerHTML = levelpacks[levelPackIndex].name + ' level:' + levelIndex;
    level = new soko.Level(levelpacks[levelPackIndex].levels[levelIndex]);
    state = level.getInitialState();
    level.draw(state, context);
    solution = [];
    solvers = [];
    resultsEl.innerHTML = '';
  }
  
  /**
   * Some solvers can take some time on some levels. So run each one individually
   * using set timeout and queue the others after it is done so we can get some
   * quick hacky feedback
   */
  function solveSingle() {
    if (solverIndex < solvers.length) {
      var solver = solvers[solverIndex];
      var solverSolution = solver[1].solve(level, state);
      if (solverIndex == 0) {
	solution = solverSolution;
	state = solution.pop();
      }
    }
    
    var results = '<table><thead><td>name</td><td>elapsed time</td><td>expanded</td><td>sol.length</td></thead>';
    solvers.forEach(function(solver) {
      results += '<tr><td>' + solver[0] + '</td><td>' + 
	solver[1].solverStats.elapsedTime + '</td><td>' + 
	solver[1].solverStats.nodesVisited + '</td><td>' +
        solver[1].solverStats.solutionLength + '</td></tr>';
    });
    results += '</table>';
    resultsEl.innerHTML = results;    

    solverIndex++;
    if (solverIndex < solvers.length) {
      setTimeout(solveSingle, 1);
    }
  }

  /**
   * Queue up all the solvers to run.
   */
  function solve() {
    setTimeout(solveSingle, 1);
    if (solution === undefined || solution.length == 0) {
      solverIndex = 0;
      solvers = [
	["abstract+condense", new soko.Solver(soko.heuristic.AbstractHeuristic, soko.Heap, true)],
	["abstract", new soko.Solver(soko.heuristic.AbstractHeuristic, soko.Heap, false)],
	["simpleheur+condense", new soko.Solver(soko.heuristic.SimpleHeuristic, soko.Heap, true)],
	["simpleheur", new soko.Solver(soko.heuristic.SimpleHeuristic, soko.Heap)],
	["bfs+condense", new soko.Solver(soko.heuristic.NullHeuristic, soko.Queue, true)],
	["bfs", new soko.Solver()]
      ];
      solveSingle();
    }
  };

  function move() {
    if (solution !== undefined && solution.length > 0) {
      state = solution.pop();
      level.draw(state, context);
    }
  }

  advanceLevel(0);

  document.getElementById('next').onclick = advanceLevel.bind(window, 1);
  document.getElementById('prev').onclick = advanceLevel.bind(window, -1);
  document.getElementById('solve').onclick = solve;
  document.getElementById('move').onclick = move;
    
  document.addEventListener('keypress', function(event) {
    var code = event.keyCode || event.charCode;
    if (code == 49 || code == 50) {
      advanceLevel(code == 49 ? -1 : 1);
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
    level.draw(state, context);
  }, false);
};

goog.exportSymbol("soko.game", soko.game);