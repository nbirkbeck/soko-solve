goog.provide('soko.math');

goog.require('soko.types');

goog.scope(function() {
  

/**
 * @param {!soko.GridPoint} a
 * @param {!soko.GridPoint} b
 * @param {opt_scale=} opt_scale optional scaling of b
 */
soko.math.vectorAdd = function(a, b, opt_scale) {
  var scale = opt_scale || 1;
  return [a[0] + b[0] * scale, a[1] + b[1] * scale];
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