
var Heap = function(hash) {
  this.hash_ = hash;
  this.data_ = [];
  this.map_ = {};
};

Heap.prototype.push = function(value, score) {
  var index = this.data_.length;
  this.data_[index] = {score: score, value: value};
  this.map_[this.hash_(value)] = index;
  this.siftUp_(index);
};

Heap.prototype.empty = function() {
    return this.data_.length == 0;
};

Heap.prototype.pop = function() {
    this.swap_(0, this.data_.length - 1);
    var v = this.data_[this.data_.length - 1];
    this.data_.length--;
    this.map_[this.hash_(v)] = undefined;
    this.siftDown_(0);
    return v;
};

Heap.prototype.siftDown_ = function(index) {
  while (2 * index + 1 < this.data_.length) {
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
  this.map_[this.hash_(this.data_[i1].value)] = i1;
  this.map_[this.hash_(this.data_[i2].value)] = i2;
};
