

var Level = function(textGrid) {
  this.grid = undefined;
  this.startPos = undefined;
  this.boxes = undefined;
  this.loadLevel(textGrid);
};

Level.prototype.loadLevel = function(textGrid) {
  var rows = textGrid.split('\n'); 
  this.grid = [];
  this.startPos = [];
  this.boxes = [];
  this.crosses = [];

  for (var i = 0; i < rows.length; ++i) {
      var row = [];
      for (var j = 0; j < rows[i].length; ++j) {
	  row[j] = constants.CellTypes.EMPTY;
	  if (rows[i][j] == '#') {
	      row[j] = constants.CellTypes.WALL;
	  } else if (rows[i][j] == 'x') {
	      row[j] = constants.CellTypes.CROSS;
	      this.crosses.push([j, i]);
	  } else if (rows[i][j] == '*') {
	      this.startPos = [j, i];
	      this.pos = [j, i];
	      console.log(this.pos);
	  } else if (rows[i][j] == 'b') {
	      this.boxes.push([j, i]);
	  }
      }
      this.grid[i] = row;
  }
};

Level.prototype.draw = function(state, context) {
    var BLOCK_SIZE = constants.BLOCK_SIZE;
    context.fillStyle = '#FFF';
    context.fillRect(0, 0, 1000, 1000);
    for (var i = 0; i < this.grid.length; ++i) {
	for (var j = 0; j < this.grid[i].length; ++j) {
	    if (this.grid[i][j] == constants.CellTypes.WALL) {
		context.fillStyle = '#444';
		context.strokeStyle = '#000';
		context.fillRect(j * BLOCK_SIZE, i * BLOCK_SIZE, BLOCK_SIZE, BLOCK_SIZE);
		context.strokeRect(j * BLOCK_SIZE, i * BLOCK_SIZE, BLOCK_SIZE, BLOCK_SIZE);
	    } else if (this.grid[i][j] == constants.CellTypes.CROSS) {
		context.strokeWidth = 6;
		context.strokeStyle = '#0F0';
		context.beginPath();
		context.moveTo(j * BLOCK_SIZE, (i + 1)* BLOCK_SIZE);
		context.lineTo((j + 1)* BLOCK_SIZE, i * BLOCK_SIZE);
		context.moveTo(j * BLOCK_SIZE, i * BLOCK_SIZE);
		context.lineTo((j + 1) * BLOCK_SIZE, (i + 1) * BLOCK_SIZE);
		context.stroke();
	    }
	}
    }
    for (var i = 0; i < state.boxes.length; ++i) {
	var pos = state.boxes[i];
	var x = pos[0];
	var y = pos[1];

	context.fillStyle = "#AA0";
	context.fillRect(x * BLOCK_SIZE, y * BLOCK_SIZE, BLOCK_SIZE, BLOCK_SIZE);
    }
    context.beginPath();
    context.arc((state.pos[0] + 0.5) * BLOCK_SIZE, 
		(state.pos[1] + 0.5) * BLOCK_SIZE, BLOCK_SIZE / 2, 0, 2.0 * Math.PI);
    context.stroke();
};

Level.prototype.move = function(state, direction) {
    var deltas = [[0, -1], [0, 1], [-1, 0], [1, 0]];
    var offset = deltas[direction];
    var pos1 = [state.pos[0] + offset[0], state.pos[1] + offset[1]];
    var pos2 = [state.pos[0] + offset[0]*2, state.pos[1] + offset[1]*2];
    var n1 = this.getCellType(pos1);
    var n2 = this.getCellType(pos2);
    var b1 = state.getBlockIndex(pos1);
    var b2 = state.getBlockIndex(pos2);
    if (n1 >= constants.CellTypes.EMPTY) {
	if (b1 < 0) {
	    state.pos = pos1;
	    return true;
	} else if (n2 >= constants.CellTypes.EMPTY && b2 < 0) {
	    state.pos = pos1;
	    state.boxes[b1] = pos2;
	    return true;
	}
	return false;
    }
    return false;
};

Level.prototype.getCellType = function(pos) {
    if (pos[1] >= 0 && pos[1] < this.grid.length) {
	if (pos[0] >= 0 && pos[0] < this.grid[pos[1]].length) {
	    return this.grid[pos[1]][pos[0]];
	}
    }
    return undefined;
};

Level.prototype.getNeighbors = function(state) {
    var neighbors = [];
    for (var i = 0; i < 4; ++i) {
	var neighState = new State(state.pos, state.boxes);
	if (this.move(neighState, i)) {
	    neighbors[neighbors.length] = neighState;
	}
    }
    return neighbors;
};

Level.prototype.isGoal = function(state) {
    for (var i = 0; i < state.boxes.length; ++i) {
	var box = state.boxes[i];
	var type = this.getCellType(box);
	if (type != constants.CellTypes.CROSS) {
	    return false;
	}
    }
    return true;
};

Level.prototype.getInitialState = function() {
    return new State(this.startPos, this.boxes);
};


Level.prototype.solve = function(state) {
    if (this.solution === undefined) {
	var startTime = Date.now();
	var heuristic = new SimpleHeuristic(this);
	var info = {
	    'state': state,
	    'g': 0,
	    'h': heuristic.eval(state),
	    'parent': null,
	    'id': state.id()
	};
	var Q = new Heap(); // Queue();
	var numVisited = 0;
	var visited = {};
	Q.push(info, info.h);

	while (!Q.empty()) {
	    var top = Q.pop();
	    info = top.value;
	    if (numVisited % 500 == 0)
		console.log(top.score + ' ' + numVisited + ' ' + Q.size());

	    visited[info.id] = true;
	    numVisited++;

	    if (this.isGoal(info.state)) {
		// Backtrack the solution.
		this.solution = [];
		while (info.parent != null) {
		    this.solution.push(info.state);
		    info = info.parent;
		}
		this.solution.push(info.state);
		console.log(this.solution.length);
		break;
	    }
	    var neighbors = this.getNeighbors(info.state);
	    for (var i = 0, length = neighbors.length; i < length; ++i) {
                var id = neighbors[i].id();
		if (visited[id]) continue;

		var g = info.g + 1;
		var h = heuristic.eval(neighbors[i]);
		var f = g + h;
		var child = {
		    'state': neighbors[i],
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
	console.log(duration);
    }
    if (this.solution.length > 0) {
	return this.solution.pop();
    }
    return state;
};


