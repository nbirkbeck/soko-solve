goog.provide('push.Heap');

goog.scope(function() {


/**
 * @constructor
 */
push.Heap = function() {
  this.data_ = [];
  this.map_ = {};
};
var Heap = push.Heap;

Heap.prototype.size = function() {
    return this.data_.length;
};

Heap.prototype.empty = function() {
    return this.data_.length == 0;
};

Heap.prototype.push = function(value, score) {
  var index = this.data_.length;
  this.data_[index] = {score: score, value: value};
  this.map_[value.id] = index;
  this.siftUp_(index);
};

Heap.prototype.pop = function() {
    this.swap_(0, this.data_.length - 1);
    var v = this.data_[this.data_.length - 1];
    this.data_.length--;
    this.map_[v.value.id] = undefined;
    this.siftDown_(0);
    return v;
};

Heap.prototype.updateIfBetter = function(value, score) {
    var index = this.map_[value.id];

    if (score < this.data_[index].score) {
	this.data_[index].score = score;
	this.data_[index].value = value;
	this.siftUp_(index);
    }
};

Heap.prototype.exists = function(value) {
    return this.map_[value.id] !== undefined;
};

Heap.prototype.siftDown_ = function(index) {
  var n = this.data_.length;
  while (2 * index + 1 < n) {
      var i1 = 2*index + 1;
      var i2 = 2*index + 2;
      var child = i2;
      if (i2 >= this.data_.length ||
	  this.data_[i1].score < this.data_[i2].score) {
        child = i1;
      }
      if (this.data_[child].score < this.data_[index].score) {
	  this.swap_(child, index);
	  index = child;
      } else {
	  break;
      }
  }
};

Heap.prototype.siftUp_ = function(index) {
  while (index > 0) {
    var parent = Math.floor((index - 1) / 2);
    if (this.data_[parent].score > this.data_[index].score) {
      this.swap_(parent, index);
      index = parent;
    } else {
      break;
    }
  }
};

Heap.prototype.swap_ = function(i1, i2) {
  var v = this.data_[i1];
  this.data_[i1] = this.data_[i2];
  this.data_[i2] = v;
  this.map_[this.data_[i1].value.id] = i1;
  this.map_[this.data_[i2].value.id] = i2;
};

});