import * as url from 'url'
import { Callback, Options, Protocol } from './lib/types'
import { LinkCheckResult, Status } from './lib/LinkCheckResult'
import { FileProtocol } from './lib/proto/file'
import { HttpProtocol } from './lib/proto/http'
import { MailToProtocol } from './lib/proto/mailto'

export { Options, Callback }
export { LinkCheckResult, Status }

const protocols: { [key: string]: Protocol } = {
    file: FileProtocol,
    http: HttpProtocol,
    https: HttpProtocol,
    mailto: MailToProtocol,
}

export function linkCheck(link: string, optionsArg: Options | Callback<LinkCheckResult>, callbackArg?: Callback<LinkCheckResult>): void {
    let options: Options
    let callback: Callback<LinkCheckResult>

    if (arguments.length === 2 && typeof optionsArg === 'function') {
        // optional 'opts' not supplied.
        callback = optionsArg as Callback<LinkCheckResult>
        options = {}
    } else if (arguments.length === 3 && callbackArg) {
        callback = callbackArg
        options = optionsArg as Options
    } else {
        throw new Error('Unexpected arguments')
    }
    doLnkCheck(link, options, callback)
}

function doLnkCheck(link: string, options: Options, callback: Callback<LinkCheckResult>): void {
    
    // get protocol from link when link is not relative
    let protocol = url.parse(link, false, true).protocol

    if (!protocol) { // link is relative
        // get protocol from base url when link is not relative
        if (options.baseUrl) {
            protocol = url.parse(options.baseUrl, false, true).protocol
            if (!protocol) {
                callback(new Error(`Relative path could not be checked because protocol could not be determine from baseUrl options "${options.baseUrl}"`))
                return
            }
        } else {
            callback(new Error('Relative path could not be checked when baseUrl options is not set'))
            return
        }
    }
    
    protocol = protocol.replace(/:$/, '')
    if (!Object.prototype.hasOwnProperty.call(protocols, protocol)) {
        callback(new Error(`Unsupported Protocol ${protocol}`), )
        return
    }

    protocols[protocol].check(link, options, callback)
}
