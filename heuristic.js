
var NullHeuristic = function(opt_level) {
};

NullHeuristic.prototype.eval = function(state) {
    return 0;
};

var SimpleHeuristic = function(level) {
    this.level = level;
};

SimpleHeuristic.prototype.eval = function(state) {
    var value = 0;
    var minBoxDistance = 1000;
    for (var i = 0, numBoxes = state.boxes.length; i < numBoxes; ++i) {
	var minDist = 1e10;
	var box = state.boxes[i];
	for (var j = 0, numCrosses = level.crosses.length; j < numCrosses; ++j) {
	    var dist = Math.abs(level.crosses[j][0] - box[0]) +
		Math.abs(level.crosses[j][1] - box[1]);
	    if (dist < minDist) {
		minDist = dist;
	    }
	}
	var upBlocked = level.getCellType([box[0], box[1] - 1]) < constants.CellTypes.EMPTY;
	var downBlocked = level.getCellType([box[0], box[1] + 1]) < constants.CellTypes.EMPTY;
	var leftBlocked = level.getCellType([box[0] - 1, box[1]]) < constants.CellTypes.EMPTY;
	var rightBlocked = level.getCellType([box[0] + 1, box[1]]) < constants.CellTypes.EMPTY;
	if (minDist > 0) {
	    var sideBlocked = leftBlocked || rightBlocked;
	    var topBlocked = upBlocked || downBlocked;
	    if (upBlocked && sideBlocked) {
		return 1000;
	    }
	}
	value += minDist;
	var boxDistance = Math.abs(box[0] - state.pos[0]) + 
	    Math.abs(box[1] - state.pos[1]);
	if (boxDistance < minBoxDistance)
	    minBoxDistance = boxDistance;
    }
    return value + minBoxDistance;
};
