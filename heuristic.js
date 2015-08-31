goog.provide('soko.heuristic');
goog.provide('soko.heuristic.InvalidMap');
goog.provide('soko.heuristic.NullHeuristic');
goog.provide('soko.heurisitc.SimplelHeuristic');
goog.provide('soko.heurisitc.AbstractHeuristic');

goog.require('soko.math');
goog.require('soko.Heap');
goog.require('soko.constants');

goog.scope(function() {
var constants = soko.constants;


/**
 * A very large score, basically inf. No valid heuristic value (or number 
 * of moves should be this large)
 * @const {number}
 */
soko.heuristic.MAX_SCORE = 10000;


/**
 * Constructs a mapping from a point to whether a block at that point
 * would be an invalid state. This could be used in a heuristic, but
 * is more general purpose and can be used in the search itself to 
 * prune out invalid states.
 * 
 * @param {!soko.Level} level
 * @constructor
 */
soko.heuristic.InvalidMap = function(level) {
  this.map_ = {};
  for (var i = 1; i < level.grid.length - 1; ++i) {
    for (var j = 1; j < level.grid[i].length - 1; ++j) {
      var box = [j, i];
      var cellType = level.getCellType(box);
      if (cellType == constants.CellTypes.CROSS || 
	  cellType == constants.CellTypes.WALL)
	continue;
      var id = soko.State.pointToIndex(box);
      var upBlocked = level.getCellType([box[0], box[1] - 1]) == constants.CellTypes.WALL;
      var downBlocked = level.getCellType([box[0], box[1] + 1]) == constants.CellTypes.WALL;
      var leftBlocked = level.getCellType([box[0] - 1, box[1]]) == constants.CellTypes.WALL;
      var rightBlocked = level.getCellType([box[0] + 1, box[1]]) == constants.CellTypes.WALL;
      if ((leftBlocked || rightBlocked) && (upBlocked || downBlocked)) {
	this.map_[id] = true;
      }
      // Handle the cases:
      // #   #  ######
      // #####  #    #
      if ((upBlocked || downBlocked) && leftBlocked) {
	this.tryMarkLine_(level, box, 0, [0, upBlocked ? -1 : 1]);
      }
      // Handle the cases:
      // ##  ##  
      // #    #
      // #    #
      // #    #
      // ##  ##
      if ((rightBlocked || leftBlocked) && upBlocked) {
	this.tryMarkLine_(level, box, 1, [leftBlocked ? -1 : 1, 0]);
      }
    }
  }
};

soko.heuristic.InvalidMap.prototype.tryMarkLine_ = function(level, pos, dir, blockOffset) {
  var end = dir == 0 ? level.grid[pos[1]].length - 1 : level.grid.length - 1;
  var cur = [pos[0], pos[1]];
  for (var k = pos[dir] + 1; k < end; ++k) {
    cur[dir] = k;
    var curType = level.getCellType(cur);
    if (curType == constants.CellTypes.WALL) {
      end = k;
      break;
    }
    var blockPos = soko.math.vectorAdd(cur, blockOffset);
    var neighFree = level.getCellType(blockPos) >= constants.CellTypes.EMPTY;
    if ((curType == constants.CellTypes.CROSS) || neighFree) {
      return;
    }
  }
  var cur = [pos[0], pos[1]];
  for (var k = pos[dir] + 1; k < end; ++k) {
    cur[dir] = k;
    this.map_[soko.State.pointToIndex(cur)] = true;
  }
};

soko.heuristic.InvalidMap.prototype.isInvalid = function(state) {
  for (var i = 0; i < state.boxes.length; ++i) {
    if (this.isInvalidPoint(state.boxes[i]))
      return true;
  }
  return false;
};


soko.heuristic.InvalidMap.prototype.isInvalidPoint = function(point) {
  return this.map_[soko.State.pointToIndex(point)];
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
 * A simple heuristic that uses manhattan distance.
 * @param {!soko.Level} level
 * @implements {soko.heuristic.Heuristic}
 * @constructor
 */
soko.heuristic.SimpleHeuristic = function(level) {
  this.level_ = level;
  this.invalidMap_ = new soko.heuristic.InvalidMap(level);
};
var SimpleHeuristic = soko.heuristic.SimpleHeuristic;


/** @override */
SimpleHeuristic.prototype.evaluate = function(state) {
  var value = 0;
  var boxDistance = soko.heuristic.MAX_SCORE;
  var level = this.level_;
  // Used to use the invalid map as a heuristic.
  //if (this.invalidMap_.isInvalid(state))
  //  return soko.heuristic.MAX_SCORE;
  for (var i = 0; i < state.boxes.length; ++i) {
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
  return value + Math.max(0, boxDistance - 1);
};


/**
 * An attempt to get a better heuristic.
 * @param {!soko.Level} level
 * @implements {soko.heuristic.Heuristic}
 * @constructor
 */
soko.heuristic.BetterHeuristic = function(level) {
  this.level = level;
  this.invalidMap_ = new soko.heuristic.InvalidMap(level);
};
var BetterHeuristic = soko.heuristic.BetterHeuristic;


/** @override */
BetterHeuristic.prototype.evaluate = function(state) {
  if (state.boxes.length > 4) {
    return 0;
  }
  var numOptions = soko.math.factorial(state.boxes.length);
  var minValue = 1e10;
  
  if (this.invalidMap_.isInvalid(state)) {
    return soko.heuristic.MAX_SCORE;
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
      var divisor = state.boxes.length - j;
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
      // var dist = distanceMaps[j][soko.State.pointToIndex(this.level.crosses[k])] - 1;
      option = Math.floor(option / divisor);
      value += dist;
      taken[k] = true;
      dists[j] = dist;
    }
    dists = dists.sort();
    for (var k = 0; k < dists.length - 1; ++k) {
      value += dists[k];
    }
    minValue = Math.min(value, minValue);
  }

  var boxDistance = soko.heuristic.MAX_SCORE;
  for (var i = 0; i < state.boxes.length; ++i) {
    boxDistance = Math.min(
      soko.math.vectorDistanceL1(state.boxes[i], state.pos), boxDistance);
  }
  return minValue + Math.max(0, boxDistance - 1);
};


/**
 * A heuristic that abstracts out the problem and solves a simple problem.
 * @param {!soko.Level} level
 * @param {number=} opt_abstractionSize=} 
 * @implements {soko.heuristic.Heuristic}
 * @constructor
 */
soko.heuristic.AbstractHeuristic = function(level, opt_abstractionSize) {
  /** @private {!soko.Level} */
  this.level_ = level;
  /** @private {!Array.<!soko.Level>} */
  this.abstractLevels_ = [];
  /** @private {!Object} */
  this.cache_ = {};
  /** @private {number} */
  this.abstractionSize_ = opt_abstractionSize || 1;
  for (var i = 0; i < level.boxes.length; i += this.abstractionSize_) {
    this.abstractLevels_.push(level.createAbstraction(
      i, Math.min(level.boxes.length, i + this.abstractionSize_)));
  }
  // If you wanted to do this recursively (with a bigger abs size), 
  // you can change the code above to choose abstraction size based on num
  // boxes.
  if (this.abstractionSize_ == 1) {
    this.solver_ = new soko.Solver(soko.heuristic.SimpleHeuristic, soko.Heap);
  } else {
    this.solver_ = new soko.Solver(soko.heuristic.AbstractHeuristic, soko.Heap);
  }
};


/** @override */
soko.heuristic.AbstractHeuristic.prototype.evaluate = function(state) {
  var value = 0;
  for (var i = 0; i < this.abstractLevels_.length; i++) {
    var startIndex = this.abstractionSize_ * i;
    var endIndex = Math.min(state.boxes.length, startIndex + this.abstractionSize_);
    var abstractState = state.createAbstraction(startIndex, endIndex);
    var id = abstractState.id();
    var thisValue = this.cache_[id];
    if (thisValue === undefined) {
      var solution = this.solver_.solve(this.abstractLevels_[i], abstractState);
      thisValue = solution.length - 1;
      // If solution is empty, it is an unreachable state.
      if (thisValue < 0) {
	thisValue = soko.heuristic.MAX_SCORE;
      }
      this.cache_[id] = thisValue;
      for (var j = 0; j < solution.length; j++) {
	this.cache_[solution[j].id()] = j;
      }
    }
    value = Math.max(value, thisValue);
  }
  return value;
};


/**
 * @param {!soko.Level} level
 * @implements {soko.heuristic.Heuristic}
 * @constructor
 */
soko.heuristic.MaxHeuristic = function(level) {
  this.heuristics_ = [
    new soko.heuristic.AbstractHeuristic(level),
    new soko.heuristic.AbstractHeuristic(level, 2),
    new soko.heuristic.BetterHeuristic(level),
    new soko.heuristic.SimpleHeuristic(level)
  ];
};


/** @override */
soko.heuristic.MaxHeuristic.prototype.evaluate = function(state) {
  var maxValue = 0;
  this.heuristics_.forEach(function (h) {
    maxValue = Math.max(h.evaluate(state), maxValue);
  });
  return maxValue;
};
});


