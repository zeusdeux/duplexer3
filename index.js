var Stream = require('stream');
var Duplex = Stream.Duplex;
var u = require('util');

u.inherits(Duplexer, Duplex);

function Duplexer(o, rs, ws) {
  var self = this;
  Duplex.call(this, o);

  this._ws = ws;
  this._rs = rs;

  //once the writable end finishes, close the underlying stream
  this.once('finish', function() {
    try {
      ws.end();
    }
    catch (e) {
      //ignore errors like trying to close stdout
    }
  });

  rs.once('end', function(d) {
    self.push(null);
  });
  rs.on('error', function(e) {
    self.emit('error', e);
  });
  rs.on('data', function(d) {
    if (!self.push(d)) rs.pause();
    else rs.resume();
  });

  ws.on('error', function(e) {
    self.emit('error', e);
  });
}

Duplexer.prototype._read = function(size) {
  this._rs.resume();
};

Duplexer.prototype._write = function(chunk, enc, done) {
  this._ws.write(chunk, enc, done);
};

module.exports = function(o, rs, ws) {
  if (arguments.length === 2 && (o instanceof Stream)) {
    ws = rs;
    rs = o;
    o = undefined;
  }
  return new Duplexer(o, rs, ws);
};
