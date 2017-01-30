"use strict";

const fs = require('fs');
const LinkCheckResult = require('../LinkCheckResult');
const path = require('path');
const process = require('process');
const url = require('url');

module.exports = {
    check: function (link, baseUrl, callback) {
        let filepath = url.parse(link, false, true).path || '';
        if (!path.isAbsolute(filepath)) {
            const basepath = url.parse(baseUrl, false, true).path || process.cwd();
            filepath = path.resolve(basepath, filepath);
        }

        fs.access(filepath || '', fs.R_OK || fs.constants.R_OK, function (err) {
            callback(null, new LinkCheckResult(link, !err ? 200 : 400, err));
        });
    }
};
