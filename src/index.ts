import * as url from 'url'
import { Callback, Options, Protocol } from './lib/types'
import { FileProtocol } from './lib/proto/file'
import { HttpProtocol } from './lib/proto/http'
import { MailToProtocol } from './lib/proto/mailto'

export { Options as LinkCheckOptions, Callback } from './lib/types'
export { LinkCheckResult, Status } from './lib/LinkCheckResult'

const protocols: { [key: string]: Protocol } = {
    file: FileProtocol,
    http: HttpProtocol,
    https: HttpProtocol,
    mailto: MailToProtocol,
}

export function linkCheck(link: string, optionArg: Options | Callback, callbackArg?: Callback): void {
    let options: Options
    let callback: Callback

    if (arguments.length === 2 && typeof optionArg === 'function') {
        // optional 'opts' not supplied.
        callback = optionArg as Callback
        options = {}
    } else {
        callback = callbackArg!
        options = optionArg as Options
    }

    const protocol = (
        url.parse(link, false, true).protocol ||
        url.parse(options.baseUrl!, false, true).protocol ||
        'unknown:'
    ).replace(/:$/, '')
    if (!protocols.hasOwnProperty(protocol)) {
        callback(new Error('Unsupported Protocol'), undefined)
        return
    }

    protocols[protocol].check(link, options, callback)
}
