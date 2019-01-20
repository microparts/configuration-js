"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var StdoutConsoleLogger = /** @class */ (function () {
    /**
     * StdoutConsoleLogger instance.
     *
     * @param showDebug
     */
    function StdoutConsoleLogger(showDebug) {
        if (showDebug === void 0) { showDebug = false; }
        this.showDebug = showDebug;
    }
    /**
     * Log the debug messages.
     *
     * @param message
     * @param context
     */
    StdoutConsoleLogger.prototype.debug = function (message, context) {
        if (context === void 0) { context = null; }
        if (this.showDebug) {
            StdoutConsoleLogger.log(message, context);
        }
    };
    /**
     * Log the info messages.
     *
     * @param message
     * @param context
     */
    StdoutConsoleLogger.prototype.info = function (message, context) {
        if (context === void 0) { context = null; }
        StdoutConsoleLogger.log(message, context);
    };
    /**
     * Log the error messages.
     *
     * @param message
     * @param context
     */
    StdoutConsoleLogger.prototype.error = function (message, context) {
        if (context === void 0) { context = null; }
        StdoutConsoleLogger.log(message, context);
    };
    /**
     * Lon entry.
     *
     * @param message
     * @param context
     */
    StdoutConsoleLogger.log = function (message, context) {
        if (context === void 0) { context = null; }
        if (context === null) {
            process.stdout.write(message + "\n");
        }
        else {
            process.stdout.write(message + " - " + JSON.stringify(context) + "\n");
        }
    };
    return StdoutConsoleLogger;
}());
exports.default = StdoutConsoleLogger;
//# sourceMappingURL=stdout-console-logger.js.map