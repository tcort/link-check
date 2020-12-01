import * as url from 'url'
import { Callback, Options, Protocol } from './lib/types'
import { FileProtocol } from './lib/proto/file'
import { HttpProtocol } from './lib/proto/http'
import { MailToProtocol } from './lib/proto/mailto'

export { Options, Callback } from './lib/types'
export { LinkCheckResult, Status } from './lib/LinkCheckResult'

const protocols: { [key: string]: Protocol } = {
    file: FileProtocol,
    http: HttpProtocol,
    https: HttpProtocol,
    mailto: MailToProtocol,
}

export function linkCheck(link: string, optionsArg: Options | Callback, callbackArg?: Callback): void {
    let options: Options
    let callback: Callback

    if (arguments.length === 2 && typeof optionsArg === 'function') {
        // optional 'opts' not supplied.
        callback = optionsArg as Callback
        options = {}
    } else if (arguments.length === 3 && callbackArg) {
        callback = callbackArg
        options = optionsArg as Options
    } else {
        throw new Error('Unexpected arguments')
    }
    doLnkCheck(link, options, callback)
}

function doLnkCheck(link: string, options: Options, callback: Callback): void {
    const protocol = (
        url.parse(link, false, true).protocol ||
        (options.baseUrl && url.parse(options.baseUrl, false, true).protocol) ||
        'unknown:'
    ).replace(/:$/, '')
    if (!Object.prototype.hasOwnProperty.call(protocols, protocol)) {
        callback(new Error('Unsupported Protocol'), undefined)
        return
    }

    protocols[protocol].check(link, options, callback)
}
