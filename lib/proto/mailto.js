"use strict";

import emailValidator from 'node-email-verifier';
import LinkCheckResult from '../LinkCheckResult.js';

async function check(link, opts, callback) {
    const address = link
                        .substr(7)      // strip "mailto:"
                        .split('?')[0]; // trim ?subject=blah hfields

    /* per RFC6068, the '?' is a reserved delimiter and email addresses containing '?' must be encoded,
     * so it's safe to split on '?' and pick [0].
     */

    try {
        if (!(await emailValidator(address, { checkMx: true, timeout: opts.timeout || '10s' }))) {
            return callback(null, new LinkCheckResult(opts, link, 400, null));
        }
        return callback(null, new LinkCheckResult(opts, link, 200, null));
    } catch (error) {
        if (error.message.match(/timed out/)) {
            return callback(null, new LinkCheckResult(opts, link, 0, { message: 'Domain MX lookup timed out', code: 'ECONNRESET' }));
        }
        return callback(null, new LinkCheckResult(opts, link, 0, error));
    }
}

export { check };
export default check;
