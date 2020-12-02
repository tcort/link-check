import { Options } from './types'

export enum Status {
    ALIVE = 'alive',
    DEAD = 'dead',
    ERROR = 'error',
}

export interface LinkCheckResultStats {
    durationInMs?: number
}

/* eslint-disable @typescript-eslint/no-explicit-any */
export class LinkCheckResult {
    public readonly link: string
    public readonly statusCode: number
    public readonly status: string
    public readonly err?: any
    public readonly additionalMessages?: string[]
    public readonly stats: LinkCheckResultStats = {}

    /**
     * Generic constructor for inheritance
     */
    constructor(link: string, statusCode: number, status: string, err?: unknown, additionalMessages?: string[]) {
        this.link = link
        this.statusCode = statusCode
        this.status = status
        this.err = err
        this.additionalMessages = additionalMessages
    }

    static fromStatus(
        opts: Options,
        link: string,
        statusCode: number,
        err?: unknown,
        additionalMessages?: string[],
    ): LinkCheckResult {
        return new LinkCheckResult(
            link,
            statusCode || 0,
            isAlive(opts, statusCode) ? Status.ALIVE : Status.DEAD,
            err,
            additionalMessages,
        )
    }

    public setDurationInMs(durationInMs: number): void {
        this.stats.durationInMs = durationInMs
    }
}
/* eslint-enable @typescript-eslint/no-explicit-any */

function isAlive(opts: Options, statusCode: number): boolean {
    const aliveStatusCodes = opts.aliveStatusCodes || [200]

    return aliveStatusCodes.some((aliveStatusCode) =>
        aliveStatusCode instanceof RegExp
            ? aliveStatusCode.test(statusCode.toString())
            : aliveStatusCode === statusCode,
    )
}
