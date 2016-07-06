"use strict";

var util = require('util');
var stream = require('stream');
var Writable = stream.Writable;
util.inherits(BlackHole, Writable);

function BlackHole(options) {
    if (!(this instanceof BlackHole)) {
        return new BlackHole(options);
    }

    Writable.call(this, options || {});
    return this;
}

BlackHole.prototype._write = function _write(chunk, encoding, next) {
    next();
};


module.exports = BlackHole;
