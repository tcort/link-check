import { Writable, WritableOptions } from 'stream'

export class BlackHole extends Writable {
    constructor(options?: WritableOptions) {
        super(options)
    }

    _write(_chunk: unknown, _encoding: BufferEncoding, callback: (error?: Error | null) => void): void {
        callback() // eat the input
    }
}
