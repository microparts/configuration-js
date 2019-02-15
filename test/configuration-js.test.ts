import Configuration from "../src/configuration-js";
import * as winston from "winston";
import WinstonConsoleLogger from '../src/winston-console-logger';
import StdoutConsoleLogger from '../src/stdout-console-logger';

const symlinkExpected = {
  redis: {
    hostname: '127.0.0.1',
    password: '',
    database: 0,
    port: 6379,
  },
  debug: true,
  log: {
    level: 'wa"rn',
    format: "js'on",
  },
  host: 'localhost',
  port: 8080,
};

/**
 * Configuration test
 */
describe('Configuration test', () => {

  it('Configuration is instantiable', () => {
    expect(new Configuration()).toBeInstanceOf(Configuration);
  });

  it('Configuration is instantiable with constructors params', () => {
    const conf = new Configuration('./conf', 'dev');

    expect(conf.path).toBe('./conf');
    expect(conf.stage).toBe('dev');
  });

  it('Configuration loaded with defaults', () => {
    const conf = new Configuration();

    expect(conf.path).toBe('/app/configuration');
    expect(conf.stage).toBe('local');

    conf.path = './config';
    conf.stage = 'prod';

    expect(conf.path).toBe('./config');
    expect(conf.stage).toBe('prod');
  });

  it('Configuration loaded from os env', () => {
    process.env.CONFIG_PATH = './conf';
    process.env.STAGE = 'test';

    const conf = new Configuration();

    expect(conf.path).toBe('./conf');
    expect(conf.stage).toBe('test');

    process.env.CONFIG_PATH = '';
    process.env.STAGE = '';
  });

  it('loaded configuration and parsed', () => {
    const conf = new Configuration('./test/configuration_spec', 'test');
    conf.load();

    const expected = {
      hotelbook_params: {
        area_mapping: {
          KRK: 'Krakow',
          MSK: 'Moscow',
          CHB: 'Челябинск',
        },
        url: 'https://hotelbook.com/xml_endpoint',
        username: 'TESt_USERNAME',
        password: 'PASSWORD',
      },
      logging: 'info',
      default_list: ['bar', 'baz'],
      empty_array: ['foo'],
      databases: {
        redis: {
          master: {
            username: 'R_USER',
            password: 'R_PASS',
          }
        }
      }
    };

    expect(conf.all()).toEqual(expected);
    expect(conf.get('hotelbook_params.area_mapping.KRK')).toEqual('Krakow');
    expect(conf.get('default_list')).toEqual(['bar', 'baz']);
  });

  it('loaded symlinks configs (like kubernetes)', () => {
    const conf = new Configuration('./test/configuration_symlinks', 'test');
    conf.load();

    expect(conf.all()).toEqual(symlinkExpected);
    expect(conf.get('redis.port')).toBe(6379);
    expect(conf.get('debug')).toBeTruthy();
  });

  it('return correct json', () => {
    const conf = new Configuration('./test/configuration_symlinks', 'test');
    conf.load();

    /* eslint no-eval: 0 */

    expect(JSON.parse(conf.asJson())).toEqual(symlinkExpected);
    expect(JSON.parse(eval(`"${conf.asEscapedJson()}"`))).toEqual(symlinkExpected);
  });

  it('works with logger', () => {
    const conf = new Configuration('./test/configuration_symlinks', 'test');
    conf.logger = new WinstonConsoleLogger(winston.createLogger({
      transports: [
          new winston.transports.Console()
      ]
    }));
    conf.load();
  });

  it('works with stdout logger', () => {
    const conf = new Configuration('./test/configuration_symlinks', 'test');
    conf.logger = new StdoutConsoleLogger(true);
    conf.load();
  });
});
