
var State = function (pos, boxes) {
    this.pos = [pos[0], pos[1]];
    this.boxes = boxes.map(function(x) {
       return x;
    });
};

State.MAX_WIDTH = 8;
// 2^6

State.hash = function(pos) {
    return (pos[1] - 1)*State.MAX_WIDTH + (pos[0] - 1);
};

State.prototype.createAbstraction = function(start, end) {
    return new State(this.pos, this.boxes.slice(start, end));
};

State.prototype.unpack = function(state) {
    // TODO(birkbeck): this is invalid now.
    this.pos[0] = state[0] % State.MAX_WIDTH;
    this.pos[1] = Math.floor(state[0] / State.MAX_WIDTH);

    for (var i = 1, length = state.length; i < length; ++i) {
	this.boxes[i - 1][0] = state[i] % State.MAX_WIDTH;
	this.boxes[i - 1][1] = Math.floor(state[i] / State.MAX_WIDTH);
    }    
};

State.prototype.pack = function() {
    var sorted = this.boxes.sort(function(a, b) { 
      return State.hash(b) - State.hash(a);
    });
    var nbits = 6; // Should be log2(MAX_WIDTH^2);
    var value = State.hash(this.pos);
    for (var i = 0; i < sorted.length; i++) {
	value += State.hash(sorted[i]) << ((i + 1) * nbits);
    }
    return value;
};

State.prototype.getBlockIndex = function(pos) {
    for (var i = 0; i < this.boxes.length; i++) {
	if (this.boxes[i][0] == pos[0] && this.boxes[i][1] == pos[1]) {
	    return i;
	}
    }
    return -1;
};

State.prototype.id = function() {
    return this.pack();
};
