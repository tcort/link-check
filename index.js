"use strict";

var fs = require('fs');
var request = require('request');

module.exports = function linkCheck(link, callback) {
    request.head(link, function (err, res, body) {
        if (!err && res.statusCode === 200) {
            callback(null); // alive, returned 200 OK
        } else if (err) {
            callback(err); // dead due to error making request (e.g. connection refused)
        } else {
            // if HEAD fails (405 Method Not Allowed, etc), try GET
            request.get(link, function (err, res) {
                if (!err && res.statusCode === 200) {
                    callback(null); // alive, returned 200 OK
                } else {
                    callback(err || new Error(res.statusCode)); // dead due to non-200 or request error
                }
            }).pipe(fs.createWriteStream('/dev/null'));
        }
    });
};
