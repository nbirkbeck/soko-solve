
/**
 * Flags for the type of cell.
 * @enum {number}
 */
var CellTypes = {
    EMPTY: 0x0,
    WALL: 0x1,
    CROSS: 0x2
};

var Directions = {
    UP: 0,
    DOWN: 1,
    LEFT: 2,
    RIGHT: 3
};

var BLOCK_SIZE = 32;

var Level = function(textGrid) {
  this.grid = undefined;
  this.startPos = undefined;
  this.pos = undefined;
  this.boxes = undefined;
  this.loadLevel(textGrid);
};

Level.prototype.loadLevel = function(textGrid) {
  var rows = textGrid.split('\n'); 
  this.grid = [];
  this.startPos = [];
  this.boxes = [];
  for (var i = 0; i < rows.length; ++i) {
      var row = [];
      for (var j = 0; j < rows[i].length; ++j) {
	  row[j] = CellTypes.EMPTY;
	  if (rows[i][j] == '#') {
	      row[j] = CellTypes.WALL;
	  } else if (rows[i][j] == 'x') {
	      row[j] = CellTypes.CROSS;
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

Level.prototype.draw = function(context) {
    context.fillStyle = '#FFF';
    context.fillRect(0, 0, 1000, 1000);
    for (var i = 0; i < this.grid.length; ++i) {
	for (var j = 0; j < this.grid[i].length; ++j) {
	    if (this.grid[i][j] == CellTypes.WALL) {
		context.fillStyle = '#444';
		context.strokeStyle = '#000';
		context.fillRect(j * BLOCK_SIZE, i * BLOCK_SIZE, BLOCK_SIZE, BLOCK_SIZE);
		context.strokeRect(j * BLOCK_SIZE, i * BLOCK_SIZE, BLOCK_SIZE, BLOCK_SIZE);
	    } else if (this.grid[i][j] == CellTypes.CROSS) {
		console.log('line');
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
    for (var i = 0; i < this.boxes.length; ++i) {
	var pos = this.boxes[i];
	var x = pos[0];
	var y = pos[1];

	context.fillStyle = "#AA0";
	context.fillRect(x * BLOCK_SIZE, y * BLOCK_SIZE, BLOCK_SIZE, BLOCK_SIZE);
    }
    context.beginPath();
    context.arc((this.pos[0] + 0.5) * BLOCK_SIZE, 
		(this.pos[1] + 0.5) * BLOCK_SIZE, BLOCK_SIZE / 2, 0, 2.0 * Math.PI);
    context.stroke();
};

Level.prototype.move = function(direction) {
    var deltas = [[0, -1], [0, 1], [-1, 0], [1, 0]];
    var offset = deltas[direction];
    var pos1 = [this.pos[0] + offset[0], this.pos[1] + offset[1]];
    var pos2 = [this.pos[0] + offset[0]*2, this.pos[1] + offset[1]*2];
    var n1 = this.getCellType(pos1);
    var n2 = this.getCellType(pos2);
    var b1 = this.getBlockIndex(pos1);
    var b2 = this.getBlockIndex(pos2);
    if (n1 === CellTypes.EMPTY || n1 === CellTypes.CROSS) {
	if (b1 < 0) {
	    this.pos = pos1;
	    return true;
	} else if ((n2 == CellTypes.EMPTY || 
		    n2 == CellTypes.CROSS) && b2 < 0) {
	    this.pos = pos1;
	    this.boxes[b1] = pos2;
	    return true;
	}
	return false;
    }
    return false;
};

Level.prototype.getBlockIndex = function(pos) {
    for (var i = 0; i < this.boxes.length; ++i) {
	if (this.boxes[i][0] == pos[0] && this.boxes[i][1] == pos[1]) {
	    return i;
	}
    }
    return -1;
};

Level.prototype.getCellType = function(pos) {
    if (pos[1] >= 0 && pos[1] < this.grid.length) {
	if (pos[0] >= 0 && pos[0] < this.grid[pos[1]].length) {
	    return this.grid[pos[1]][pos[0]];
	}
    }
    return undefined;
};

Level.prototype.getNeighbors = function() {
    var state = this.getState();
    var neighbors = [];
    for (var i = 0; i < 4; ++i) {
	this.setState(state);
	if (this.move(i)) {
	    neighbors[neighbors.length] = [i, this.getState()];
	}
    }
    return neighbors;
};

Level.prototype.isGoal = function() {
    for (var i = 0; i < this.boxes.length; ++i) {
	var type = this.getCellType(this.boxes[i]);
	if (type != CellTypes.CROSS) {
	    return false;
	}
    }
    return true;
};

Level.prototype.getState = function() {
    var sorted = this.boxes.sort(function(a, b) { 
       return b[1]*64 + b[0] - a[1]*64 + a[0];
    });
    var state = [this.hash(this.pos)];
    for (var i = 0; i < sorted.length; ++i) {
       state[i + 1] = this.hash(sorted[i]);
    }
    return state;
};

Level.prototype.setState = function(state) {
    this.pos[1] = Math.floor(state[0] / 64);
    this.pos[0] = Math.floor(state[0] % 64);
    for (var i = 1; i < state.length; ++i) {
	this.boxes[i - 1] = [state[i] % 64, Math.floor(state[i] / 64)];
    }
};

Level.prototype.hash = function(pos) {
    return pos[1]*64 + pos[0];
}

Level.prototype.solve = function() {
    if (this.solution === undefined) {
	var originalState = this.getState();
	var Q = [originalState];
	var inQ = {};
	inQ[originalState.join()] = null;

	while (Q.size != 0) {
	    var top = Q.shift();
	    this.setState(top);
	    if (this.isGoal()) {
		// Backtrack the solution.
		var state = top;
		this.solution = [];
		while (inQ[state] !== null) {
		    this.solution.push(state);
		    state = inQ[state][0];
		}
		this.solution.push(state);
		console.log(this.solution.length);
		break;
	    }
	    var neighbors = this.getNeighbors();
	    for (var i = 0; i < neighbors.length; ++i) {
		var key = neighbors[i][1].join();
		if (inQ[key] === undefined) {
		    inQ[key] = [top, neighbors[i][0]];
		    Q.push(neighbors[i][1]);
		}
	    }
	}
        this.setState(originalState);
    } else if (this.solution.length > 0) {
	this.setState(this.solution.pop());
    }
};


