
var State = function (pos, boxes) {
    this.pos = [pos[0], pos[1]];
    this.boxes = boxes.map(function(x) {
       return x;
    });
};

State.MAX_WIDTH = 32;

State.hash = function(pos) {
    return pos[1]*State.MAX_WIDTH + pos[0];
};

State.prototype.unpack = function(state) {
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
    var state = [State.hash(this.pos)];
    var length = sorted.length;
    for (var i = 0; i < length; ++i) {
       state[i + 1] = State.hash(sorted[i]);
    }
    return state;
};

State.prototype.getBlockIndex = function(pos) {
    for (var i = 0; i < this.boxes.length; ++i) {
	if (this.boxes[i][0] == pos[0] && this.boxes[i][1] == pos[1]) {
	    return i;
	}
    }
    return -1;
};

State.prototype.id = function() {
    return this.pack().join();
};
