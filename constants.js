goog.provide('push.constants');


goog.scope(function() {
var constants = push.constants;

/**
 * Flags for the type of cell.
 * @enum {number}
 */
constants.CellTypes = {
  WALL: 0x0,
  EMPTY: 0x1,
  CROSS: 0x2
};

constants.Directions = {
  UP: 0,
  DOWN: 1,
  LEFT: 2,
  RIGHT: 3
};

constants.BLOCK_SIZE = 32;

constants.DELTAS = [[0, -1], [0, 1], [-1, 0], [1, 0]];


});