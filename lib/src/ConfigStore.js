"use strict";
var __assign = (this && this.__assign) || function () {
    __assign = Object.assign || function(t) {
        for (var s, i = 1, n = arguments.length; i < n; i++) {
            s = arguments[i];
            for (var p in s) if (Object.prototype.hasOwnProperty.call(s, p))
                t[p] = s[p];
        }
        return t;
    };
    return __assign.apply(this, arguments);
};
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : new P(function (resolve) { resolve(result.value); }).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __generator = (this && this.__generator) || function (thisArg, body) {
    var _ = { label: 0, sent: function() { if (t[0] & 1) throw t[1]; return t[1]; }, trys: [], ops: [] }, f, y, t, g;
    return g = { next: verb(0), "throw": verb(1), "return": verb(2) }, typeof Symbol === "function" && (g[Symbol.iterator] = function() { return this; }), g;
    function verb(n) { return function (v) { return step([n, v]); }; }
    function step(op) {
        if (f) throw new TypeError("Generator is already executing.");
        while (_) try {
            if (f = 1, y && (t = op[0] & 2 ? y["return"] : op[0] ? y["throw"] || ((t = y["return"]) && t.call(y), 0) : y.next) && !(t = t.call(y, op[1])).done) return t;
            if (y = 0, t) op = [op[0] & 2, t.value];
            switch (op[0]) {
                case 0: case 1: t = op; break;
                case 4: _.label++; return { value: op[1], done: false };
                case 5: _.label++; y = op[1]; op = [0]; continue;
                case 7: op = _.ops.pop(); _.trys.pop(); continue;
                default:
                    if (!(t = _.trys, t = t.length > 0 && t[t.length - 1]) && (op[0] === 6 || op[0] === 2)) { _ = 0; continue; }
                    if (op[0] === 3 && (!t || (op[1] > t[0] && op[1] < t[3]))) { _.label = op[1]; break; }
                    if (op[0] === 6 && _.label < t[1]) { _.label = t[1]; t = op; break; }
                    if (t && _.label < t[2]) { _.label = t[2]; _.ops.push(op); break; }
                    if (t[2]) _.ops.pop();
                    _.trys.pop(); continue;
            }
            op = body.call(thisArg, _);
        } catch (e) { op = [6, e]; y = 0; } finally { f = t = 0; }
        if (op[0] & 5) throw op[1]; return { value: op[0] ? op[1] : void 0, done: true };
    }
};
Object.defineProperty(exports, "__esModule", { value: true });
var Debug = require('debug');
var index_1 = require("./utils/index");
var Errors_1 = require("./Errors");
var debug = Debug('node-config-store');
var defaultOptions = {
    initialState: {},
    derivedValues: {},
    initialStateFiles: [],
    initialStateLoaders: [],
    immutable: false
};
var ConfigStore = (function () {
    function ConfigStore(options) {
        debug('Creating new ConfigStore instance');
        this._state = {};
        this._opts = __assign({}, defaultOptions, options);
        debug('Created with options %o', this._opts);
        index_1.freeze(this._opts);
        if (this._opts.schema && this._opts.schema.isJoi !== true)
            throw Errors_1.default.INVALID_SCHEMA_OBJECT;
        var _a = this._opts, _b = _a.initialStateFiles, initialStateFiles = _b === void 0 ? [] : _b, initialState = _a.initialState, immutable = _a.immutable;
        if (initialStateFiles.length > 0)
            this._populateStateFromFiles(options.initialStateFiles);
        if (typeof initialState === 'object')
            this._populateState(this._opts.initialState);
        if (immutable === true)
            index_1.freeze(this._state);
        if (this._opts.immutable && (typeof this._state !== 'object' || Object.keys(this._state).length === 0))
            throw Errors_1.default.IMMUTABLE_BUT_NO_STARTING_STATE;
    }
    ConfigStore.prototype.set = function (key, value) {
        debug('Setting store value for key %o', key);
        debug('Value %o', value);
        if (this._opts.immutable === true)
            throw Errors_1.default.NO_MUTABILITY_ALLOWED;
        this._state[key] = value;
        this._validateSchema();
    };
    ConfigStore.prototype._getKeyVal = function (key) {
        var isDerived = (this._opts.derivedValues.hasOwnProperty(key) && typeof this._opts.derivedValues[key] === 'function');
        var value = isDerived ? this._opts.derivedValues[key](this._state) : this._state[key];
        return value;
    };
    ConfigStore.prototype.get = function (key) {
        var _this = this;
        if (key === void 0) { key = ''; }
        debug('Getting store value for key %o', key);
        if (typeof key === 'string')
            return this._getKeyVal(key);
        return key.reduce(function (obj, key) {
            var _a;
            return (__assign({}, obj, (_a = {}, _a[key] = _this._getKeyVal(key), _a)));
        }, {});
    };
    ConfigStore.prototype._validateSchema = function () {
        if (!this._opts.schema)
            return;
        debug('Validating store agaisnt schema');
        var error = require('joi').validate(this._state, this._opts.schema).error;
        if (error)
            throw new Error(error);
    };
    ConfigStore.prototype._mergeNewState = function (newSubset) {
        debug('Merging Subset %o', newSubset);
        this._populateState(__assign({}, this._state, newSubset));
        if (this._opts.initialStateLoaders.length === 0)
            this._validateSchema();
    };
    ConfigStore.prototype._populateState = function (newState) {
        debug('Populating State %o', newState);
        this._state = newState;
        if (this._opts.initialStateLoaders.length === 0)
            this._validateSchema();
    };
    ConfigStore.prototype._populateStateFromFiles = function (fileLocations) {
        var _this = this;
        debug('Populating state from %o files', fileLocations.length);
        fileLocations.forEach(function (location) {
            debug('Reading file %o', location);
            var config = require('dotenv').parse(require('fs').readFileSync(location));
            _this._mergeNewState(config);
        });
    };
    ConfigStore.prototype.loadState = function () {
        return this._populateStateWithLoaders();
    };
    ConfigStore.prototype._populateStateWithLoaders = function () {
        return __awaiter(this, void 0, void 0, function () {
            var initialStateLoaders, count, loaderCount, values;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        initialStateLoaders = this._opts.initialStateLoaders;
                        count = 0, loaderCount = initialStateLoaders.length;
                        debug('Populating state with %o loaders', loaderCount);
                        _a.label = 1;
                    case 1:
                        if (!(count < loaderCount)) return [3, 3];
                        return [4, initialStateLoaders[count](this._state)];
                    case 2:
                        values = _a.sent();
                        this._mergeNewState(values);
                        count++;
                        return [3, 1];
                    case 3:
                        this._validateSchema();
                        return [2];
                }
            });
        });
    };
    return ConfigStore;
}());
module.exports.createConfigStore = function (options) {
    var cs = new ConfigStore(options);
    return cs;
};
//# sourceMappingURL=ConfigStore.js.map