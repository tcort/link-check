import * as isemail from 'isemail'

import { Callback, Options, Protocol, staticImplements } from '../types'
import { LinkCheckResult } from '../LinkCheckResult'

@staticImplements<Protocol>()
export class MailToProtocol {
    public static check(link: string, opts: Options, callback: Callback<LinkCheckResult>): void {
        const address = link
            .substr(7) // strip "mailto:"
            .split('?')[0] // trim ?subject=blah hfields

        /* per RFC6068, the '?' is a reserved delimiter and email addresses containing '?' must be encoded,
         * so it's safe to split on '?' and pick [0].
         */

        const statusCode = isemail.validate(address) ? 200 : 400
        callback(null, LinkCheckResult.fromStatus(opts, link, statusCode))
    }
}
