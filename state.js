goog.provide('push.State');

goog.require('push.types.GridPoint');

goog.scope(function() {



/** 
 * @param {!push.types.GridPoint} pos
 * @param {!push.types.GridPointArray} boxes
 * @constructor
 */
push.State = function(pos, boxes) {
    /** @type {!push.types.GridPoint} */
    this.pos = [pos[0], pos[1]];

    /** @type {!push.types.GridPointArray} */
    this.boxes = boxes.map(function(x) {
       return x;
    });
};
var State = push.State;


/**
 * Maximum width (and height) of the indexable board points.
 * This is used when packing the grid points and the state.
 * @const {number}
 * @export
 */
State.MAX_WIDTH = 8;  // 2^6


/**
 * Number of bits required to pack a grid point.
 * @const {number}
 */
State.NBITS = 6; // Should be log2(MAX_WIDTH^2);


/**
 * Converts a point to a single index number.
 * @param {!push.types.GridPoint} pos
 * @return {number}
 */
State.hash = function(pos) {
    return (pos[1] - 1) * State.MAX_WIDTH + (pos[0] - 1);
};


/**
 * Creates an state abstraction using the slice from start to end.
 * @param {number} start
 * @param {number} end
 * @return {!push.State}
 */ 
State.prototype.createAbstraction = function(start, end) {
    return new State(this.pos, this.boxes.slice(start, end));
};


/**
 * Packs the state into a compact integer representation.
 */
State.prototype.pack = function() {
    var sorted = this.boxes.sort(function(a, b) { 
      return State.hash(b) - State.hash(a);
    });
    var value = State.hash(this.pos);
    for (var i = 0; i < sorted.length; i++) {
	value += State.hash(sorted[i]) << ((i + 1) * State.NBITS);
    }
    return value;
};


/**
 * Gets the block index for the given grid point. Returns -1 if there
 * is nothing at the given point.
 * @param {!push.types.GridPoint} pos
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
 */
State.prototype.id = function() {
    return this.pack();
};
});