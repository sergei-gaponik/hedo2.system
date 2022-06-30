require("reflect-metadata")

import { PRODUCTION, VERSION } from './core/const'

if(!PRODUCTION){
  require("dotenv").config()
  // require("module-alias/register")
}

import * as Mongoose from 'mongoose'
import { MongoClient } from 'mongodb'
import * as path from 'path'
import * as fs from 'fs'
import { cyan, bold, yellow, magenta} from 'colors/safe'
import { initConsole } from '@sergei-gaponik/hedo2.lib.util'
import fastify from 'fastify'
import { setContext } from '@sergei-gaponik/hedo2.lib.models'
import { setSystemContext } from './core/systemContext'
import initGraphQL from './core/initGraphQL'
import scheduler from './core/scheduler'

async function main() {

  initConsole(console)

  console.log(`${bold(magenta("SYSTEM API"))} v${VERSION}\n`)
  console.log(`env: ${PRODUCTION ? bold(cyan("PRODUCTION")) : bold(yellow("DEVELOPMENT"))}`)

  const { MONGODB_MAIN, PORT, HOST } = process.env

  console.log("connecting to mongodb...")


  const mongoose = await Mongoose.connect(MONGODB_MAIN, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
    autoIndex: false,
    useFindAndModify: false
  })

  const mongoDB = await MongoClient.connect(MONGODB_MAIN, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  }).then(client => client.db());

  setContext({ mongoose, env: process.env })
  setSystemContext({ mongoDB })

  if(!PRODUCTION && process.argv.includes("mdebug")) 
    Mongoose.set('debug', true);

  console.log("initializing graphql server...")

  const app = fastify({
    https: {
      key: fs.readFileSync(path.join(__dirname, '../.ssl/key.pem')),
      cert: fs.readFileSync(path.join(__dirname, '../.ssl/cert.pem'))
    }
  })

  await initGraphQL(app)

  console.log("initializing scheduler...")

  scheduler()

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`app running on ${cyan(`https://${HOST}:${PORT}`)}`)
    console.log(`api endpoint ${cyan(`https://${HOST}:${PORT}/graphql`)}`)
    
    if(!PRODUCTION)
      console.log(`graphql playground ${cyan(`https://${HOST}:${PORT}/graphiql`)}\n`)
  })
}

main()