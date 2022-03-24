import { Db } from "mongodb"

export interface SystemContext {
  mongoDB?: Db
}

let _context = {}


export const setSystemContext = (context: SystemContext) => {
  _context = Object.assign(_context, context)
}
export const systemContext = (): SystemContext => _context