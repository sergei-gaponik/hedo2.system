
export const VERSION = require("../../package.json").version
export const PRODUCTION = process.env.NODE_ENV == "production"
export const ACCESS_TOKEN_EXPIRATION = 15 * 1000//3600
export const CURRENCY_CACHE_DURATION = 3600 * 1000
export const LINE_ITEM_EXPIRATION = 3600 * 1000
export const SESSION_EXPIRATION = 60 * 1000//3600 * 24 * 30