goog.provide('soko.State');

goog.require('soko.types.GridPoint');

goog.scope(function() {


/**
 * @typedef {number|string}
 */
soko.StateId;


/** 
 * @param {!soko.types.GridPoint} pos
 * @param {!soko.types.GridPointArray} boxes
 * @param {number=} opt_numCareBoxes
 * @constructor
 */
soko.State = function(pos, boxes, opt_numCareBoxes) {
  /** @type {!soko.types.GridPoint} */
  this.pos = [pos[0], pos[1]];
  
  /** @type {number} */
  this.numCareBoxes = opt_numCareBoxes || 0;

  /** @type {!soko.types.GridPointArray} */
  this.boxes = boxes.map(function(x) {
    return x;
  });
};
var State = soko.State;
  

/**
 * Maximum width (and height) of the indexable board points.
 * This is used when packing the grid points and the state.
 * @const {number}
 */
State.MAX_WIDTH = 8;  // 2^6


/**
 * Number of bits required to pack a grid point.
 * @const {number}
 */
State.NBITS = 6; // Should be log2(MAX_WIDTH^2);


/**
 * Converts a point to a single index number.
 * @param {!soko.types.GridPoint} pos
 * @return {number}
 */
State.hash = function(pos) {
  return (pos[1] - 1) * State.MAX_WIDTH + (pos[0] - 1);
};


/**
 * Creates an state abstraction using the slice from start to end.
 * @param {number} start
 * @param {number} end
 * @return {!soko.State}
 */ 
State.prototype.createAbstraction = function(start, end) {
  return new State(this.pos, this.boxes.slice(start, end), this.numCareBoxes);
};


/**
 * Packs the state into a compact integer representation.
 * @return {soko.StateId}
 */
State.prototype.pack = function() {
  var sorted = this.boxes.slice(0, this.numCareBoxes).concat(
    this.boxes.slice(this.numCareBoxes).sort(function(a, b) { 
      return State.hash(b) - State.hash(a);
    }));
  var value = State.hash(this.pos);
  var top = Math.min(sorted.length, 4);
  for (var i = 0; i < top; i++) {
    value += State.hash(sorted[i]) << ((i + 1) * State.NBITS);
  }
  if (sorted.length <= 4) {
    return value;
  }
  var hex = value.toString(16);
  value = 0;
  for (var i = top; i < sorted.length; ++i) {
    value += State.hash(sorted[i]) << ((i - top) * State.NBITS);
  }
  return hex + "," + value.toString(16);
};


/**
 * Gets the block index for the given grid point. Returns -1 if there
 * is nothing at the given point.
 * @param {!soko.types.GridPoint} pos
 * @return {number}
 */
State.prototype.getBlockIndex = function(pos) {
  for (var i = 0; i < this.boxes.length; i++) {
    if (this.boxes[i][0] == pos[0] && this.boxes[i][1] == pos[1]) {
      return i;
    }
  }
  return -1;
};


/**
 * Gets a unique id for this state. Used for keeping track of visibility.
 * @return {soko.StateId}
 */
State.prototype.id = function() {
  return this.pack();
};
});