import * as request from 'request'
import isRelativeUrl = require('is-relative-url')
import ms = require('ms')

import { debug } from '../debug'
import { Callback, Options, Protocol, staticImplements } from '../types'
import { LinkCheckResult } from '../LinkCheckResult'
import { BlackHole } from '../BlackHole'

@staticImplements<Protocol>()
export class HttpProtocol {
    public static check(link: string, opts: Options, callback: Callback<LinkCheckResult>): void {
        if (opts.debug) {
            debug(opts.debugToStdErr, 0, `[HTTP] Check link "${link}", options= ${JSON.stringify(opts)}`)
        }
        // default request timeout set to 10s if not provided in options
        const timeout = opts.timeout || '10s'

        const requestOptions: request.OptionsWithUri = {
            uri: encodeURI(link),
            headers: {
                // override 'User-Agent' (some sites return `401` when the user-agent isn't a web browser)
                'User-Agent':
                    'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_11_1) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/47.0.2526.106 Safari/537.36',
            },
            maxRedirects: 8,
            strictSSL: false,
            timeout: ms(timeout) as number,
        }

        if (opts.baseUrl && isRelativeUrl(link)) {
            requestOptions.baseUrl = opts.baseUrl
        }

        if (opts.headers) {
            Object.assign(requestOptions.headers, opts.headers)
        }

        if (opts.debug) {
            debug(
                opts.debugToStdErr,
                0,
                "[HTTP] Check link: '" + requestOptions.uri + "'. Options: " + JSON.stringify(requestOptions),
            )
        }

        HttpProtocol.doCheckWithRetry(link, opts, callback, requestOptions, 0)
    }

    // prettier-ignore
    private static doCheckWithRetry(link: string, opts: Options, callback: Callback<LinkCheckResult>, requestOptions: request.OptionsWithUri, retryCount: number, additionalMessage?: string): void {
        HttpProtocol.doHeadWithRetry(link, opts, callback, requestOptions, retryCount, additionalMessage)
    }

    // prettier-ignore
    public static doHeadWithRetry(link: string, opts: Options, callback: Callback<LinkCheckResult>, requestOptions: request.OptionsWithUri, retryCount: number, additionalMessage?: string): void {
        request.head(requestOptions, (err: unknown, res: request.Response): void => {

            if (opts.debug) {
                if (err) {
                    debug(opts.debugToStdErr, retryCount, "[HTTP] HEAD request error - Status code: '" + (res ? res.statusCode : "-") + "' Error: " + err)
                } else {
                    debug(opts.debugToStdErr, retryCount, "[HTTP] HEAD request ok - Status code: '" + (res ? res.statusCode : "-") + "'")
                }
            }

            if (!err && res.statusCode === 200) {
                const additionalMessages = additionalMessage ? [additionalMessage] : undefined
                const linkResult = LinkCheckResult.fromStatus(opts, link, res ? res.statusCode : 0, err, additionalMessages)
                if (retryCount !== 0) {
                    linkResult.stats.retryCount = retryCount
                }
                callback(null, linkResult); // alive, returned 200 OK
                return;
            }

            HttpProtocol.doGetWithRetry(link, opts, callback, requestOptions, retryCount, additionalMessage)
        })
    }

