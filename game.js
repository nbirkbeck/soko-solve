goog.provide('soko.game');

goog.require('soko.Solver');
goog.require('soko.Level');
goog.require('soko.Heap');
goog.require('soko.constants');
goog.require('soko.levels.microa');
goog.require('soko.levels.microc');


goog.scope(function() {
var constants = soko.constants;

/**
 * @typedef {{name: string, levels: !Array.<!soko.Level>}}
 */
soko.LevelPack;


/**
 * Collections of levels (manually converted from android boxpusher game)
 * @type {!Array.<soko.LevelPack>}
 */
soko.levelpacks = [
  {"name": "microa", "levels": soko.levels.microa},
  {"name": "microc", "levels": soko.levels.microc}
];


/**
 * @constructor
 */
soko.Game = function() {
  this.levelPackIndex = 0;
  this.levelIndex = 0;
  this.solution = undefined;

  this.nameEl = document.getElementById('name');
  this.resultsEl = document.getElementById('results');
  this.allResultsEl = document.getElementById('results-all');
  this.heuristicsEl = document.getElementById('heuristics');

  var canvas = document.getElementById('canvas');
  this.context = canvas.getContext('2d');
  this.level = undefined;
  this.state = undefined;
  this.solvers = undefined;
  this.heuristics = undefined;
  this.solverIndex = 0;

  this.advanceLevel(0);

  document.getElementById('next').onclick = this.advanceLevel.bind(this, 1);
  document.getElementById('prev').onclick = this.advanceLevel.bind(this, -1);
  document.getElementById('solve').onclick = this.solve.bind(this, undefined);
  document.getElementById('solve-all').onclick = this.solveAll.bind(this);
  document.getElementById('move').onclick = this.move.bind(this);
  document.addEventListener('keypress', this.onKeyPress.bind(this), false);
};


soko.Game.prototype.updateHeuristicsScores = function() {
  var info = '';
  this.heuristics.forEach(function(heuristic) {
    info += heuristic[0] + ' ' + heuristic[1].evaluate(this.state) + '<br>';
  }.bind(this));
  this.heuristicsEl.innerHTML = info;
};


/**
 * Advance to the next level.
 * @param {number} offset the offset to add to current level.
 */
soko.Game.prototype.advanceLevel = function(offset) {
  var levelpacks = soko.levelpacks;
  this.levelIndex += offset;
  if (this.levelIndex < 0) {
    this.levelPackIndex = (this.levelPackIndex - 1 + levelpacks.length) % levelpacks.length;
    this.levelIndex = levelpacks[this.levelPackIndex].levels.length - 1;
  }

  if (this.levelIndex >= levelpacks[this.levelPackIndex].levels.length) {
    this.levelPackIndex = (this.levelPackIndex + 1) % levelpacks.length;
    this.levelIndex = 0;
  }
  this.nameEl.innerHTML = levelpacks[this.levelPackIndex].name + 
    ' level:' + this.levelIndex;
  this.level = new soko.Level(
    levelpacks[this.levelPackIndex].levels[this.levelIndex]);
  this.state = this.level.getInitialState();
  this.level.draw(this.state, this.context);
  this.solution = [];
  this.solvers = [];
  this.heuristics = [
    ['Simple', new soko.heuristic.SimpleHeuristic(this.level)],
    ['Better', new soko.heuristic.BetterHeuristic(this.level)],
    ['Abstract', new soko.heuristic.AbstractHeuristic(this.level)]
    //['Max', new soko.heuristic.MaxHeuristic(level)]
  ];
  this.resultsEl.innerHTML = '';
  this.updateHeuristicsScores();
};


/**
 * Some solvers can take some time on some levels. So run each one individually
 * using set timeout and queue the others after it is done so we can get some
 * quick hacky feedback
 */
soko.Game.prototype.solveSingle = function(finishedCallback) {
  if (this.solverIndex < this.solvers.length) {
    var solver = this.solvers[this.solverIndex];
    var solverSolution = solver[1].solve(this.level, this.state);
    if (this.solverIndex == 0) {
      this.solution = solverSolution;
      this.state = this.solution.pop();
    }
  }

  var results = '<table><thead><td>name</td><td>elapsed time</td>' +
	'<td>expanded</td><td>sol.length</td></thead>';
  this.solvers.forEach(function(solver) {
    results += '<tr><td>' + solver[0] + '</td><td>' + 
      solver[1].solverStats.elapsedTime + '</td><td>' + 
      solver[1].solverStats.nodesVisited + '</td><td>' +
      solver[1].solverStats.solutionLength + '</td></tr>';
  });
  results += '</table>';
  this.resultsEl.innerHTML = results;

  this.solverIndex++;
  if (this.solverIndex < this.solvers.length) {
    setTimeout(this.solveSingle.bind(this, finishedCallback), 1);
  } else if (finishedCallback) {
    finishedCallback();
  }
};


/**
 * Queue up all the solvers to run.
 */
soko.Game.prototype.solve = function(finishedCallback) {
  if (this.solution === undefined ||
      this.solution.length == 0) {
    this.solverIndex = 0;
    this.solvers = [
      ["abs+cond", new soko.Solver(soko.heuristic.AbstractHeuristic, soko.Heap, true)],
      ["abs", new soko.Solver(soko.heuristic.AbstractHeuristic, soko.Heap, false)],
      ["simple+cond", new soko.Solver(soko.heuristic.SimpleHeuristic, soko.Heap, true)],
      ["simple", new soko.Solver(soko.heuristic.SimpleHeuristic, soko.Heap)],
      // Ideally we could use a queue here, which has less overhead, but that would give min
      // number of box pushes (what box pusher uses) rather than min num moves.
      ["bfs+conde", new soko.Solver(soko.heuristic.NullHeuristic, soko.Heap, true)],
      ["bfs", new soko.Solver()]
    ];
    this.solveSingle(finishedCallback);
  }
};

soko.Game.prototype.solveAll = function() {
  var results = '';
  function solveFinished() {
    var line = '';
    if (results == '') {
      line = '<table><thead><tr>';
      this.solvers.forEach(function(solver) {
	line += '<td>' + solver[0] + '</td>';
      });
      line += '</tr></thead>';
    }
    line += '<tr>';
    this.solvers.forEach(function(solver) {
      line += '<td>' + solver[1].solverStats.elapsedTime + '</td>';
    });
    line += '</tr>';
    results += line;
    this.allResultsEl.innerHTML = results;

    this.advanceLevel(1);
    if (this.levelIndex > 0 || this.levelPackIndex > 0) {
      this.solve(solveFinished.bind(this));
    }
  };
  this.solve(solveFinished.bind(this));
};


soko.Game.prototype.move = function() {
  if (this.solution !== undefined && this.solution.length > 0) {
    this.state = this.solution.pop();
    this.updateHeuristicsScores();
    this.level.draw(this.state, this.context);
  }
};


soko.Game.prototype.onKeyPress = function(event) {
  var level = this.level;
  var code = event.keyCode || event.charCode;
  if (code == 49 || code == 50) {
    this.advanceLevel(code == 49 ? -1 : 1);
  }
  if (code == 119) {
    level.move(this.state, constants.Directions.UP);
  }
  if (code == 97) {
    level.move(this.state, constants.Directions.LEFT);
  }
  if (code == 100) {
    level.move(this.state, constants.Directions.RIGHT);
  }
  if (code == 115) {
    level.move(this.state, constants.Directions.DOWN);
  }
  if (code == 63) {  // ?
    // Show the invalid states for this level.
    var invalidMap = new soko.heuristic.InvalidMap(level);
    for (var y = 1; y < level.grid.length - 1; y++) {
      for (var x = 1; x < level.grid[y].length - 1; x++) {
	if (invalidMap.isInvalidPoint([x, y])) {
	  this.level.grid[y][x] |= 0x80;
	}
      }
    }
  }
  this.updateHeuristicsScores();
  this.level.draw(this.state, this.context);
};
});
