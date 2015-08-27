
var deltas = [[0, -1], [0, 1], [-1, 0], [1, 0]];

var Level = function(opt_textGrid) {
  this.grid = undefined;
  this.startPos = undefined;
  this.boxes = undefined;
  this.crosses = [];
  if (opt_textGrid) {
      this.loadLevel(opt_textGrid);
  }
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
	return this.grid[pos[1]][pos[0]];
    }
    return undefined;
};

Level.prototype.getNeighbors = function(state) {
    var neighbors = [];
    for (var i = 0; i < 4; ++i) {
	var neighState = new State(state.pos, state.boxes);
	if (this.move(neighState, i)) {
	    neighbors.push([1, neighState]);
	}
    }
    return neighbors;
};

Level.prototype.computeShortestPath = function(state, opt_target) {
    var vis = {};
    var Q = [];
    var pos = [state.pos[0], state.pos[1], 1, []];
    vis[State.hash(pos)] = 1;
    Q.push(pos);

    // Do a BFS to find all reachable states.
    while (Q.length > 0) {
	pos = Q.shift();
        if (opt_target && pos[0] == opt_target[0] && pos[1] == opt_target[1]) {
            var solution = [];
	    do {
		solution.push([pos[0], pos[1]]);
		pos = pos[3];
  	    } while (pos.length > 3);
	    return solution;
        }
	for (var j = 0; j < 4; ++j) {
	    var neighPos = [deltas[j][0] + pos[0], deltas[j][1] + pos[1], 1 + pos[2], pos];
	    var cellType = this.getCellType(neighPos);
	    var boxIndex = state.getBlockIndex(neighPos);
	    if (cellType >= constants.CellTypes.EMPTY && boxIndex < 0) {
		var id = State.hash(neighPos);
		if (vis[id] === undefined) {
		    vis[id] = neighPos[2];
		    Q.push(neighPos);
		}
	    }
	}
    }
    return vis;
};

Level.prototype.getNeighborsAdvanced = function(state) {
    var neighbors = [];
    var vis = this.computeShortestPath(state);
    for (var i = 0; i < state.boxes.length; ++i) {
	var box = state.boxes[i];
	for (var j = 0; j < 4; ++j) {
	    var target = [box[0] + deltas[j][0], box[1] + deltas[j][1]];
	    var targetType = this.getCellType(target);
	    if (targetType < constants.CellTypes.EMPTY) continue;

	    var targetBox = state.getBlockIndex(target);
	    if (targetBox >= 0) continue;

	    var pusher = [box[0] - deltas[j][0], box[1] - deltas[j][1]];
	    var distance = vis[State.hash(pusher)];
	    if (distance !== undefined) {
		var neighState = new State(box, state.boxes);
		neighState.boxes[i] = target;
		neighbors.push([distance, neighState, pusher]);
	    }
	}
    }
    return neighbors;
};

Level.prototype.isGoal = function(state) {
    for (var i = 0; i < state.boxes.length; ++i) {
	var type = this.getCellType(state.boxes[i]);
	if (type != constants.CellTypes.CROSS) {
	    return false;
	}
    }
    return true;
};

Level.prototype.getInitialState = function() {
    return new State(this.startPos, this.boxes);
};

Level.prototype.createAbstraction = function(start, end) {
    var level = new Level();
    level.grid = this.grid;
    level.startPos = this.startPos;
    level.crosses = this.crosses;
    level.boxes = [];
    for (var i = start; i < end; i++) {
	level.boxes.push(this.boxes[i].slice(0, 2));
    }
    return level;
};



