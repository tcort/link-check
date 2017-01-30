"use strict";

const fs = require('fs');
const LinkCheckResult = require('../LinkCheckResult');
const path = require('path');
const process = require('process');
const url = require('url');

module.exports = {
    check: function (link, baseUrl, callback) {
        const basepath = url.parse(baseUrl || process.cwd(), false, true).path;
        const linkUrl = url.parse(link, false, true);
        let filepath = linkUrl.path || '';

        if (path.isAbsolute(filepath) && !linkUrl.protocol) {
            // File links are not truly absolute. On a webserver `/` points to a root.
            // So protocolless links should point relative to the base path.
            filepath = path.join(basepath, filepath);
	} else if (filepath) {
            filepath = path.resolve(basepath, filepath);
        }

        fs.access(filepath || '', fs.hasOwnProperty('R_OK') ? fs.R_OK : fs.constants.R_OK, function (err) {
            callback(null, new LinkCheckResult(link, !err ? 200 : 400, err));
        });
    }
};
