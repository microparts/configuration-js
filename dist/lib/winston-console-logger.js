"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var WinstonConsoleLogger = /** @class */ (function () {
    /**
     * WinstonConsoleLogger instance.
     *
     * @param logger
     */
    function WinstonConsoleLogger(logger) {
        this.logger = logger;
    }
    /**
     * Log the debug messages.
     *
     * @param message
     * @param context
     */
    WinstonConsoleLogger.prototype.debug = function (message, context) {
        if (context === void 0) { context = null; }
        this.logger.debug(message, context);
    };
    /**
     * Log the info messages.
     *
     * @param message
     * @param context
     */
    WinstonConsoleLogger.prototype.info = function (message, context) {
        if (context === void 0) { context = null; }
        this.logger.info(message, context);
    };
    /**
     * Log the error messages.
     *
     * @param message
     * @param context
     */
    WinstonConsoleLogger.prototype.error = function (message, context) {
        if (context === void 0) { context = null; }
        this.logger.error(message, context);
    };
    return WinstonConsoleLogger;
}());
exports.default = WinstonConsoleLogger;
//# sourceMappingURL=winston-console-logger.js.map