import { LinkCheckOptions } from './types'


export enum LinkCheckStatus {
    ALIVE = 'alive',
    DEAD = 'dead',
    IGNORE = 'ignore',
}

export class LinkCheckResult {
    public readonly link: string
    public readonly statusCode: number
    public readonly status: string
    public readonly err: any
    /** Expose original error because 'err' property could be simplified to a string message */
    public readonly originalError: any

    /**
     * Generic constructor for inheritance
     */
    constructor(link: string, statusCode: number, status: string, err?: any, originalError?: any) {
        this.link = link
        this.statusCode = statusCode
        this.status = status
        this.err = err || null
        this.originalError = originalError || err || null

    }

    static fromStatus(opts: LinkCheckOptions, link: string, statusCode: number, err?: any, originalError?: any): LinkCheckResult {
        return new LinkCheckResult(
            link, 
            statusCode || 0,
            isAlive(opts, statusCode) ? LinkCheckStatus.ALIVE : LinkCheckStatus.DEAD,
            err,
            originalError,
        )
    }
}

function isAlive(opts: LinkCheckOptions, statusCode: number): boolean {
    const aliveStatusCodes = opts.aliveStatusCodes || [200]

    return aliveStatusCodes.some((aliveStatusCode) =>
        aliveStatusCode instanceof RegExp
            ? aliveStatusCode.test(statusCode.toString())
            : aliveStatusCode === statusCode,
    )
}
