import { LinkCheckResult } from './LinkCheckResult'

export type Callback = (err: any, result: LinkCheckResult | null) => void

export interface Options {
    baseUrl?: string
    aliveStatusCodes?: (number | RegExp)[]
    timeout?: string
    retryOn429?: boolean
    retryCount?: number
    fallbackRetryDelay?: string
    headers?: { [key: string]: any }
}

/* class decorator */
export function staticImplements<T>() {
    return <U extends T>(constructor: U) => {
        constructor
    }
}

export interface Protocol {
    check: (link: string, opts: Options, callback: Callback) => void
}

export enum Status {
    ALIVE = 'alive',
    DEAD = 'dead',
}
