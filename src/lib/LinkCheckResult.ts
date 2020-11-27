import { Options, Status } from './types'

export class LinkCheckResult {
    public readonly link: string
    public readonly statusCode: number
    public readonly err: any
    public readonly status: Status

    constructor(opts: Options, link: string, statusCode: number, err: any) {
        this.link = link
        this.statusCode = statusCode || 0
        this.err = err || null
        this.status = isAlive(opts, statusCode) ? Status.ALIVE : Status.DEAD
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
