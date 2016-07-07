"use strict";

var BlackHole = require('./blackhole');
var request = require('request');

function LinkCheckResult(link, statusCode, err) {
    if (!(this instanceof LinkCheckResult)) {
        return new LinkCheckResult(link, statusCode, err);
    }

    this.link = link;
    this.statusCode = statusCode || 0;
    this.err = err || null;
    this.status = (this.statusCode === 200) ? 'alive' : 'dead';

    return this;
}

var absoluteLinkMatcher = new RegExp('^(?:[a-z]+:)?//', 'i');
function isRelativeLink(link) {
    return !absoluteLinkMatcher.test(link);
}

module.exports = function linkCheck(link, opts, callback) {

    if (arguments.length === 2 && typeof opts === 'function') {
        // optional 'opts' not supplied.
        callback = opts;
        opts = {};
    }

    var options = {
        uri: link,
        headers: {
            // override 'User-Agent' (some sites return `401` when the user-agent isn't a web browser)
            'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_11_1) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/47.0.2526.106 Safari/537.36',
        },
        strictSSL: false
    };

    if (opts.baseUrl && isRelativeLink(link)) {
        options.baseUrl = opts.baseUrl;
    }

    request.head(options, function (err, res, body) {
        if (!err && res.statusCode === 200) {
            callback(null, new LinkCheckResult(link, res ? res.statusCode : 0, err)); // alive, returned 200 OK
            return;
        }

        // if HEAD fails (405 Method Not Allowed, etc), try GET
        request.get(options, function (err, res) {
            callback(null, new LinkCheckResult(link, res ? res.statusCode : 0, err));
        }).pipe(new BlackHole());
    });
};
