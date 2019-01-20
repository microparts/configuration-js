import LoggerInterface from './logger-interface';
export default class StdoutConsoleLogger implements LoggerInterface {
    /**
     * If true, debug logs will shown.
     */
    private readonly showDebug;
    /**
     * StdoutConsoleLogger instance.
     *
     * @param showDebug
     */
    constructor(showDebug?: boolean);
    /**
     * Log the debug messages.
     *
     * @param message
     * @param context
     */
    debug(message: string, context?: any): void;
    /**
     * Log the info messages.
     *
     * @param message
     * @param context
     */
    info(message: string, context?: any): void;
    /**
     * Log the error messages.
     *
     * @param message
     * @param context
     */
    error(message: string, context?: any): void;
    /**
     * Lon entry.
     *
     * @param message
     * @param context
     */
    private static log;
}
