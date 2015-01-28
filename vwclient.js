var net = require('net'),
Queue = require('./queue.js'),
util = require('util'),
events = require('events'),
default_port = 26542,
parser = require('./parser.js'),
default_host = '127.0.0.1';

function VWClient(net_client, options){
	var self = this;
	this.options = options = options || {};
	this.stream = net_client; 
	this.command_queue = new Queue();
	this.reconnecting = null;
	if(this.options.setNodelay == undefined){
		this.options.setNodelay = true;
	}
	if(this.options.setKeepalive == undefined){
		this.options.setKeepalive == true
	}
// make sure this method should be call after createConnection	
this.registerEventListener();
// inherited form standard nodejs api 

events.EventEmitter.call(this);

}
util.inherits(VWClient, events.EventEmitter);

exports.VWClient = VWClient; 

VWClient.prototype.registerEventListener = function(){

	var self = this;

	this.stream.on('connect', function(){
		self.onConnect();	
	})
	this.stream.on('data', function(data){
		self.onData(data);
	})
	this.stream.on('close', function(){
		self.onConnectionClose('close');
	})
	this.stream.on('error', function(msg){

		self.onError(msg.message);
	});
	this.stream.on('end', function(){
		self.onConnectionClose('end');
	})

}
VWClient.prototype.onConnectionClose = function(reason){
// put some logic to retry the connection here and also get check the reason
var self = this;
if(this.reconnecting){
	return;
}
this.flush_and_error(reason);
this.emit('reconnecting');
this.isConnetecd = false;
this.reconnecting = setTimeout(function(){
	console.log("An attempt is ongoing to connect to the daemon")
	self.stream = net.createConnection(self.connectionOption);
	self.registerEventListener();
},100)

}
VWClient.prototype.onConnect = function(){
	var self = this;
    if (this.options.setNodelay) {
		this.stream.setNoDelay();
	}
	this.stream.setKeepAlive(this.options.setKeepalive);
	this.stream.setTimeout(0);
	this.isConnected = true;
	this.reconnecting = null;
	this.init_parser();
	this.emit("connect");  
	

}
VWClient.prototype.init_parser = function(){
	var self = this;
	this.reply_parser = new parser.Parser({});
	this.reply_parser.on('reply' ,function(data){

		self.return_reply(data);
	});
	this.reply_parser.on('reply error' , function(error){
		if (reply instanceof Error) {
			self.return_error(reply);
		} else {
			self.return_error(new Error(reply));
		}
	});
	this.reply_parser.on('error', function(err){
		self.emit("error" , new Error("Reply parser error: " + err.stack))
	});

}

VWClient.prototype.onError = function(err){
	// throw some error here
	this.flush_and_error(err);
	console.log("err in vw :" + err)
	this.connected = false;
	this.ready = false;
	this.emit("error", new Error(err)); //commented for the time being
    this.onConnectionClose("error");


}
VWClient.prototype.return_error = function(err){
	var command_obj = this.command_queue.shift();

	if (command_obj && typeof command_obj.callback === "function") {
		try {
			command_obj.callback(err);
		} catch (callback_err) {
			process.nextTick(function () {
				throw callback_err;
			});
		}
	} else {
		console.log("no callback to send error: " + err.message);
		
		process.nextTick(function () {
			throw err;
		});
	}

}
VWClient.prototype.flush_and_error = function(err){

	var command_obj, error;
	error = new Error(err);

	while (this.command_queue.length > 0) {
		command_obj = this.command_queue.shift();
		if (typeof command_obj.callback === "function") {
			try {
				command_obj.callback(error);
			} catch (callback_err) {
				process.nextTick(function () {
					throw callback_err;
				});
			}
		}
	}
	this.command_queue = new Queue();

}
VWClient.prototype.onData = function(buffered_data){
	console.log(Date.now(),'data')
	try{
		this.reply_parser.execute(buffered_data);		
	}catch(err){
		this.emit('error', err)
	}
	

}

VWClient.prototype.return_reply = function(buffered_data){
	
	var command_obj, processed_data;
	processed_data = buffered_data 
	command_obj = this.command_queue.shift();
	command_obj.callback( null , processed_data);

} 

function Command(args, callback){
	this.args = args;
	this.callback = callback;
}
VWClient.prototype.getPrediction = function( args, callback){
	var command_obj , write_count = 0;
	var stream = this.stream;
	if(typeof callback === 'function' && typeof callback != undefined){

		if (callback && process.domain) callback = process.domain.bind(callback);

		if(typeof args !== undefined){
			var argslength = args.length +1
			command_obj = new Command(args, callback);
			this.command_queue.push(command_obj);

			try{
				if(stream.writable){
				
					write_count += !stream.write("'"+argslength+"#| "+args +"\n")
					
				}
			}catch(stream_write_error){
		// stream is not writable
		this.emit('error', new Error(stream_write_error));
		console.log("not writable stream error")
	}

}
}else{
	throw new Error("no callback define")
}

}
exports.createClient = function (port, host, options) {
	
	if(arguments === 0){

		return createTcpConnection(default_port, default_host, {});

	}else if(typeof port === 'number' && typeof host === undefined){

		return createTcpConnection(port, default_host, options)

	}else if(typeof port === undefined && typeof host === 'string' ){

		return createTcpConnection(default_port, host, options)

	}else{

		return createTcpConnection(port, host, options)

	}
}
// this will make a basic tcp connection and also initiate the most of the required work
var createTcpConnection = function(port, host, options){
	var connectionOption = {
		'port' : port,
		'host' : host,
		'family' : (options && options.family === 'IPv6') ? 6 : 4
	}

	var tcpConnectionStream = net.createConnection(connectionOption);
	var vwClient = new VWClient(tcpConnectionStream , options || {});

	vwClient.connectionOption = connectionOption;
	
	return vwClient ;
}



