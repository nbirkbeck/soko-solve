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
  var allResultsEl = document.getElementById('results-all');
  var heuristicsEl = document.getElementById('heuristics');
  var canvas = document.getElementById('canvas');
  var context = canvas.getContext('2d');
  var level;
  var state;
  var solvers;
  var heuristics;
  var solverIndex = 0;

  function updateHeuristicsScores() {
    var info = '';
    heuristics.forEach(function(heuristic) {
      info += heuristic[0] + ' ' + heuristic[1].evaluate(state) + '<br>';
    });
    heuristicsEl.innerHTML = info;
  }

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
    heuristics = [
      ['Simple', new soko.heuristic.SimpleHeuristic(level)],
      ['Better', new soko.heuristic.BetterHeuristic(level)],
      ['Abstract', new soko.heuristic.AbstractHeuristic(level)]
      //['Max', new soko.heuristic.MaxHeuristic(level)]
    ];
    resultsEl.innerHTML = '';
    updateHeuristicsScores();
  }
  
  /**
   * Some solvers can take some time on some levels. So run each one individually
   * using set timeout and queue the others after it is done so we can get some
   * quick hacky feedback
   */
  function solveSingle(finishedCallback) {
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
      setTimeout(solveSingle.bind(this, finishedCallback), 1);
    } else if (finishedCallback) {
      finishedCallback();
    }
  }

  /**
   * Queue up all the solvers to run.
   */
  function solve(finishedCallback) {
    if (solution === undefined || solution.length == 0) {
      solverIndex = 0;
      solvers = [
	["abs+cond", new soko.Solver(soko.heuristic.AbstractHeuristic, soko.Heap, true)],
	["abs", new soko.Solver(soko.heuristic.AbstractHeuristic, soko.Heap, false)],
	["simple+cond", new soko.Solver(soko.heuristic.SimpleHeuristic, soko.Heap, true)],
	["simple", new soko.Solver(soko.heuristic.SimpleHeuristic, soko.Heap)],
	// Ideally we could use a queue here, which has less overhead, but that would give min
	// number of box pushes (what box pusher uses) rather than min num moves.
	["bfs+conde", new soko.Solver(soko.heuristic.NullHeuristic, soko.Heap, true)],
	["bfs", new soko.Solver()]
      ];
      solveSingle(finishedCallback);
    }
  };

  function solveAll() {
    var results = '';
    function solveFinished() {
      var line = '';
      if (results == '') {
	line = '<table><thead><tr>';
	solvers.forEach(function(solver) {
	  line += '<td>' + solver[0] + '</td>';
	});
	line += '</tr></thead>';
      }
      line += '<tr>';
      solvers.forEach(function(solver) {
	line += '<td>' + solver[1].solverStats.elapsedTime + '</td>';
      });
      line += '</tr>';
      results += line;
      allResultsEl.innerHTML = results;

      advanceLevel(1);
      if (levelIndex > 0 || levelPackIndex > 0) {
	solve(solveFinished);
      }
    };
    solve(solveFinished);
  }

  function move() {
    if (solution !== undefined && solution.length > 0) {
      state = solution.pop();
      updateHeuristicsScores();
      level.draw(state, context);
    }
  }

  advanceLevel(0);

  document.getElementById('next').onclick = advanceLevel.bind(window, 1);
  document.getElementById('prev').onclick = advanceLevel.bind(window, -1);
  document.getElementById('solve').onclick = function() { solve(undefined); };
  document.getElementById('solve-all').onclick = solveAll;
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
    if (code == 63) {  // ?
      // Show the invalid states for this level.
      var invalid = new soko.heuristic.InvalidMap(level);
      for (var y = 1; y < level.grid.length - 1; y++) {
	for (var x = 1; x < level.grid[y].length - 1; x++) {
	  if (invalid.isInvalidPoint([x, y])) {
	    level.grid[y][x] |= 0x80;
	  }
	}
      }
    }
    updateHeuristicsScores();
    level.draw(state, context);
  }, false);
};

goog.exportSymbol("soko.game", soko.game);