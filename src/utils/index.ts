import { FreezeObjectTarget } from '../Types'
export const freeze = (o: FreezeObjectTarget) =>{
    Object.freeze(o)
    if (o === undefined)
      return o
  
    Object.getOwnPropertyNames(o).forEach((prop) => {
      if (o[prop] !== null && (typeof o[prop] === "object" || typeof o[prop] === "function") && !Object.isFrozen(o[prop]))
        freeze(o[prop] as FreezeObjectTarget)
    })
  
    return o
}