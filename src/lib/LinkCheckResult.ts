import { Options } from './types'


export enum Status {
    ALIVE = 'alive',
    DEAD = 'dead',
}

export class LinkCheckResult {
    public readonly link: string
    public readonly statusCode: number
    public readonly status: string
    public readonly err?: any
    public readonly additionalMessages?: string[]

    /**
     * Generic constructor for inheritance
     */
    constructor(link: string, statusCode: number, status: string, err?: any, additionalMessages?: string[]) {
        this.link = link
        this.statusCode = statusCode
        this.status = status
        this.err = err
        this.additionalMessages = additionalMessages

    }

    static fromStatus(opts: Options, link: string, statusCode: number, err?: any, additionalMessages?: string[]): LinkCheckResult {
        return new LinkCheckResult(
            link, 
            statusCode || 0,
            isAlive(opts, statusCode) ? Status.ALIVE : Status.DEAD,
            err,
            additionalMessages
        )
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
