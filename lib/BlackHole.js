"use strict";

import Writable from 'stream';

class BlackHole extends Writable {
    constructor(options) {
        super(options);
    }
    write() {} // eat the input
    end() {}
}

export { BlackHole };
export default BlackHole;
