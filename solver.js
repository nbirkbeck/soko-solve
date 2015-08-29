goog.provide('push.Solver');

goog.require('push.Level');
goog.require('push.State');
goog.require('push.Queue');
goog.require('push.heuristic.NullHeuristic');

goog.scope(function() {
  
  
/**
 * @constructor
 */
push.Solver = function(opt_heuristicType, opt_heapType, opt_advanced) {
  this.heuristicType = opt_heuristicType || push.heuristic.NullHeuristic;
  this.heapType = opt_heapType || push.Queue;
  this.advanced = opt_advanced || false;
  this.print = false;
};
var Solver = push.Solver;


/**
 * @param {!push.Level}
 * @param {!push.State}
 * @return {!push.types.GridPosArray}
 */
Solver.prototype.solve = function(level, state) {
  var solution = [];
  var startTime = Date.now();
  var heuristic = new this.heuristicType(level);
  var info = {
    'state': state,
    'g': 0,
    'h': heuristic.eval(state),
    'parent': null,
    'id': state.id()
  };
  var Q = new this.heapType();
  var numVisited = 0;
  var visited = {};
  var getNeighbors = level.getNeighbors.bind(level);
  if (this.advanced) {
    getNeighbors = level.getNeighborsAdvanced.bind(level);
  }
  Q.push(info, info.h);
  
  while (!Q.empty()) {
    var top = Q.pop();
    info = top.value;
    if (this.print && numVisited % 1500 == 0) {
      console.log(top.score + ' ' + numVisited + ' ' + Q.size());
    }
    
    visited[info.id] = true;
    numVisited++;
    
    if (level.isGoal(info.state)) {
      solution = this.backtrack_(level, info);
      break;
    }
    var neighbors = getNeighbors(info.state);
    for (var i = 0, length = neighbors.length; i < length; ++i) {
      var id = neighbors[i][1].id();
      if (visited[id]) continue;
      
      var g = info.g + neighbors[i][0];
      var h = heuristic.eval(neighbors[i][1]);
      var f = g + h;
      var child = {
	'state': neighbors[i][1],
	'pusher': neighbors[i][2],
	'g': g,
	'h': h,
	'parent': info,
	'id': id
      };
      if (Q.exists(child)) {
	Q.updateIfBetter(child, f);
      } else {
	Q.push(child, f);
      }
    }
  }
  
  var endTime = Date.now();
  var duration = (endTime - startTime) / 1000.0;
  if (this.print) console.log('numVisited:' + numVisited + ' duration:' + duration);
  return solution;
};


Solver.prototype.backtrack_ = function(level, info) {
  var solution = [];
  if (this.print) {
    console.log(info);
  }
  // Backtrack the solution.
  do {
    var parent = info.parent;
    if (parent != null && info.pusher) {
      var path = level.computeShortestPath(parent.state, info.pusher);
      solution.push(info.state);
      for (var i = 0; i < path.length - 1; i++) {
	var state = new push.State(path[i], parent.state.boxes);
	solution.push(state);
      }
    } else {
      solution.push(info.state);
    }
    info = info.parent;
  } while (info != null);
  
  if (this.print) {
    console.log(solution.length);
  }
  return solution;
};
});