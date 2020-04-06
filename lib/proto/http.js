"use strict";

const BlackHole = require('../BlackHole');
const isRelativeUrl = require('is-relative-url');
const LinkCheckResult = require('../LinkCheckResult');
const ms = require('ms');
const request = require('request');

module.exports = {

    check: function check(link, opts, callback, attempts) {

        if (attempts == null) {
            attempts = 0;
        }
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
                // If enabled in opts, the response was a 429 (Too Many Requests) and there is a retry-after provided, wait and then retry
                if (opts.retryOn429 && res && res.statusCode === 429 && res.headers.hasOwnProperty('retry-after') && attempts < 2) {
                    const retryStr = res.headers['retry-after'];
                    // Sites may respond with a retry-after such as '1m30s', so we need to split this into distinct
                    // time units (separate '1m' and '30s') for zeit/ms to parse them
                    let retryInMs = 0;
                    let buf = '';
                    let letter = false;
                    for (let i = 0; i < retryStr.length; i++) {
                        let c = retryStr[i];
                        if (isNaN(c)) {
                            letter = true;
                            buf += c;
                        } else {
                            if (letter) {
                                retryInMs += ms(buf.trim());
                                buf = '';
                            }
                            letter = false;
                            buf += c;
                        }
                    }
                    retryInMs += ms(buf.trim());
                    // Recurse back after the retry timeout has elapsed (incrementing our attempts to avoid an infinite loop)
                    setTimeout(check, retryInMs, link, opts, callback, attempts + 1);
                } else {
                    callback(null, new LinkCheckResult(opts, link, res ? res.statusCode : 0, err));
                }
            }).pipe(new BlackHole());
        });
    },
};
