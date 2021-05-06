require("module-alias/register")
require("reflect-metadata")
require("dotenv").config()

import * as Mongoose from 'mongoose'
import * as express from 'express'
import { ApolloServer } from "apollo-server-express";
import { createClient } from 'redis'
import * as path from 'path'
import * as https from 'https'
import * as fs from 'fs'
import { cyan, bold, yellow, magenta} from 'colors/safe'
import { setLoggerContext } from '@sergei-gaponik/hedo2.lib.util'

import { dropAndPopulate } from './testing/MockProducer'
import { setContext } from '@sergei-gaponik/hedo2.lib.models'
import getApolloOptions from './core/getApolloOptions'
import { PRODUCTION, VERSION } from './core/const'

async function main() {

  console.log(`${bold(magenta("SYSTEM API"))} v${VERSION}\n`)
  console.log(`env: ${PRODUCTION ? bold(cyan("PRODUCTION")) : bold(yellow("DEVELOPMENT"))}`)

  const { MONGODB_MAIN, PORT, HOST } = process.env

  console.log("connecting to mongodb...")

  const mongooseOptions = {
    useNewUrlParser: true,
    useUnifiedTopology: true,
    autoIndex: false,
    useFindAndModify: false
  }

  const mongoose = await Mongoose.connect(MONGODB_MAIN, mongooseOptions)

  console.log("connecting to redis...")

  const redisClient = createClient()

  setContext({ 
    mongoose,
    redisClient,
    env: process.env
  })

  setLoggerContext(process.env.ANALYSIS_ENDPOINT, process.env.LOGGER_SECRET, "system")

  if(!PRODUCTION && process.argv.includes("mdebug")) 
    Mongoose.set('debug', true);

  if(!PRODUCTION && process.argv.includes("populate")){
    dropAndPopulate()
    return;
  }

  console.log("initializing graphql...")

  const apolloOptions = await getApolloOptions()
  const apolloServer = new ApolloServer(apolloOptions)
  const app = express()

  apolloServer.applyMiddleware({ app });

  const sslApp = https.createServer({
    key: fs.readFileSync(path.join(__dirname, '../.ssl/localhost-key.pem')),
    cert: fs.readFileSync(path.join(__dirname, '../.ssl/localhost.pem'))
  }, app)

  sslApp.listen(PORT, () => {
    console.log(`\napp running on ${cyan(`https://${HOST}:${PORT}`)}`)
    console.log(`api endpoint ${cyan(`https://${HOST}:${PORT}/graphql`)}`)

  })
}

main()