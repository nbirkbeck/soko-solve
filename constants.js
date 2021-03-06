goog.provide('soko.constants');


goog.scope(function() {
var constants = soko.constants;


/**
 * Flags for the type of cell.
 * @enum {number}
 */
constants.CellTypes = {
  WALL: 0x0,
  EMPTY: 0x1,
  CROSS: 0x2
};


/**
 * Directions of movement. 
 * @enum {number}
 */
constants.Directions = {
  UP: 0,
  DOWN: 1,
  LEFT: 2,
  RIGHT: 3
};


/**
 * Number of pixels of the block used in rendering.
 * @constant {number}
 */
constants.BLOCK_SIZE = 32;


/** 
 * Max number of blocks in the canvas.
 * @constat {number}
 */
constants.MAX_CANVAS_BLOCKS = 12;


/**
 * Offsets (for each direction) of movement.
 * @constant {!Array.<!Array.<number>>}
 */
constants.DELTAS = [[0, -1], [0, 1], [-1, 0], [1, 0]];
});