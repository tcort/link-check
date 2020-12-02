// tslint:disable:no-console
export function debug(
    debugToStdErr: boolean | undefined,
    attempts: number,
    message: string,
    ...optionalParams: any[] // eslint-disable-line @typescript-eslint/no-explicit-any
): void {
    const log = debugToStdErr ? console.error : console.log
    const date = new Date().toISOString()
    if (attempts) {
        log(date, '(Retry n˚' + attempts + ')', message, optionalParams)
    } else {
        log(date, message, optionalParams)
    }
}
// tslint:enable:no-console
