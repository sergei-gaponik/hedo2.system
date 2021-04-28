
export const VERSION = require("../../package.json").version
export const PRODUCTION = process.env.NODE_ENV == "production"
export const ACCESS_TOKEN_LIFESPAN = 3600
export const CURRENCY_CACHE_DURATION = 3600
export const LINE_ITEM_EXPIRATION = 3600