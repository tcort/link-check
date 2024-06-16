"use strict";

import LinkCheckResult from '../LinkCheckResult.js';

function check(link, opts, callback) {
    const anchors = opts.anchors || [];
    callback(null, new LinkCheckResult(opts, link, anchors.includes(link) ? 200 : 404, null));
}

export { check };
export default check;
