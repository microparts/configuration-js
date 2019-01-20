"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var NullLogger = /** @class */ (function () {
    function NullLogger() {
    }
    NullLogger.prototype.debug = function (message, context) {
        if (context === void 0) { context = null; }
        // black-hole
    };
    NullLogger.prototype.info = function (message, context) {
        if (context === void 0) { context = null; }
        // black-hole
    };
    NullLogger.prototype.error = function (message, context) {
        if (context === void 0) { context = null; }
        // black-hole
    };
    return NullLogger;
}());
exports.default = NullLogger;
//# sourceMappingURL=null-logger.js.map