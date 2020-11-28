// tslint:disable:no-console
export function debug(debugToStdErr: boolean | undefined, attempts: number, message: string): void {
    const log = debugToStdErr ? console.error : console.log
    const date = new Date().toISOString()
    if (attempts) {
        log(date, '(Retry n˚' + attempts + ')', message)
    } else {
        log(date, message)
    }
}
// tslint:enable:no-console
