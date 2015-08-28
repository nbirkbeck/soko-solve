goog.provide('push.Level');

goog.require('push.constants');

goog.scope(function() {
var constants = push.constants;


/**
 * @param {string=} opt_textGrid Optional level to load (as a string).
 * @constructor
 */
push.Level = function(opt_textGrid) {
  this.grid = [];
  this.startPos = []
  this.boxes = [];
  this.crosses = [];
  if (opt_textGrid) {
      this.loadLevel(opt_textGrid);
  }
};
var Level = push.Level;


/**
 * @param {string} Text grid.
 * @export
 */
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


/**
 * Draws the level to the given context.
 * @param {!push.State}
 * @param {Object}
 * @export
 */
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


/**
 * Moves the player in the current state. Returns true if possible.
 * @param {!push.State} state the current state
 * @param {!push.constants.Directions} direction
 * @return {boolean}
 */
Level.prototype.move = function(state, direction) {
    var offset = push.constants.DELTAS[direction];
    var pos1 = push.math.vectorAdd(state.pos, offset);
    var pos2 = push.math.vectorAdd(state.pos, offset, 2);
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


/**
 * @param {!push.types.GridPoint} pos
 * @return {undefined|constants.CellTypes}
 */
Level.prototype.getCellType = function(pos) {
    if (pos[1] >= 0 && pos[1] < this.grid.length) {
	return this.grid[pos[1]][pos[0]];
    }
    return undefined;
};


/**
 * @param {!push.State} state
 * @return {!Array.<!Array<{number|push.State}>>}
 */
Level.prototype.getNeighbors = function(state) {
    var neighbors = [];
    for (var i = 0; i < 4; ++i) {
	var neighState = new push.State(state.pos, state.boxes);
	if (this.move(neighState, i)) {
	    neighbors.push([1, neighState]);
	}
    }
    return neighbors;
};


/**
 * @param {!push.State} state
 * @param {!push.types.GridPoint} opt_target
 * @return {Object}
 */
Level.prototype.computeShortestPath = function(state, opt_target) {
    var vis = {};
    var Q = [];
    var pos = [state.pos[0], state.pos[1], 1, []];
    vis[push.State.hash(pos)] = 1;
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
	    var offset = push.constants.DELTAS[j];
	    var neighPos = [offset[0] + pos[0], offset[1] + pos[1], 1 + pos[2], pos];
	    var cellType = this.getCellType(neighPos);
	    var boxIndex = state.getBlockIndex(neighPos);
	    if (cellType >= constants.CellTypes.EMPTY && boxIndex < 0) {
		var id = push.State.hash(neighPos);
		if (vis[id] === undefined) {
		    vis[id] = neighPos[2];
		    Q.push(neighPos);
		}
	    }
	}
    }
    return vis;
};


/**
 * @param {!push.State} state
 * @return {!Array.<!Array<{number|push.State}>>}
 */
Level.prototype.getNeighborsAdvanced = function(state) {
    var neighbors = [];
    var vis = this.computeShortestPath(state);
    for (var i = 0; i < state.boxes.length; ++i) {
	var box = state.boxes[i];
	for (var j = 0; j < 4; ++j) {
	    var offset = constants.DELTAS[j];
	    var target = push.math.vectorAdd(box, offset)
	    var targetType = this.getCellType(target);
	    if (targetType < constants.CellTypes.EMPTY) continue;

	    var targetBox = state.getBlockIndex(target);
	    if (targetBox >= 0) continue;

	    var pusher = push.math.vectorAdd(box, offset, -1);
	    var distance = vis[push.State.hash(pusher)];
	    if (distance !== undefined) {
		var neighState = new push.State(box, state.boxes);
		neighState.boxes[i] = target;
		neighbors.push([distance, neighState, pusher]);
	    }
	}
    }
    return neighbors;
};


/**
 * @param {!push.State} state
 * @return {boolean}
 */
Level.prototype.isGoal = function(state) {
    for (var i = 0; i < state.boxes.length; ++i) {
	var type = this.getCellType(state.boxes[i]);
	if (type != constants.CellTypes.CROSS) {
	    return false;
	}
    }
    return true;
};


/**
 * @return {!push.State}
 */
Level.prototype.getInitialState = function() {
    return new push.State(this.startPos, this.boxes);
};


/**
 * @param {number} start
 * @param {number} end
 * @return {!push.Level}
 */
Level.prototype.createAbstraction = function(start, end) {
    var level = new push.Level();
    level.grid = this.grid;
    level.startPos = this.startPos;
    level.crosses = this.crosses;
    level.boxes = [];
    for (var i = start; i < end; i++) {
	level.boxes.push(this.boxes[i].slice(0, 2));
    }
    return level;
};

});


