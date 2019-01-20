import * as winston from 'winston';
import WinstonConsoleLogger from '../src/winston-console-logger';

/**
 * WinstonConsoleLogger test
 */
describe('WinstonConsoleLogger test', () => {

  it('WinstonConsoleLogger is instantiable', () => {
    const logger = new WinstonConsoleLogger(winston.createLogger());
    expect(logger).toBeInstanceOf(WinstonConsoleLogger);
  });
});
