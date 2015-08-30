goog.provide('soko.Solver');

goog.require('soko.Heap');
goog.require('soko.Level');
goog.require('soko.State');
goog.require('soko.Queue');
goog.require('soko.heuristic.NullHeuristic');

goog.scope(function() {
  
/**
 * Statistics pulled from the solver.
 * 
 * @typedef {{
 *   nodesVisited: (number|string),
 *   finalQueueSize: (number|string),
 *   elapsedTime: (number|string),
 *   solutionLength: (number|string)
 * }}
 */
soko.SolverStats;


/**
 * A node with extra information used in the search tree. Keeps
 * track of distance travelled so far (g), heuristic value (h),
 * an optional location of the pusher (for condensed representation),
 * the state, and a parent.
 * 
 * @typedef {{
 *   f: (undefined|number),
 *   g: number,
 *   h: number,
 *   pusher: soko.types.GridPoint,
 *   id: soko.StateId,
 *   state: !soko.State,
 *   parent: soko.SolverNode
 * }}
 */
soko.SolverNode;


/**
 * @param {function (new:soko.heuristic.Heuristic, !soko.Level)=} opt_heuristic heuristicType
 * @param {function (new:soko.HeapInterface)=} opt_heapType heap type
 * @param {boolean=} opt_condensed whether to use condensed moves
 * @constructor
 */
soko.Solver = function(opt_heuristic, opt_heapType, opt_condensed) {
  /** @private {function (new:soko.heuristic.Heuristic, !soko.Level)} */
  this.heuristicType_ = opt_heuristic || soko.heuristic.NullHeuristic;
  /** @private {function (new:soko.HeapInterface)} */
  this.heapType_ = opt_heapType || soko.Queue;
  /** @private {boolean} */
  this.condensed_ = opt_condensed || false;
  /** @type {boolean} */
  this.print = false;
  /** @type {soko.SolverStats} */
  this.solverStats = {'elapsedTime': '', 'solutionLength': '', 'finalQueueSize': '', 'nodesVisited': ''};
};
var Solver = soko.Solver;


/**
 * @param {!soko.Level} level
 * @param {!soko.State} state
 * @return {!Array.<soko.State>}
 */
Solver.prototype.solve = function(level, state) {
  var solution = [];
  var startTime = Date.now();
  var heuristic = new this.heuristicType_(level);
  var node = {
    'state': state,
    'g': 0,
    'h': heuristic.evaluate(state),
    'parent': null,
    'id': state.id()
  };
  var Q = new this.heapType_();
  var numVisited = 0;
  var visited = {};
  var getNeighbors = level.getNeighbors.bind(level);
  var invalidMap = new soko.heuristic.InvalidMap(level);
  if (this.condensed_) {
    getNeighbors = level.getNeighborsCondensed.bind(level);
  }
  Q.push(node, node.h);
  
  while (!Q.empty()) {
    var top = Q.pop();
    node = top.value;
    if (this.print && numVisited % 5000 == 0) {
      console.log(top.score + ' ' + numVisited + ' ' + Q.size());
    }
    if (numVisited % 20000 == 0) {
      var elapsedTime = (Date.now() - startTime) / 1000.0;
      if (elapsedTime > 60) break;
    }
    
    visited[node.id] = true;
    numVisited++;
    
    if (level.isGoal(node.state)) {
      solution = this.backtrack_(level, node);
      break;
    }
    var neighbors = getNeighbors(node.state);
    for (var i = 0, length = neighbors.length; i < length; ++i) {
      var id = neighbors[i][1].id();
      if (visited[id]) continue;
      // This is a very important pruning step for the BFS and heuristics
      // that were not finding invalid states.
      if (invalidMap.isInvalid(neighbors[i][1])) continue;

      var neighState = /** @type {!soko.State} */(neighbors[i][1]);
      var g = node.g + /** @type {number} */(neighbors[i][0]);
      var h = heuristic.evaluate(neighState);
      var f = g + h;
      var child = {
	'state': neighState,
	'pusher': neighbors[i][2],
	'g': g,
	'h': h,
	'parent': node,
	'id': id
      };
      if (Q.exists(child)) {
	Q.updateIfBetter(child, f);
      } else {
	Q.push(child, f);
      }
    }
  }
  
  var duration = (Date.now() - startTime) / 1000.0;
  if (this.print) console.log('numVisited:' + numVisited + ' duration:' + duration);
  this.solverStats = {
    'solutionLength': solution.length,
    'elapsedTime': duration,
    'finalQueueSize': Q.size(),
    'nodesVisited': numVisited
  }; 
  return solution;
};


/** @private */
Solver.prototype.backtrack_ = function(level, node) {
  var solution = [];
  if (this.print) {
    console.log(node);
  }
  do {
    var parent = node.parent;
    if (parent != null && node.pusher) {
      var path = level.computeShortestPath(parent.state, node.pusher);
      solution.push(node.state);
      for (var i = 0; i < path.length - 1; i++) {
	var state = new soko.State(path[i], parent.state.boxes);
	solution.push(state);
      }
    } else {
      solution.push(node.state);
    }
    node = node.parent;
  } while (node != null);
  
  if (this.print) {
    console.log(solution.length);
  }
  return solution;
};
});