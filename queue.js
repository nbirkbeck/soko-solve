goog.provide('soko.Queue');

goog.scope(function() {



/**
 * @constructor
 */
soko.Queue = function() {
  this.data_ = [];
  this.map_ = [];
};
var Queue = soko.Queue;


Queue.prototype.empty = function() {
  return this.data_.length == 0;
};


Queue.prototype.size = function() {
  return this.data_.length;
};


Queue.prototype.push = function(value, score) {
  this.map_[value.id] = this.data_.length;
  this.data_.push([value, score]);
};


Queue.prototype.pop = function() {
  var data = this.data_.shift();
  this.map_[data[0].id] = undefined;
  return {
    'value': data[0],
    'score': data[1]
  };
};


Queue.prototype.exists = function(value) {
    return this.map_[value.id] !== undefined;
};


Queue.prototype.updateIfBetter = function(value, score) {};
}); 