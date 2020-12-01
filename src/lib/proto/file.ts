import * as fs from 'fs'
import * as path from 'path'
import * as process from 'process'
import * as url from 'url'

import { debug } from '../debug'
import { LinkCheckResult } from '../LinkCheckResult'
import { Callback, Options, Protocol, staticImplements } from '../types'

@staticImplements<Protocol>()
export class FileProtocol {
    public static check(link: string, opts: Options, callback: Callback<LinkCheckResult>): void {
        if (opts.debug) {
            debug(opts.debugToStdErr, 0, "[fILE] Check link: '" + link + "'. Options: " + JSON.stringify(opts))
        }
        let filepath: string
        try {
            filepath = decodeURIComponent(url.parse(link, false, true).pathname || '')
        } catch (err) {
            callback(`Error: unexpected error during decoding of link '${link} Error: ${err}`)
            return
        }
        if (!path.isAbsolute(filepath)) {
            if (opts.baseUrl) {
                const encodedURI: string = url.parse(opts.baseUrl, false, true).path || ''
                const basepath: string = decodeURI(encodedURI) || process.cwd()
                filepath = path.resolve(basepath, filepath)
            } else {
                throw new Error(`Error: link "${link}" is relative but no "baseUrl" is declared in options`)
            }
        }

        if (opts.debug) {
            debug(opts.debugToStdErr, 0, "[FILE] Check file: '" + filepath + "'")
        }

        fs.access(filepath || '', fs.constants.R_OK, (err: Error | null) => {
            const statusCode = !err ? 200 : 404
            const result = LinkCheckResult.fromStatus(opts, link, statusCode, err)
            if (opts.debug) {
                debug(opts.debugToStdErr, 0, "[FILE] Result: '" + JSON.stringify(result) + "'")
            }
            callback(null, result)
        })
    }
}
