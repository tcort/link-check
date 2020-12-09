"use strict";

const BlackHole = require('../BlackHole');
const isRelativeUrl = require('is-relative-url');
const LinkCheckResult = require('../LinkCheckResult');
const ms = require('ms');
const request = require('request');

module.exports = {

    check: function check(link, opts, callback, attempts, additionalMessage) {

        if (attempts == null) {
            attempts = 0;
        }

        // default request timeout set to 10s if not provided in options
        let timeout = opts.timeout || '10s';

        // retry on 429 http code flag is false by default if not provided in options
        let retryOn429 = opts.retryOn429 || false;

        //max retry count will default to 2 seconds if not provided in options
        let retryCount = opts.retryCount || 2;

        //fallback retry delay will default to 60 seconds not provided in options
        let fallbackRetryDelayInMs = ms(opts.fallbackRetryDelay || '60s');

        const options = {
            // Decoding and encoding is required to prevent encoding already encoded URLs
            uri: encodeURI(decodeURI(link)),
            headers: {
                // override 'User-Agent' (some sites return `401` when the user-agent isn't a web browser)
                'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_11_1) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/47.0.2526.106 Safari/537.36'
            },
            maxRedirects: 8,
            strictSSL: false,
            timeout: ms(timeout),
        };

        if (opts.baseUrl && isRelativeUrl(link)) {
            options.baseUrl = opts.baseUrl;
        }

        if (opts.headers) {
            Object.assign(options.headers, opts.headers);
        }

        request.head(options, function (err, res, body) {
            if (!err && res.statusCode === 200) {
                if (additionalMessage){
                  err = (err == null) ? additionalMessage : `${err} ${additionalMessage}`;
                }
                callback(null, new LinkCheckResult(opts, link, res ? res.statusCode : 0, err)); // alive, returned 200 OK
                return;
            }

            // if HEAD fails (405 Method Not Allowed, etc), try GET
            request.get(options, function (err, res) {
                // If enabled in opts, the response was a 429 (Too Many Requests) and there is a retry-after provided, wait and then retry
                if (retryOn429 && res && res.statusCode === 429 && attempts < retryCount) {
                    //delay will default to fallbackRetryDelay if no retry-after header is found
                    let retryInMs = fallbackRetryDelayInMs;
                    if (res.headers.hasOwnProperty('retry-after')){
                        const retryStr = res.headers['retry-after'];
                        // Standard for 'retry-after' header is in seconds.
                        // the format have to be checked before to see if it's an integer or a complex one.
                        // see https://github.com/tcort/link-check/issues/24

                        if(isNaN(retryStr)){
                          // Some HTTP servers return a non standard 'retry-after' header with incorrect values according to <https://tools.ietf.org/html/rfc7231#section-7.1.3>.
                          // tcort/link-check implemented a retry system to mainly enable Github links to be tested.
                          // Hopefully Github fixed this non standard behaviour on their side.
                          // tcort/link-check will then stop the support of non standard 'retry-after' header for releases greater or equal to 4.7.0.
                          // all this 'isNaN' part and the additionalMessage will then be removed from the code.
                          additionalMessage =
                            "Server returned a non standard \'retry-after\' header. "
                            + "Non standard \'retry-after\' header will not work after link-check 4.7.0 release. "
                            + "See https://github.com/tcort/link-check/releases/tag/v4.5.2 release note for details.";

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
                          retryInMs = ms(buf.trim());
                        }else{
                          // standard compliant header value conversion to milliseconds
                          const secondsToMilisecondsMultiplier = 1000;
                          retryInMs = parseFloat(retryStr) * secondsToMilisecondsMultiplier;
                        }
                    }
                    // Recurse back after the retry timeout has elapsed (incrementing our attempts to avoid an infinite loop)
                    setTimeout(check, retryInMs, link, opts, callback, attempts + 1, additionalMessage);
                } else {
                    if (additionalMessage){
                      err = (err == null) ? additionalMessage : `${err} ${additionalMessage}`;
                    }
                    callback(null, new LinkCheckResult(opts, link, res ? res.statusCode : 0, err));
                }
            }).pipe(new BlackHole());
        });
    },
};
