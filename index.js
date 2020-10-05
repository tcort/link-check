"use strict";

const url = require('url');
const protocols = {
    file: require('./lib/proto/file'),
    http: require('./lib/proto/http'),
    https: require('./lib/proto/https'),
    mailto: require('./lib/proto/mailto'),
};

module.exports = function linkCheck(link, opts, callback) {

    if (arguments.length === 2 && typeof opts === 'function') {
        // optional 'opts' not supplied.
        callback = opts;
        opts = {};
    }

    const protocol = (url.parse(link, false, true).protocol || url.parse(opts.baseUrl, false, true).protocol || 'unknown:').replace(/:$/, '');
    if (!protocols.hasOwnProperty(protocol)) {
        callback(new Error('Unsupported Protocol'), null);
        return;
    }

    protocols[protocol].check(link, opts, callback);
};

module.exports.LinkCheckResult = require('./lib/LinkCheckResult');
