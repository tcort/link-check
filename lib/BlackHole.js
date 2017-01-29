"use strict";

const Writable = require('stream').Writable;

const BlackHole = new Writable({
    write(chunk, encoding, callback) {
        callback();
    }
});

module.exports = BlackHole;
