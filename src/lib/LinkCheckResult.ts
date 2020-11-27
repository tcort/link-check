import { Options, Status } from './types'

export class LinkCheckResult {
    public readonly link: string
    public readonly statusCode: number
    public readonly status: Status
    public readonly err: any
    /** Expose original error because 'err' property could be simplified to a string message */
    public readonly originalError: any

    constructor(opts: Options, link: string, statusCode: number, err?: any, originalError?: any) {
        this.link = link
        this.statusCode = statusCode || 0
        this.status = isAlive(opts, statusCode) ? Status.ALIVE : Status.DEAD
        this.err = err || null
        this.originalError = originalError || err || null
    }
}

function isAlive(opts: Options, statusCode: number): boolean {
    const aliveStatusCodes = opts.aliveStatusCodes || [200]

    return aliveStatusCodes.some((aliveStatusCode) =>
        aliveStatusCode instanceof RegExp
            ? aliveStatusCode.test(statusCode.toString())
            : aliveStatusCode === statusCode,
    )
}
