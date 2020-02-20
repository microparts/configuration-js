const fg = require('fast-glob');
const yaml = require('js-yaml');
const deepmerge = require('deepmerge');
const fs = require('fs');

import { EntryItem } from 'fast-glob/out/types';
import { get } from 'lodash';
import LoggerInterface from './logger-interface';
import NullLogger from './null-logger';

export default class Configuration {

    /**
     * Name of CONFIG_PATH variable
     */
    private static readonly CONFIG_PATH = 'CONFIG_PATH';

    /**
     * Name of stage ENV variable
     */
    private static readonly STAGE = 'STAGE';

    /**
     * Configuration path.
     *
     * @var string
     */
    public path: string;

    /**
     * App stage.
     *
     * @var string
     */
    public stage: string;

    /**
     * Winston logger interface.
     */
    public logger: LoggerInterface;

    /**
     * Configuration object.
     */
    private config: Object = {};

    /**
     * Configuration constructor.
     *
     * @param path
     * @param stage
     */
    constructor(path: string | null = null,  stage: string | null = null) {
        if (path === null) {
            this.path = Configuration.getEnvVariable(Configuration.CONFIG_PATH, '/app/configuration');
        } else {
            this.path = path;
        }

        if (stage === null) {
            this.stage = Configuration.getEnvVariable(Configuration.STAGE, 'local');
        } else {
            this.stage = stage;
        }

        // Set up default black hole logger.
        // If u want to see logs and see how load process working,
        // change it from outside to your default logger object in you application
        this.logger = new NullLogger();
    }

    /**
     * Initialize all the magic down here
     */
    public load(): Configuration {

        this.logger.info(Configuration.CONFIG_PATH + ' = ' + this.path);
        this.logger.info(Configuration.STAGE + ' = ' + this.stage);

        try {
            this.config = Configuration.mergeRecursive(
                this.parseConfiguration(),
                this.parseConfiguration(this.stage)
            );
        } catch (e) {
            this.logger.error(e.message);
            throw e;
        }

        this.logger.info('Configuration module loaded');

        return this;
    }

    /**
     * Get value from config.
     *
     * @param key
     * @param def
     */
    public get(key: string, def: string | null = null): any {
        return get(this.config, key, def);
    }

    /**
     * Return all merged config.
     */
    public all(): Object {
        return this.config;
    }

    /**
     * Return all merged config converted to json.
     */
    public asJson(escapeQuotes: boolean = false): string {
        const json = JSON.stringify(this.config);

        return escapeQuotes ? Configuration.escape(json) : json;
    }

    /**
     * Return all merged config converted to escaped json.
     */
    public asEscapedJson(): string {
        return this.asJson(true);
    }

    /**
     * Escape json.
     *
     * @param value
     */
    private static escape(value: string): string {
        return value
            .replace(/[\\]/g, '\\\\')
            .replace(/[']/g, '\\\'')
            .replace(/["]/g, '\\\"')
            .replace(/[\/]/g, '\\/')
            .replace(/[\b]/g, '\\b')
            .replace(/[\f]/g, '\\f')
            .replace(/[\n]/g, '\\n')
            .replace(/[\r]/g, '\\r')
            .replace(/[\t]/g, '\\t');
    }

    /**
     * Parses configuration and makes a tree of it
     */
    private parseConfiguration(stage: string = 'defaults'): Object {
        const pattern = `${this.path}/${stage}/*.yaml`;

        this.logger.debug(`For load config for stage: ${stage} used pattern: ${pattern}`);

        try {
            fs.statSync(this.path);
            this.logger.debug(`Directory ${this.path} is exists.`);
        } catch (e) {
            throw new Error(`Configuration dir not found in the: ${this.path}`)
        }

        return this.eachReadAndMerge(fg.sync([pattern]));
    }

    /**
     * Read each file and merge.
     *
     * @param files
     */
    private eachReadAndMerge(files: EntryItem[]): Object {
        let config = {};

        this.logger.debug('Following config files found:', files);

        for (let file of files) {
            let content = Configuration.parseYaml(file.toString());
            config = Configuration.mergeRecursive(config, content[Object.keys(content)[0]]);
        }

        return config;
    }

    /**
     * Recursively merge objects with full replace the sequential lists.
     *
     * @param x
     * @param y
     */
    private static mergeRecursive(x: Object, y: Object): Object {
        const overwriteMerge = (destinationArray: any, sourceArray: any) => sourceArray;

        return deepmerge(x,  y, { arrayMerge: overwriteMerge });
    }

    /**
     * Parse yaml.
     *
     * @param file
     */
    private static parseYaml(file: string) {
        return yaml.safeLoad(fs.readFileSync(file, 'utf8'));
    }

    /**
     * Takes an env variable and returns default if not exist
     *
     * @param variable
     * @param def
     */
    private static getEnvVariable(variable: string, def: string): string {
        return process.env[variable] || def;
    }
}
