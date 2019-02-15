import LoggerInterface from './logger-interface';
export default class Configuration {
    /**
     * Name of CONFIG_PATH variable
     */
    private static readonly CONFIG_PATH;
    /**
     * Name of stage ENV variable
     */
    private static readonly STAGE;
    /**
     * Configuration path.
     *
     * @var string
     */
    path: string;
    /**
     * App stage.
     *
     * @var string
     */
    stage: string;
    /**
     * Winston logger interface.
     */
    logger: LoggerInterface;
    /**
     * Configuration object.
     */
    private config;
    /**
     * Configuration constructor.
     *
     * @param path
     * @param stage
     */
    constructor(path?: string | null, stage?: string | null);
    /**
     * Initialize all the magic down here
     */
    load(): Configuration;
    /**
     * Get value from config.
     *
     * @param key
     * @param def
     */
    get(key: string, def?: string | null): any;
    /**
     * Return all merged config.
     */
    all(): Object;
    /**
     * Return all merged config converted to json.
     */
    asJson(escapeQuotes?: boolean): string;
    /**
     * Return all merged config converted to escaped json.
     */
    asEscapedJson(): string;
    /**
     * Escape json.
     *
     * @param value
     */
    private static escape;
    /**
     * Parses configuration and makes a tree of it
     */
    private parseConfiguration;
    /**
     * Read each file and merge.
     *
     * @param files
     */
    private eachReadAndMerge;
    /**
     * Recursively merge objects with full replace the sequential lists.
     *
     * @param x
     * @param y
     */
    private static mergeRecursive;
    /**
     * Parse yaml.
     *
     * @param file
     */
    private static parseYaml;
    /**
     * Takes an env variable and returns default if not exist
     *
     * @param variable
     * @param def
     */
    private static getEnvVariable;
}
