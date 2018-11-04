# Config Store

[![CircleCI branch](https://img.shields.io/circleci/project/github/richraid21/node-config-store/master.svg?style=for-the-badge)](https://circleci.com/gh/richraid21/workflows/node-config-store)
    

## Description
Easily manage the configuration of your app.

## Features
- Populate initial state via object, files and functions
- Schema validation
- Static value lookup and derived lookups based on the current state
- Immutability Option

## Quick Example

```
const JOI = require('joi')
const { createConfigStore } = require('node-config-store')

const initialState = {
    PG_USERNAME: 'rich',
    PG_PASSWORD: 'ABC123',
}

const schema = JOI.object({
    PG_USERNAME: JOI.string().required(),
    PG_PASSWORD: JOI.string().required()
})

const myConfigStore = createConfigStore({
    initialState,
    schema
})
    
console.log(myConfigStore.get('PG_USERNAME')) // rich
console.log(myConfigStore.get('PG_PASSWORD')) // ABC123
```

## Documentation

__createConfigStore(options) => `ConfigStore`__

Create the `ConfigStore`

### options
- `initialState` - {Object} The initial state for the store  

- `initialStateFiles` - {Array<String>} Paths to the `dotenv` compatible files that should be used to populate the initial store. 
    - If used, `dotenv` is a required peer-dependency.    
    - The values pulled from the files are merged into the `ConfigStore` in the order they are encountered.

- `initialStateLoaders` - {Array<Function(currentState) => ValueSet} Array of sync/async functions that return a set of values to merge into the current state at the time of execution. 
    - The loaders are executed non-parellel since the new, combined state is passed to each subsequent loader.
    - `initialState` and `initialStateFile` are applied first
    - Any values returned by any `loader` overwrite the current state

- `derivedValues` - {Object} Object of functions that are accessible and derived at runtime. Should accept a single parameter, `currentState`.  

- `schema` - {Object} A `joi` schema object that defines the required structure for the config state.
    - If used, `joi` is a required peer-dependency.

- `immutable` - {Boolean} Whether or not the store should be immutable after intialization. 
    - If `true`, `initialState` or `initialStateFile` must be provided

__async loadState() => `boolean`__

Execute the set of `initialStateLoaders`.    
- Only required when `initialStateLoaders` are provided    
- Must be executed before usage of the `ConfigStore`

__set(key: String, value: StoreValue) => `boolean`__

Set the value for a key in the `ConfigStore`.   
- Cannot be used if `immutable` is `true`

__get(key: String | keySet String[]) => `StoreValue` | `StoreValueMap` | `undefined`__

Get the value(s) for a specific key(set) in the `ConfigStore`    
- If passed an array of keys, the keys will be returned in a set
- This first checks for the existence of a `derivedValue` function that matches the provided key and will return that, otherwise return the value for the absolute key (if exists)

## State Construction Order
The creation of the `ConfigStore` state is deterministic and is the result of merge operation for the different methods of initial value creation:

1. The `initialState` object is applied
2. Any `initialStateFiles` are merged agaisnt the state in the order in which they are listed
3. Any `initialStateLoaders` are merged agaisnt the state in the order in which they are listed

### Validation
If a `schema` object is provided, the state is validated agaisnt the schema after all `initialState*` operations are performed
- If `initialStateLoaders` are provided, and are `async`, the validation will only occur after those operations resolve. Don't `get` values from the `ConfigStore` until everything is loaded

