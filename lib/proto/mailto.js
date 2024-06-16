"use strict";

import emailValidator from 'node-email-verifier';
import LinkCheckResult from '../LinkCheckResult.js';
import ms from 'ms';
import { setTimeout } from 'timers/promises';

async function check(link, opts, callback) {
    const address = link
                        .substr(7)      // strip "mailto:"
                        .split('?')[0]; // trim ?subject=blah hfields

    /* per RFC6068, the '?' is a reserved delimiter and email addresses containing '?' must be encoded,
     * so it's safe to split on '?' and pick [0].
     */

    try {
        let isValid = false;
        let controller = new AbortController();
        let checkEmail = emailValidator(address).then((res) => {
            isValid = res;
            controller.abort();
        });
        let timeout = setTimeout(ms(opts.timeout || '10s'), undefined, { signal: controller.signal }).then(() => {
            throw { message: 'Domain MX lookup timed out', code: 'ECONNRESET' };
        });
        await Promise.race([checkEmail, timeout]);
        if (!isValid) {
            return callback(null, new LinkCheckResult(opts, link, 400, null));
        }
        return callback(null, new LinkCheckResult(opts, link, 200, null));
    } catch (error) {
        return callback(null, new LinkCheckResult(opts, link, 0, error));
    }
}

export { check };
export default check;
