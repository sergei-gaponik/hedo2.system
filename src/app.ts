require("module-alias/register")
require("reflect-metadata")
require("dotenv").config()

import * as Mongoose from 'mongoose'
import * as express from 'express'
import InventoryResolver from './inventory/InventoryResolver'
import { graphqlHTTP } from 'express-graphql'
import { buildSchema } from 'type-graphql'
import Models from '@sergei-gaponik/hedo2.lib.models'
import { TypegooseMiddleware } from './util/TypegooseMiddleware'
import * as path from 'path'

async function main() {

  const { MONGODB_HOST, MONGODB_NAME, PORT, NODE_ENV } = process.env

  const PRODUCTION = NODE_ENV == "production"

  await Mongoose.connect(MONGODB_HOST, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
    dbName: MONGODB_NAME
  })

  if(!PRODUCTION) Mongoose.set('debug', true);

  const app = express()

  app.use(graphqlHTTP({ 
    schema: await buildSchema({ 
      resolvers: [
        InventoryResolver, 
        Models.InventoryItemResolver
      ],
      globalMiddlewares: [TypegooseMiddleware],
      emitSchemaFile: path.resolve(__dirname, "schema.gql")
    }), 
    graphiql: true 
  }))

  app.listen(PORT, () => console.log(`app running on port ${PORT}`))
}

main()