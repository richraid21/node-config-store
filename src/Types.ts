export type StoreValue = any
export interface StoreValueMap {
    [k: string]: StoreValue
}

type DerivedValueFunction = (currentState: StoreValueMap) => StoreValue
interface DerivedValueMap {
    [k: string]: DerivedValueFunction
}

export interface FreezeObjectTarget { [k: string]: string | number | object}

interface JOISchema {
    isJoi: boolean | undefined
}

export type LoadInitialStateFunction = (currentState: StoreValueMap) => StoreValueMap
export interface ConfigStoreOptions {
    initialState?: StoreValueMap
    initialStateFiles?: string[]
    initialStateLoaders?: LoadInitialStateFunction[]
    derivedValues?: DerivedValueMap
    schema?: JOISchema
    immutable?: boolean
}