    // prettier-ignore
    public static doGetWithRetry(link: string, opts: Options, callback: Callback<LinkCheckResult>, requestOptions: request.OptionsWithUri, retryCount: number, additionalMessage?: string): void {
        // if HEAD fails (405 Method Not Allowed, etc), try GET
        request.get(requestOptions, (err: unknown, res: request.Response): void => {
            if (opts.debug) {
                if (err) {
                    debug(opts.debugToStdErr, retryCount, "[HTTP] GET  request error - Status code: '" + (res ? res.statusCode : "-") + "' Error: " + err)
                } else {
                    debug(opts.debugToStdErr, retryCount, "[HTTP] GET  request ok - Status code: '" + (res ? res.statusCode : "-") + "'")
                }
            }
            // If enabled in opts, the response was a 429 (Too Many Requests) and there is a retry-after provided, wait and then retry
            if (HttpProtocol.shouldRetry(err, res, opts, retryCount)) {
                // delay will default to fallbackRetryDelay if no retry-after header is found
                const retryInMsFromHeader = HttpProtocol.getRetryInMsFromHeader(res)
                let retryInMs: number
                if (retryInMsFromHeader) {
                    retryInMs = retryInMsFromHeader.retryInMs
                    if (retryInMsFromHeader.additionalMessage) {
                        additionalMessage = retryInMsFromHeader.additionalMessage
                    }
                } else {
                    // fallback retry delay will default to 60 seconds not provided in options
                    const fallbackRetryDelayInMs = ms(opts.fallbackRetryDelay || '5s');
                    retryInMs = fallbackRetryDelayInMs;
                }
                // Recurse back after the retry timeout has elapsed (incrementing our retryCount to avoid an infinite loop)
                // prettier-ignore
                setTimeout(HttpProtocol.doCheckWithRetry, retryInMs, link, opts, callback, requestOptions, retryCount + 1, additionalMessage);
            } else {
                const additionalMessages = additionalMessage ? [additionalMessage] : undefined
                const linkResult = LinkCheckResult.fromStatus(opts, link, res ? res.statusCode : 0, err, additionalMessages)
                if (retryCount !== 0) {
                    linkResult.stats.retryCount = retryCount
                }
                callback(null, linkResult)
            }
        }).pipe(new BlackHole());
    }

    private static shouldRetry(err: unknown, res: request.Response, opts: Options, retryCount: number): boolean {
        // max retry count will default to 2 seconds if not provided in options
        const maxRetryCount = opts.retryCount || 2
        return (
            // retry on error http code flag is false by default if not provided in options
            (opts.retryOnError === true && err !== undefined && err !== null && retryCount < maxRetryCount) ||
            // retry on 429 http code flag is false by default if not provided in options
            (opts.retryOn429 === true && res !== undefined && res.statusCode === 429 && retryCount < maxRetryCount)
        )
    }

    private static getRetryInMsFromHeader(res: request.Response) {
        if (!res) {
            return
        }
        const retryAfterStr = res.headers['retry-after']
        if (!retryAfterStr) {
            return
        }

        let retryInMs: number = 0
        let additionalMessage: string | undefined
        // Standard for 'retry-after' header is in seconds.
        // the format have to be checked before to see if it's an integer or a complex one.
        // see https://github.com/tcort/link-check/issues/24

        if (isNaN(Number(retryAfterStr))) {
            // Some HTTP servers return a non standard 'retry-after' header with incorrect values according to <https://tools.ietf.org/html/rfc7231#section-7.1.3>.
            // tcort/link-check implemented a retry system to mainly enable Github links to be tested.
            // Hopefully Github fixed this non standard behaviour on their side.
            // tcort/link-check will then stop the support of non standard 'retry-after' header for releases greater or equal to 4.7.0.
            // all this 'isNaN' part and the additionalMessage will then be removed from the code.
            additionalMessage =
                "Server returned a non standard 'retry-after' header. " +
                "Non standard 'retry-after' header will not work after link-check 4.7.0 release. " +
                'See https://github.com/tcort/link-check/releases/tag/v4.5.2 release note for details.'

            let buf = ''
            let letter = false
            for (const c of retryAfterStr) {
                if (isNaN(Number(c))) {
                    letter = true
                    buf += c
                } else {
                    if (letter) {
                        retryInMs += ms(buf.trim()) as number
                        buf = ''
                    }
                    letter = false
                    buf += c
                }
            }
            retryInMs = ms(buf.trim())
        } else {
            // standard compliant header value conversion to milliseconds
            const secondsToMilisecondsMultiplier = 1000
            retryInMs = parseFloat(retryAfterStr) * secondsToMilisecondsMultiplier
        }

        return {
            retryInMs,
            additionalMessage,
        }
    }
}
