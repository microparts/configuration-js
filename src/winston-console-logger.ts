import LoggerInterface from './logger-interface';
import * as winston from 'winston';

export default class WinstonConsoleLogger implements LoggerInterface {

    /**
     * Winston logger.
     */
    private logger: winston.Logger;

    /**
     * WinstonConsoleLogger instance.
     *
     * @param logger
     */
    constructor(logger: winston.Logger) {
        this.logger = logger;
    }

    /**
     * Log the debug messages.
     *
     * @param message
     * @param context
     */
    debug(message: string, context: any = null): void {
        this.logger.debug(message, context);
    }

    /**
     * Log the info messages.
     *
     * @param message
     * @param context
     */
    info(message: string, context: any = null): void {
        this.logger.info(message, context);
    }

    /**
     * Log the error messages.
     *
     * @param message
     * @param context
     */
    error(message: string, context: any = null): void {
        this.logger.error(message, context);
    }
}
