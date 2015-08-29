goog.provide('soko.math');

goog.require('soko.types');

goog.scope(function() {
  

/**
 * @param {!soko.types.GridPoint} a
 * @param {!soko.types.GridPoint} b
 * @param {number=} opt_scale optional scaling of b
 * @return {!soko.types.GridPoint}
 */
soko.math.vectorAdd = function(a, b, opt_scale) {
  var scale = opt_scale || 1;
  return [a[0] + b[0] * scale, a[1] + b[1] * scale];
};


/**
 * @param {!soko.types.GridPoint} a
 * @param {!soko.types.GridPoint} b
 * @return {number}
 */
soko.math.vectorDistanceL1 = function(a, b) {
  return Math.abs(a[0] - b[0]) + Math.abs(a[1] - b[1]);
};


/**
 * @param {number} x
 */
soko.math.factorial = function(x) {
  var result = 1;
  while (x > 1) {
    result *= x;
    --x;
  }
  return result;
};
});