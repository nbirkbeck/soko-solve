goog.provide('push.math');

goog.scope(function() {

push.math.vectorAdd = function(a, b, opt_scale) {
  var scale = opt_scale || 1;
  return [a[0] + b[0] * scale, a[1] + b[1] * scale];
};

push.math.factorial = function(x) {
    var result = 1;
    while (x > 1) {
	result *= x;
	--x;
    }
    return result;
};
});