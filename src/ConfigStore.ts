const Debug = require('debug')
import { freeze } from './utils/index'
import { StoreValue, StoreValueMap, ConfigStoreOptions, FreezeObjectTarget, LoadInitialStateFunction } from './Types'
import Errors from './Errors'

const debug = Debug('node-config-store')

const defaultOptions = {
    initialState: {},
    derivedValues: {},
    initialStateFiles: [] as string[],
    initialStateLoaders: [] as LoadInitialStateFunction[],
    immutable: false
}

class ConfigStore {
    _state: StoreValueMap
    _opts: ConfigStoreOptions

    constructor(options?: ConfigStoreOptions){
        debug('Creating new ConfigStore instance')
        this._state = {}

        this._opts = { ...defaultOptions, ...options }
        debug('Created with options %o', this._opts)
        freeze(this._opts as FreezeObjectTarget)

        /*== Pre-Condition Checks ==*/

        // The schema object must be a valid JOI object
        if (this._opts.schema && this._opts.schema.isJoi !== true)
            throw Errors.INVALID_SCHEMA_OBJECT
        
        /*== Run Options ==*/

        const { initialStateFiles, initialState, immutable} = this._opts
        this._populateState(initialState)
        
        if (initialStateFiles.length > 0)
            this._populateStateFromFiles(initialStateFiles)
        if (immutable === true)
            freeze(this._state as FreezeObjectTarget)

        /*== Post-Condition Checks ==*/

        // If the store is immutable you must have a valid starting state (ie something there)
        if (this._opts.immutable && (typeof this._state !== 'object' || Object.keys(this._state).length === 0))
            throw Errors.IMMUTABLE_BUT_NO_STARTING_STATE
    }

    set(key: string, value: StoreValue) : any{
        debug('Setting store value for key %o', key)
        debug('Value %o', value)
        if (this._opts.immutable === true)
            throw Errors.NO_MUTABILITY_ALLOWED
        this._mergeNewState({ [key]: value })
        this._validateSchema()
    }

    _getKeyVal(key: string) : StoreValue{
        const isDerived = (this._opts.derivedValues.hasOwnProperty(key) && typeof this._opts.derivedValues[key] === 'function')
        const value = isDerived ? this._opts.derivedValues[key](this._state) : this._state[key]
        return value
    }

    get(key: string | string[]): StoreValue | StoreValueMap{
        debug('Getting store value for key %o', key)
        
        if (typeof key === 'string')
            return this._getKeyVal(key)
        return key.reduce((obj, key) => ({ ...obj, [key]: this._getKeyVal(key) }), {})
    }

    _validateSchema(){
        if(!this._opts.schema)
            return

        debug('Validating store agaisnt schema')
        const { error } = require('joi').validate(this._state, this._opts.schema)
        if (error)
            throw new Error(error)
    }

    _mergeNewState(newSubset: StoreValueMap){
        debug('Merging Subset %o', newSubset)
        this._populateState({...this._state, ...newSubset})

        // We don't want to validate the store yet if we have outstanding state loaders
        if(this._opts.initialStateLoaders.length === 0)
            this._validateSchema()
    }

    _populateState(newState: StoreValueMap){
        debug('Populating State %o', newState)
        this._state = newState

        // We don't want to validate the store yet if we have outstanding state loaders
        if(this._opts.initialStateLoaders.length === 0)
            this._validateSchema()
    }

    _populateStateFromFiles(fileLocations: string[]){
        debug('Populating state from %o files', fileLocations.length)
        fileLocations.forEach(location => {
            debug('Reading file %o', location)
            const config = require('dotenv').parse(require('fs').readFileSync(location))
            this._mergeNewState(config)
        })
    }

    loadState(){
        return this._populateStateWithLoaders()
    }

    async _populateStateWithLoaders(){
        const { initialStateLoaders } = this._opts
        let count = 0, loaderCount = initialStateLoaders.length
        
        debug('Populating state with %o loaders', loaderCount)
        while (count < loaderCount){
            const values = await initialStateLoaders[count](this._state)
            this._mergeNewState(values)
            count++
        }
        this._validateSchema()
    }
}


export const createConfigStore = (options?: ConfigStoreOptions) => {
    const cs = new ConfigStore(options)
    return cs
}