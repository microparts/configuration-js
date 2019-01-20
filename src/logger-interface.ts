export default interface LoggerInterface {
    debug(message: string, context?: any): void,
    info(message: string, context?: any): void,
    error(message: string, context?: any): void,
}
