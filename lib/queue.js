'use strict';

module.exports = Queue;

function Queue(maxElemCount) {
    this.maxElemCount = maxElemCount;
    this.data = [];
}

Queue.prototype.push = push;

Queue.prototype.pop = pop;

Queue.prototype.shift = shift;

Queue.prototype.size = size;

function push(elem) {
    this.data.push(elem);
    if (this.size() > this.maxElemCount) {
        this.shift();
    }
}

function pop() {
    return this.data.pop();
}

function shift() {
    return this.data.shift();
}

function size() {
    return this.data.length;
}
