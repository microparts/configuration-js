import LoggerInterface from './logger-interface';
export default class NullLogger implements LoggerInterface {
    debug(message: string, context?: any): void;
    info(message: string, context?: any): void;
    error(message: string, context?: any): void;
}
