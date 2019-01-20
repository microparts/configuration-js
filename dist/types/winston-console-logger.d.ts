import LoggerInterface from './logger-interface';
import * as winston from 'winston';
export default class WinstonConsoleLogger implements LoggerInterface {
    /**
     * Winston logger.
     */
    private logger;
    /**
     * WinstonConsoleLogger instance.
     *
     * @param logger
     */
    constructor(logger: winston.Logger);
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
}
