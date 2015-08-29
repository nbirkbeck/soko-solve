goog.provide('push.math');

goog.require('push.types');

goog.scope(function() {
  

/**
 * @param {!push.GridPoint} a
 * @param {!push.GridPoint} b
 * @param {opt_scale=} opt_scale optional scaling of b
 */
push.math.vectorAdd = function(a, b, opt_scale) {
  var scale = opt_scale || 1;
  return [a[0] + b[0] * scale, a[1] + b[1] * scale];
};


/**
 * @param {number} x
 */
push.math.factorial = function(x) {
  var result = 1;
  while (x > 1) {
    result *= x;
    --x;
  }
  return result;
};
});