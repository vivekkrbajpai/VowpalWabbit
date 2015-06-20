var events = require("events"),
    util   = require("util");

exports.debug_mode = false;

function ReplyParser(options) {
    this.name = exports.name;
    this.options = options || { };

    this._buffer            = null;
    this._offset            = 0;
    this._encoding          = "utf-8";
    this._debug_mode        = options.debug_mode;
    this._reply_type        = null;
    this._end               = 0;
}

util.inherits(ReplyParser, events.EventEmitter);

exports.Parser = ReplyParser;

function IncompleteReadBuffer(message) {
    this.name = "IncompleteReadBuffer";
    this.message = message;
}
util.inherits(IncompleteReadBuffer, Error);
// Buffer.toString() is quite slow for small strings
function small_toString(buf, start, end) {
    var tmp = "", i;

    for (i = start; i < end; i++) {
        tmp += String.fromCharCode(buf[i]);
    }
    return tmp;
}

ReplyParser.prototype._parseResult = function (type, buffer) {
    var end = this._end ;
    this._end = this._offset;
    // console.log("Offset", this._offset,buffer.toString())
   return small_toString(this._buffer, end, this._offset-4)
   
     
};

ReplyParser.prototype.execute = function (buffer) {
    this.append(buffer);

    var type, ret, offset ,end;

    while (true) {
        offset = this._offset;
        
        try {
            // at least 4 bytes: :1\r\n
            if (this._bytesRemaining() < 1) {

                break;
            }

            type = this._buffer[this._offset++];
              
            if (type === 10) { // :
                
                end = this._end ;
               
                
                ret = this._parseResult(type ,buffer);
                // console.log(ret)
                if (ret === null) {
                    break;
                }

                this.send_reply(ret);
            } 

        } catch (err) {
            // catch the error (not enough data), rewind, and wait
            // for the next packet to appear
            if (! (err instanceof IncompleteReadBuffer)) {
              throw err;
            }
            this._offset = offset;
            break;
        }
    }
};

ReplyParser.prototype.append = function (newBuffer) {
    if (!newBuffer) {
        
        return;
    }

    // first run
    if (this._buffer === null) {
        this._buffer = newBuffer;

        return;
    }

    // out of data
    if (this._offset >= this._buffer.length) {
        this._buffer = newBuffer;
        this._offset = 0;
        this._end =0
        return;
    }

    // very large packet
    if (Buffer.concat !== undefined) {
        this._buffer = Buffer.concat([this._buffer.slice(this._offset), newBuffer]);
        
   
    } else {

        var remaining = this._bytesRemaining(),
            newLength = remaining + newBuffer.length,
            tmpBuffer = new Buffer(newLength);
        this._buffer.copy(tmpBuffer, 0, this._offset);
        newBuffer.copy(tmpBuffer, remaining, 0);

        this._buffer = tmpBuffer;
        
    }

    this._offset = 0;
};

ReplyParser.prototype.parseHeader = function () {
    var end   = this._packetEndOffset(),
        value = small_toString(this._buffer, this._offset, end - 1);

    this._offset = end + 1;

    return value;
};


ReplyParser.prototype._bytesRemaining = function () {
  
    return (this._buffer.length - this._offset) < 0 ? 0 : (this._buffer.length - this._offset);
};

ReplyParser.prototype.parser_error = function (message) {
    this.emit("error", message);
};

ReplyParser.prototype.send_error = function (reply) {
    this.emit("reply error", reply);
};

ReplyParser.prototype.send_reply = function (reply) {
    this.emit("reply", reply);
};
