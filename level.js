goog.provide('soko.Level');

goog.require('soko.constants');


goog.scope(function() {
var constants = soko.constants;


/**
 * @param {string=} opt_textGrid Optional level to load (as a string).
 * @constructor
 */
soko.Level = function(opt_textGrid) {
  /** @type {Array.<Array.<constants.CellTypes>>} */
  this.grid = [];
  /** @type {!soko.types.GridPoint} */
  this.startPos = [];
  /** @type {!soko.types.GridPointArray} */
  this.boxes = [];
  /** @type {!soko.types.GridPointArray} */
  this.crosses = [];

  this.maxWidth = 0;

  if (opt_textGrid) {
    this.loadLevel(opt_textGrid);
  }
};
var Level = soko.Level;


/**
 * @param {string} textGrid Text grid
 */
Level.prototype.loadLevel = function(textGrid) {
  var rows = textGrid.split('\n'); 
  this.grid = [];
  this.startPos = [];
  this.boxes = [];
  this.crosses = [];
  this.maxWidth = 0;

  for (var i = 0; i < rows.length; ++i) {
    var row = [];
    if (rows[i].length == 0) continue;
    for (var j = 0; j < rows[i].length; ++j) {
      row[j] = constants.CellTypes.EMPTY;
      if (rows[i][j] == '#') {
	row[j] = constants.CellTypes.WALL;
      } 
      if (rows[i][j] == 'x' || rows[i][j] == '%' || rows[i][j] == '@') {
	row[j] = constants.CellTypes.CROSS;
	this.crosses.push([j, i]);
      }
      if (rows[i][j] == '*' || rows[i][j] == '@') {
	this.startPos = [j, i];
	this.pos = [j, i];
      }
      if (rows[i][j] == 'b' || rows[i][j] == '%') {
	this.boxes.push([j, i]);
      }
    }
    this.maxWidth = Math.max(this.maxWidth, row.length);
    this.grid[i] = row;
  }
};


/**
 * Draws the level to the given context.
 * @param {!soko.State} state
 * @param {CanvasRenderingContext2D} context
 */
Level.prototype.draw = function(state, context) {
  var BLOCK_SIZE = constants.BLOCK_SIZE;
  context.setTransform(1, 0, 0, 1, 0, 0);
  context.fillStyle = '#FFF';
  context.fillRect(0, 0, 1000, 1000);
  var tx = (constants.MAX_CANVAS_BLOCKS - this.maxWidth) / 2 * BLOCK_SIZE;
  var ty = (constants.MAX_CANVAS_BLOCKS - this.grid.length) / 2 * BLOCK_SIZE;
  context.translate(tx, ty);

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
      } else if (this.grid[i][j] > 0x4) {
	context.strokeWidth = 2;
	context.strokeStyle = '#F00';
	context.beginPath();
	context.moveTo(j * BLOCK_SIZE + 8, (i + 1)* BLOCK_SIZE - 8);
	context.lineTo((j + 1)* BLOCK_SIZE - 8, i * BLOCK_SIZE + 8);
	context.stroke();
      }
    }
  }
  for (var i = 0; i < state.boxes.length; ++i) {
    var pos = state.boxes[i];
    context.fillStyle = "#AA0";
    context.fillRect(pos[0] * BLOCK_SIZE, pos[1] * BLOCK_SIZE, BLOCK_SIZE, BLOCK_SIZE);
  }
  context.beginPath();
  context.arc((state.pos[0] + 0.5) * BLOCK_SIZE, 
	      (state.pos[1] + 0.5) * BLOCK_SIZE, BLOCK_SIZE / 2, 0, 2.0 * Math.PI);
  context.stroke();
};


/**
 * Moves the player in the current state. Returns true if possible.
 * @param {!soko.State} state the current state
 * @param {!soko.constants.Directions} direction
 * @return {boolean}
 */
Level.prototype.move = function(state, direction) {
  var offset = soko.constants.DELTAS[direction];
  var pos1 = soko.math.vectorAdd(state.pos, offset);
  var pos2 = soko.math.vectorAdd(state.pos, offset, 2);
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
 * @param {!soko.types.GridPoint} pos
 * @return {undefined|constants.CellTypes}
 */
Level.prototype.getCellType = function(pos) {
  if (pos[1] >= 0 && pos[1] < this.grid.length) {
    return this.grid[pos[1]][pos[0]];
  }
  return undefined;
};


/**
 * @param {!soko.State} state
 * @return {!Array.<!Array.<number|soko.State>>}
 */
Level.prototype.getNeighbors = function(state) {
  var neighbors = [];
  for (var i = 0; i < 4; ++i) {
    var neighState = new soko.State(state.pos, state.boxes);
    if (this.move(neighState, /** @type {soko.constants.Directions} */(i))) {
      neighbors.push([1, neighState]);
    }
  }
  return neighbors;
};


/**
 * @param {!soko.State} state
 * @param {!soko.types.GridPoint=} opt_target
 * @return {Object}
 */
Level.prototype.computeShortestPath = function(state, opt_target) {
  var vis = {};
  var Q = [];
  var pos = [state.pos[0], state.pos[1], 1, []];
  vis[soko.State.pointToIndex(pos)] = 1;
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
      var offset = soko.constants.DELTAS[j];
      var neighPos = [offset[0] + pos[0], offset[1] + pos[1], 1 + pos[2], pos];
      var cellType = this.getCellType(neighPos);
      var boxIndex = state.getBlockIndex(neighPos);
      if (cellType >= constants.CellTypes.EMPTY && boxIndex < 0) {
	var id = soko.State.pointToIndex(neighPos);
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
 * @param {!soko.State} state
 * @return {!Array.<!Array.<number|soko.State>>}
 */
Level.prototype.getNeighborsCondensed = function(state) {
  var neighbors = [];
  var vis = this.computeShortestPath(state);
  for (var i = 0; i < state.boxes.length; ++i) {
    var box = state.boxes[i];
    for (var j = 0; j < 4; ++j) {
      var offset = constants.DELTAS[j];
      var target = soko.math.vectorAdd(box, offset);
      var targetType = this.getCellType(target);
      if (targetType < constants.CellTypes.EMPTY) continue;
      
      var targetBox = state.getBlockIndex(target);
      if (targetBox >= 0) continue;
      
      var pusher = soko.math.vectorAdd(box, offset, -1);
      var pusherType = this.getCellType(pusher);
      if (pusherType < constants.CellTypes.EMPTY) continue;

      var distance = vis[soko.State.pointToIndex(pusher)];
      if (distance !== undefined) {
	var neighState = new soko.State(box, state.boxes);
	neighState.boxes[i] = target;
	neighbors.push([distance, neighState, pusher]);
      }
    }
  }
  return neighbors;
};


/**
 * @param {!soko.State} state
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
 * @return {!soko.State}
 */
Level.prototype.getInitialState = function() {
  return new soko.State(this.startPos, this.boxes);
};


/**
 * @param {number} start
 * @param {number} end
 * @return {!soko.Level}
 */
Level.prototype.createAbstraction = function(start, end) {
  var level = new soko.Level();
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


