"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var yaml = require("js-yaml");
var fast_glob_1 = require("fast-glob");
var fs = require("fs");
var deepmerge_ = require("deepmerge");
var lodash_1 = require("lodash");
var null_logger_1 = require("./null-logger");
// https://github.com/rollup/rollup/issues/670
var deepmerge = deepmerge_.default || deepmerge_;
var Configuration = /** @class */ (function () {
    /**
     * Configuration constructor.
     *
     * @param path
     * @param stage
     */
    function Configuration(path, stage) {
        if (path === void 0) { path = null; }
        if (stage === void 0) { stage = null; }
        /**
         * Configuration object.
         */
        this.config = {};
        if (path === null) {
            this.path = Configuration.getEnvVariable(Configuration.CONFIG_PATH, '/app/configuration');
        }
        else {
            this.path = path;
        }
        if (stage === null) {
            this.stage = Configuration.getEnvVariable(Configuration.STAGE, 'local');
        }
        else {
            this.stage = stage;
        }
        // Set up default black hole logger.
        // If u want to see logs and see how load process working,
        // change it from outside to your default logger object in you application
        this.logger = new null_logger_1.default();
    }
    /**
     * Initialize all the magic down here
     */
    Configuration.prototype.load = function () {
        this.logger.info(Configuration.CONFIG_PATH + ' = ' + this.path);
        this.logger.info(Configuration.STAGE + ' = ' + this.stage);
        try {
            this.config = Configuration.mergeRecursive(this.parseConfiguration(), this.parseConfiguration(this.stage));
        }
        catch (e) {
            this.logger.error(e.message);
            throw e;
        }
        this.logger.info('Configuration module loaded');
        return this;
    };
    /**
     * Get value from config.
     *
     * @param key
     * @param def
     */
    Configuration.prototype.get = function (key, def) {
        if (def === void 0) { def = null; }
        return lodash_1.get(this.config, key, def);
    };
    /**
     * Return all merged config.
     */
    Configuration.prototype.all = function () {
        return this.config;
    };
    /**
     * Parses configuration and makes a tree of it
     */
    Configuration.prototype.parseConfiguration = function (stage) {
        if (stage === void 0) { stage = 'defaults'; }
        var pattern = this.path + "/" + stage + "/*.yaml";
        this.logger.debug("For load config for stage: " + stage + " used pattern: " + pattern);
        try {
            fs.statSync(this.path);
            this.logger.debug("Directory " + this.path + " is exists.");
        }
        catch (e) {
            throw new Error("Configuration dir not found in the: " + this.path);
        }
        return this.eachReadAndMerge(fast_glob_1.default.sync([pattern]));
    };
    /**
     * Read each file and merge.
     *
     * @param files
     */
    Configuration.prototype.eachReadAndMerge = function (files) {
        var config = {};
        this.logger.debug('Following config files found:', files);
        for (var _i = 0, files_1 = files; _i < files_1.length; _i++) {
            var file = files_1[_i];
            var content = Configuration.parseYaml(file.toString());
            config = Configuration.mergeRecursive(config, content[Object.keys(content)[0]]);
        }
        return config;
    };
    /**
     * Recursively merge objects with full replace the sequential lists.
     *
     * @param x
     * @param y
     */
    Configuration.mergeRecursive = function (x, y) {
        var overwriteMerge = function (destinationArray, sourceArray) { return sourceArray; };
        return deepmerge(x, y, { arrayMerge: overwriteMerge });
    };
    /**
     * Parse yaml.
     *
     * @param file
     */
    Configuration.parseYaml = function (file) {
        return yaml.safeLoad(fs.readFileSync(file, 'utf8'));
    };
    /**
     * Takes an env variable and returns default if not exist
     *
     * @param variable
     * @param def
     */
    Configuration.getEnvVariable = function (variable, def) {
        return process.env[variable] || def;
    };
    /**
     * Name of CONFIG_PATH variable
     */
    Configuration.CONFIG_PATH = 'CONFIG_PATH';
    /**
     * Name of stage ENV variable
     */
    Configuration.STAGE = 'STAGE';
    return Configuration;
}());
exports.default = Configuration;
//# sourceMappingURL=configuration-js.js.map