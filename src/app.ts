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

import { dropAndPopulate } from './testing/MockProducer'
import { setContext } from '@sergei-gaponik/hedo2.lib.models'
import getApolloOptions from './core/getApolloOptions'
import { MONGODB_MAIN, PORT, PRODUCTION } from './core/const'

async function main() {

  console.log("connecting to mongodb...")

  const mongooseOptions = {
    useNewUrlParser: true,
    useUnifiedTopology: true,
    autoIndex: false
  }

  const mongoose = await Mongoose.connect(MONGODB_MAIN, mongooseOptions)

  console.log("connecting to redis...")

  const redisClient = createClient()

  setContext({ 
    mongoose,
    redisClient,
    env: process.env
  })

  // dropAndPopulate()
  // return;

  if(!PRODUCTION) Mongoose.set('debug', true);
  console.log("initializing graphql...")

  const apolloOptions = await getApolloOptions()
  const apolloServer = new ApolloServer(apolloOptions)
  const app = express()

  apolloServer.applyMiddleware({ app });

  const sslApp = https.createServer({
    key: fs.readFileSync(path.join(__dirname, '../.ssl/localhost-key.pem')),
    cert: fs.readFileSync(path.join(__dirname, '../.ssl/localhost.pem'))
  }, app)

  sslApp.listen(PORT, () => console.log(`app running on port ${PORT}`))
}

main()