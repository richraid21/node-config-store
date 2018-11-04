const Errors = {
    NO_MUTABILITY_ALLOWED: new Error('ConfigStore was initialized with opts.immutable = "TRUE". No modifications allowed'),
    IMMUTABLE_BUT_NO_STARTING_STATE: new Error('ConfigStore was initialized with opts.immutable = "TRUE" but no opts.initalState or invalid opts.initialStateFile'),
    INVALID_SCHEMA_OBJECT: new Error('ConfigStore was initialized with an invalid opts.schema object. Must be a "joi" schema object')
}

export default Errors
