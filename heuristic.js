goog.provide('soko.heuristic');
goog.provide('soko.heuristic.NullHeuristic');
goog.provide('soko.heuristic.InvalidHeuristic');
goog.provide('soko.heurisitc.SimplelHeuristic');
goog.provide('soko.heurisitc.AbstractHeuristic');

goog.require('soko.math');
goog.require('soko.Heap');
goog.require('soko.constants');

goog.scope(function() {
var constants = soko.constants;



/**
 * Returns true if the state is invalid (e.g., block ends up in a state
 * where it is impossible to move it to a goal state.)
 * 
 * @param {!soko.Level} level
 * @param {!soko.State} state
 * @return {boolean}
 */
soko.heuristic.isInvalid = function(level, state) {
  for (var i = 0, numBoxes = state.boxes.length; i < numBoxes; ++i) {
    var box = state.boxes[i];
    if (level.getCellType(box) == constants.CellTypes.CROSS)
      continue;
    var upBlocked = level.getCellType([box[0], box[1] - 1]) < constants.CellTypes.EMPTY;
    var downBlocked = level.getCellType([box[0], box[1] + 1]) < constants.CellTypes.EMPTY;
    var leftBlocked = level.getCellType([box[0] - 1, box[1]]) < constants.CellTypes.EMPTY;
    var rightBlocked = level.getCellType([box[0] + 1, box[1]]) < constants.CellTypes.EMPTY;
    var sideBlocked = leftBlocked || rightBlocked;
    var topBlocked = upBlocked || downBlocked;
    if (upBlocked && sideBlocked) {
      return true;
    }
  }
  return false;
};


/**
 * @interface
 */
soko.heuristic.Heuristic = function() {};

/** 
 * @param {!soko.State} state
 * @return {number}
 */
soko.heuristic.Heuristic.prototype.evaluate = function(state) {};


/**
 * A null heuristic (doesn't give any estimate).
 * @param {!soko.Level=} opt_level
 * @implements {soko.heuristic.Heuristic}
 * @constructor
 */
soko.heuristic.NullHeuristic = function(opt_level) {};


/** @override */
soko.heuristic.NullHeuristic.prototype.evaluate = function(state) {
  return 0;
};



/**
 * An invalid heuristic (only gives high estimate to invalid states).
 * @param {!soko.Level} level
 * @implements {soko.heuristic.Heuristic}
 * @constructor
 */
soko.heuristic.InvalidHeuristic = function(level) {
  this.level = level;
};


/** @override */
soko.heuristic.InvalidHeuristic.prototype.evaluate = function(state) {
  if (soko.heuristic.isInvalid(this.level, state)) {
    return 1000;
  }
  return 0;
};


/**
 * A simple heuristic that uses manhattan distance.
 * @param {!soko.Level} level
 * @implements {soko.heuristic.Heuristic}
 * @constructor
 */
soko.heuristic.SimpleHeuristic = function(level) {
  this.level = level;
};
var SimpleHeuristic = soko.heuristic.SimpleHeuristic;


/** @override */
SimpleHeuristic.prototype.evaluate = function(state) {
  var value = 0;
  var boxDistance = 1000;
  var level = this.level;
  if (soko.heuristic.isInvalid(this.level, state)) {
    return 1000;
  }
  for (var i = 0, numBoxes = state.boxes.length; i < numBoxes; ++i) {
    var minDist = 1e10;
    var box = state.boxes[i];
    for (var j = 0, numCrosses = level.crosses.length; j < numCrosses; ++j) {
      minDist = Math.min(minDist, 
			 soko.math.vectorDistanceL1(level.crosses[j], box));
    }
    value += minDist;
    boxDistance = Math.min(soko.math.vectorDistanceL1(box, state.pos), 
			   boxDistance);
  }
  return value + boxDistance;
};


/**
 * An attempt to get a better heuristic.
 * @param {!soko.Level} level
 * @implements {soko.heuristic.Heuristic}
 * @constructor
 */
soko.heuristic.BetterHeuristic = function(level) {
  this.level = level;
};
var BetterHeuristic = soko.heuristic.BetterHeuristic;


/** @override */
BetterHeuristic.prototype.evaluate = function(state) {
  var numOptions = soko.math.factorial(state.boxes.length);
  var minValue = 1e10;
  
  if (soko.heuristic.isInvalid(this.level, state)) {
    return 1000;
  }
  
  /* This didn't help either...
  var distanceMaps = [];
  for (var i = 0; i < state.boxes.length; ++i) {
    var startState = new soko.State(state.boxes[i], []);
    distanceMaps.push(this.level.computeShortestPath(startState));
  }
   */

  for (var i = 0; i < numOptions; ++i) {
    var option = i;
    var taken = [];
    var dists = [];
    var value = 0;
    
    for (var j = 0; j < state.boxes.length; ++j) {
      var divisor = state.boxes.length - j - 1;
      var index = option % divisor;
      var k = 0;
      while (index > 0 || taken[k] === true) {
	if (taken[k] === true)
	  k++;
	else {
	  index--;
	  k++;
	}
      }
      var box = state.boxes[j];
      var dist = soko.math.vectorDistanceL1(this.level.crosses[k], box); 
      // var dist = distanceMaps[j][soko.State.hash(this.level.crosses[k])] - 1;
      option /= divisor;
      value += dist;
      taken[k] = true;
      dists[j] = dist;
    }
    dists = dists.sort();
    for (var k = 0; k < dists.length - 1; ++k) {
      value += dists[k];
    }
    if (value < minValue) {
      minValue = value;
    }
  }
  return minValue;
};


/**
 * A heuristic that abstracts out the problem and solves a simple problem.
 * @param {!soko.Level} level
 * @implements {soko.heuristic.Heuristic}
 * @constructor
 */
soko.heuristic.AbstractHeuristic = function(level) {
  this.level = level;
  this.abstractLevels = [];
  this.cache = {};
  var numBoxes = level.boxes.length;
  this.abstractionSize = 1; // numBoxes >= 4 ? 2 : 1;
  for (var i = 0; i < numBoxes; i += this.abstractionSize) {
    this.abstractLevels.push(level.createAbstraction(
      i, Math.min(numBoxes, i + this.abstractionSize)));
  }
  this.solver = new soko.Solver(soko.heuristic.SimpleHeuristic, soko.Heap);
};


/** @override */
soko.heuristic.AbstractHeuristic.prototype.evaluate = function(state) {
  var value = 0;
  for (var i = 0; i < this.abstractLevels.length; i++) {
    var start = this.abstractionSize * i;
    var end = Math.min(state.boxes.length, start + this.abstractionSize);
    var abstractState = state.createAbstraction(start, end);
    var id = abstractState.id();
    var thisValue = this.cache[id];
    if (thisValue === undefined) {
      var solution = this.solver.solve(this.abstractLevels[i], abstractState);
      thisValue = solution.length - 1;
      if (thisValue < 0) {
	thisValue = 10000;
      }
      this.cache[id] = thisValue;
      for (var j = 0; j < solution.length; j++) {
	this.cache[solution[j].id()] = j;
      }
    }
    value = Math.max(value, thisValue);
  }
  return value;
};
});


