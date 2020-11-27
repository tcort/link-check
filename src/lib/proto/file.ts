import * as fs from 'fs'
import * as path from 'path'
import * as process from 'process'
import * as url from 'url'
import { LinkCheckResult } from '../LinkCheckResult'
import { Callback, Options, Protocol, staticImplements } from "../types"

@staticImplements<Protocol>()
export class FileProtocol {
    
    public static check(link: string, opts: Options, callback: Callback): void {

        let filepath: string = decodeURIComponent(url.parse(link, false, true).pathname || '');

        if (!path.isAbsolute(filepath)) {
            if (opts.baseUrl) {
                const encodedURI: string = url.parse(opts.baseUrl, false, true).path || ''
                const basepath: string = decodeURI(encodedURI) || process.cwd();
                filepath = path.resolve(basepath, filepath);
            } else {
                throw new Error(`Error: link "${link}" is relative but no "baseUrl" is declared in options`)
            }
        }

        fs.access(filepath || '', fs.constants.R_OK, (err: NodeJS.ErrnoException | null) => {
            const statusCode = !err ? 200 : 400
            callback(null, new LinkCheckResult(opts, link, statusCode, err));
        });
    }
};
