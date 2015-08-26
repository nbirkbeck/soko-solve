
function factorial(x) {
    var result = 1;
    while (x > 1) {
	result *= x;
	--x;
    }
    return result;
}

function isInvalid(level, state) {
    for (var i = 0, numBoxes = state.boxes.length; i < numBoxes; ++i) {
	var box = state.boxes[i];
	if (level.getCellType([box[0], box[1]]) == constants.CellTypes.CROSS)
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
}

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
    if (isInvalid(this.level, state)) {
	return 1000;
    }
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
	value += minDist;
	var boxDistance = Math.abs(box[0] - state.pos[0]) + 
	    Math.abs(box[1] - state.pos[1]);
	if (boxDistance < minBoxDistance)
	    minBoxDistance = boxDistance;
    }
    return value + minBoxDistance;
};

var BetterHeuristic = function(level) {
    this.level = level;
};

BetterHeuristic.prototype.eval = function(state) {
    var numOptions = factorial(state.boxes.length);
    var minValue = 1e10;

    if (isInvalid(this.level, state)) {
    	return 1000;
    }

    for (var i = 0; i < numOptions; ++i) {
	var option = i;
	var taken = [];
	var value = 0;
	var dists = [];
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
	    var dist = Math.abs(level.crosses[k][0] - box[0]) +
		Math.abs(level.crosses[k][1] - box[1]);
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