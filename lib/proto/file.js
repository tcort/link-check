"use strict";

const fs = require('fs');
const LinkCheckResult = require('../LinkCheckResult');
const path = require('path');
const processModule = require('process');
const url = require('url');

module.exports = {
    check: function (link, opts, callback) {
        let filepath = decodeURIComponent(url.parse(link, false, true).pathname || '');
        if (!path.isAbsolute(filepath)) {
            const basepath = decodeURI(url.parse(opts.baseUrl, false, true).path) || processModule.cwd();
            filepath = path.resolve(basepath, filepath);
        }

        fs.access(filepath || '', fs.hasOwnProperty('R_OK') ? fs.R_OK : fs.constants.R_OK, function (err) {
            callback(null, new LinkCheckResult(opts, link, !err ? 200 : 400, err));
        });
    }
};
