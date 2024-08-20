"use strict";

import fs from 'fs';
import LinkCheckResult from '../LinkCheckResult.js';
import processModule from 'process';
import url from 'url';

function check(link, opts, callback) {
    // force baseUrl to end with '/' for proper treatment by WHATWG URL API
    if (typeof opts.baseUrl === 'string' && !opts.baseUrl.endsWith('/')) {
        opts.baseUrl = opts.baseUrl + '/';
    } // without the ending '/', the final component is dropped

    const loc = new URL(link || '', opts.baseUrl || processModule.cwd());
    fs.access(url.fileURLToPath(loc) || '', fs.hasOwnProperty('R_OK') ? fs.R_OK : fs.constants.R_OK, function (err) {
        callback(null, new LinkCheckResult(opts, link, !err ? 200 : 400, err));
    });
}

export { check };
export default check;
