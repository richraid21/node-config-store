"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.freeze = function (o) {
    Object.freeze(o);
    if (o === undefined)
        return o;
    Object.getOwnPropertyNames(o).forEach(function (prop) {
        if (o[prop] !== null && (typeof o[prop] === "object" || typeof o[prop] === "function") && !Object.isFrozen(o[prop]))
            exports.freeze(o[prop]);
    });
    return o;
};
//# sourceMappingURL=index.js.map