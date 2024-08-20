"use strict";

import { URL } from 'url';

import check_hash from './lib/proto/hash.js';
import check_file from './lib/proto/file.js';
import check_http from './lib/proto/http.mjs';
import check_https from './lib/proto/https.js';
import check_mailto from './lib/proto/mailto.js';

const protocols = {
    hash: { check: check_hash },
    file: { check: check_file },
    http: { check: check_http },
    https: { check: check_https },
    mailto: { check: check_mailto }
};

function linkCheck(link, opts, callback) {

    if (arguments.length === 2 && typeof opts === 'function') {
        // optional 'opts' not supplied.
        callback = opts;
        opts = {};
    }

    const url = link.startsWith('#') ? link : new URL(link, opts.baseUrl);
    const protocol = link.startsWith('#') ? 'hash' : url.protocol.replace(/:$/, '');

    if (!protocols.hasOwnProperty(protocol)) {
        callback(new Error('Unsupported Protocol'), null);
        return;
    }

    protocols[protocol].check(link, opts, callback);
}

import LinkCheckResult from './lib/LinkCheckResult.js';

export { linkCheck, LinkCheckResult };

export default linkCheck;
