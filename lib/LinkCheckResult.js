"use strict";

class LinkCheckResult {
    constructor(link, statusCode, err) {
        this.link = link;
        this.statusCode = statusCode || 0;
        this.err = err || null;
        this.status = (this.statusCode === 200) ? 'alive' : 'dead';
    }
}

module.exports = LinkCheckResult;
