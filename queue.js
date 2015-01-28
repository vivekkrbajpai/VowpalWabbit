function Queue() {
	this.tail = [];
	this.head = [];
	this.index = 0;
}
Queue.prototype.shift = function () {
	if (this.index === this.head.length) {
		var tmp = this.head;
		tmp.length = 0;
		this.head = this.tail;
		this.tail = tmp;
		this.index = 0;
		if (this.head.length === 0) {
			return;
		}
	}
	return this.head[this.index++]; 
}	
Queue.prototype.push = function (item) {
		return this.tail.push(item);
	};

module.exports = Queue ;