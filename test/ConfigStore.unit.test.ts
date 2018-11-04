const joi = require('joi')

import { createConfigStore } from '../src/ConfigStore'
import { LoadInitialStateFunction, StoreValueMap } from '../src/Types'

const BASIC_SCHEMA = joi.object({
    a: joi.string().required(),
    b: joi.string().required()
})

describe('Config Store', () => {
    it('Should create an instance with default options', () => {
        const expectedDefaultOptions = {
            initialState: {},
            derivedValues: {},
            initialStateFiles: [] as string[],
            initialStateLoaders: [] as LoadInitialStateFunction[],
            immutable: false
        }

        const store = createConfigStore()

        expect(store._opts).toEqual(expectedDefaultOptions)
    })

    it('Should not allow the options object to be changed after initialization', () => {
        const store = createConfigStore()

        expect(Object.isFrozen(store._opts)).toBe(true)
        expect(Object.isFrozen(store._opts.immutable)).toBe(true)
    })

    it('Should reject the schema property if it is not a valid JOI schema', () => {
        expect(() => {
            createConfigStore({ schema: { isJoi: false }})
        }).toThrowError('ConfigStore was initialized with an invalid opts.schema object. Must be a "joi" schema object')
    })

    it('Should freeze the state if the instance is constructed as immutable', () => {
        const store = createConfigStore({ initialState: { a: true }, immutable: true })

        expect(Object.isFrozen(store._state)).toBe(true)
        expect(Object.isFrozen(store._state.a)).toBe(true)
    })

    it('Should throw an error if the store is immutable but the final constructed state is empty', () => {
        expect(() => {
            createConfigStore({ immutable: true })
        }).toThrowError('ConfigStore was initialized with opts.immutable = "TRUE" but no opts.initalState or invalid opts.initialStateFile')
    })

    it('Should load the provided initial store given an object', () => {
        const store = createConfigStore({
            initialState: {
                hello: 'world'
            }
        })

        expect(store.get('hello')).toEqual('world')
        expect(store._state).toEqual({ hello: 'world'})
    })

    it('Should load a provided env config file into the store', () => {
        const basicFile = __dirname + '/data/basic.env'
        const store = createConfigStore({
            initialStateFiles: [basicFile]
        })

        expect(store._state).toEqual({ abc: '123'})
        expect(store.get('abc')).toEqual('123')
    })

    it('Should load two env config files into the store in the proper order', () => {
        const basicFile = __dirname + '/data/basic.env'
        const basicFileOverride = __dirname + '/data/basic.override.env'

        const store = createConfigStore({
            initialStateFiles: [basicFile, basicFileOverride]
        })

        expect(store._state).toEqual({ abc: '456', hello: 'world'})
        expect(store.get('abc')).toEqual('456')
    })

    it('Should properly set a value in the store', () => {
        const store = createConfigStore()
        store.set('hello', 'world')
        store.set('abc', 123)

        expect(store._state).toEqual({
            hello: 'world',
            abc: 123
        })

        expect(store.get('hello')).toEqual('world')
        expect(store.get('abc')).toEqual(123)
    })

    it('Should refuse to set a value if the store is marked as immutable', () => {
        const initialState = { a: '1' }
        const store = createConfigStore({ initialState, immutable: true })

        expect(() => {
            store.set('b', 2)
        }).toThrowError('ConfigStore was initialized with opts.immutable = "TRUE". No modifications allowed')
    })

    it('Should return the proper set given a list of keys', () => {
        const store = createConfigStore({
            initialState: {
                a: '1',
                b: '2',
                c: '3'
            }
        })

        expect(store.get(['a', 'c'])).toEqual({ a: '1', c: '3'})
    })

    it('Should return the proper value given a derived configuration', () => {
        const initialState = {
            a: 1,
            b: 2
        }

        const derivedValues = {
            total: (state: StoreValueMap) => state.a + state.b
        }

        const store = createConfigStore({ initialState, derivedValues })

        expect(store.get('total')).toEqual(3)
    })

    it('Should reject an initial state given a schema that does not match', () => {
        
        const initialState = {
            a: '1',
            b: 2
        }
        
        expect(() => {
            createConfigStore({
                initialState,
                schema: BASIC_SCHEMA
            })
        }).toThrowError('child "b" fails because ["b" must be a string]')
        
    })

    it('Should throw an error when the initialState is valid but a config file breaks the schema', () => {
        const initialState = {
            a: '1',
            b: '3'
        }

        const basicFile = __dirname + '/data/basic.override.2.env'
        
        expect(() => {
            createConfigStore({
                initialState,
                initialStateFiles: [basicFile],
                schema: BASIC_SCHEMA
            })
        }).toThrowError('ValidationError: "c" is not allowed')
    })

    it('Should run a loader function and merge the result', async () => {
        const initialState = {
            a: 1
        }

        const loader1 = (state: StoreValueMap) => ({ b: state.a + 1 })

        const store = createConfigStore({
            initialState,
            initialStateLoaders: [loader1]
        })

        await store.loadState()

        expect(store._state).toEqual({ a: 1, b: 2})
        expect(store.get('b')).toEqual(2)
    })

    it('Should run a (async) loader function and merge the result', async () => {
        const initialState = {
            a: 1,
        }

        const loader1 = (state: StoreValueMap) => new Promise(res => setTimeout(() => res({ b: state.a + 1 }), 1000))

        const store = createConfigStore({
            initialState,
            initialStateLoaders: [loader1]
        })

        await store.loadState()

        expect(store._state).toEqual({ a: 1, b: 2})
        expect(store.get('b')).toEqual(2)
    })
})