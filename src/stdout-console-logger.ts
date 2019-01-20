import LoggerInterface from './logger-interface';

export default class StdoutConsoleLogger implements LoggerInterface {

    /**
     * If true, debug logs will shown.
     */
    private readonly showDebug: boolean;

    /**
     * StdoutConsoleLogger instance.
     *
     * @param showDebug
     */
    constructor(showDebug: boolean = false) {
        this.showDebug = showDebug;
    }

    /**
     * Log the debug messages.
     *
     * @param message
     * @param context
     */
    debug(message: string, context: any = null): void {
        if (this.showDebug) {
            StdoutConsoleLogger.log(message, context);
        }
    }

    /**
     * Log the info messages.
     *
     * @param message
     * @param context
     */
    info(message: string, context: any = null): void {
        StdoutConsoleLogger.log(message, context);
    }

    /**
     * Log the error messages.
     *
     * @param message
     * @param context
     */
    error(message: string, context: any = null): void {
        StdoutConsoleLogger.log(message, context);
    }

    /**
     * Lon entry.
     *
     * @param message
     * @param context
     */
    private static log(message: string, context: any = null): void {
        if (context === null) {
            process.stdout.write(`${message}\n`);
        } else {
            process.stdout.write(`${message} - ${JSON.stringify(context)}\n`);
        }
    }
}
