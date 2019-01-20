import LoggerInterface from './logger-interface';

export default class NullLogger implements LoggerInterface {
    debug(message: string, context: any = null): void {
        // black-hole
    }
    info(message: string, context: any = null): void {
        // black-hole
    }
    error(message: string, context: any = null): void {
        // black-hole
    }
}
