"use strict";

const BlackHole = require('../BlackHole');
const isRelativeUrl = require('is-relative-url');
const LinkCheckResult = require('../LinkCheckResult');
const ms = require('ms');
const request = require('request');

module.exports = {

    check: function (link, opts, callback) {

        const options = {
            uri: link,
            headers: {
                // override 'User-Agent' (some sites return `401` when the user-agent isn't a web browser)
                'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_11_1) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/47.0.2526.106 Safari/537.36'
            },
            maxRedirects: 8,
            strictSSL: false,
            timeout: ms(opts.timeout),
        };
        
        if (opts.baseUrl && isRelativeUrl(link)) {
            options.baseUrl = opts.baseUrl;
        }

        if (opts.headers) {
            Object.assign(options.headers, opts.headers);
        }

        request.head(options, function (err, res, body) {
            if (!err && res.statusCode === 200) {
                callback(null, new LinkCheckResult(opts, link, res ? res.statusCode : 0, err)); // alive, returned 200 OK
                return;
            }

            // if HEAD fails (405 Method Not Allowed, etc), try GET
            request.get(options, function (err, res) {
                callback(null, new LinkCheckResult(opts, link, res ? res.statusCode : 0, err));
            }).pipe(new BlackHole());
        });
    },
};
