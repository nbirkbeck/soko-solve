
var Solver = function(opt_heuristicType, opt_heapType, opt_advanced) {
    this.heuristicType = opt_heuristicType || NullHeuristic;
    this.heapType = opt_heapType || Queue;
    this.advanced = opt_advanced || false;
    this.print = false;
};

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
	if (this.print) {
	    if (numVisited % 1500 == 0)
		console.log(top.score + ' ' + numVisited + ' ' + Q.size());
	}
	
	visited[info.id] = true;
	numVisited++;
	
	if (level.isGoal(info.state)) {
	    if (this.print) {
		console.log(info);
	    }
	    // Backtrack the solution.
	    while (info.parent != null) {
		solution.push(info.state);
		info = info.parent;
	    }
	    solution.push(info.state);
	    if (this.print) {
		console.log(solution.length);
	    }
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