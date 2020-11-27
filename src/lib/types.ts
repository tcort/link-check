import { LinkCheckResult } from './LinkCheckResult'

export type Callback = (err: any | null, result?: LinkCheckResult) => void

export interface Options {
    baseUrl?: string
    aliveStatusCodes?: (number | RegExp)[]
    timeout?: string
    retryOn429?: boolean
    retryOnError?: boolean
    retryCount?: number
    fallbackRetryDelay?: string
    headers?: { [key: string]: any }
    debug?: boolean
    debugToStdErr?: boolean
}

/* class decorator */
export function staticImplements<T>() {
    return <U extends T>(constructor: U) => {
        // tslint:disable-next-line:no-unused-expression
        constructor
    }
}

export interface Protocol {
    check: (link: string, opts: Options, callback: Callback) => void
}
