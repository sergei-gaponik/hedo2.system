import { buildSchema } from 'type-graphql'
import { ObjectId } from 'mongodb'
import ObjectIdScalar from './ObjectIdScalar'
import { InventoryResolver } from '../inventory/Inventory'
import { StripeResolver } from '../payments/Stripe'
import { CartResolver } from '../orders/Cart'
import { AccessResolver } from '../access/Access'
import * as path from 'path'
import { PRODUCTION } from './const'
import { AssetResolver, I18nResolver, InventoryItemResolver, LineItemResolver, OrderResolver, PaymentResolver, ProductResolver, SessionResolver, UserResolver, VariantResolver } from '@sergei-gaponik/hedo2.lib.models'
import { FastifyInstance } from 'fastify'
import mercurius from 'mercurius'
import { crc, log } from '@sergei-gaponik/hedo2.lib.util'
import { performance } from 'perf_hooks'

export default async (app: FastifyInstance) => {

  const schema = await buildSchema({ 
    resolvers: [
      InventoryResolver, 
      InventoryItemResolver,
      VariantResolver,
      AssetResolver,
      ProductResolver,
      I18nResolver,
      SessionResolver,
      UserResolver,
      OrderResolver,
      PaymentResolver,
      AccessResolver,
      LineItemResolver,
      CartResolver
    ],
    emitSchemaFile: path.resolve(__dirname, "../../schema.gql"),
    scalarsMap: [
      { 
        type: ObjectId, 
        scalar: ObjectIdScalar
      }
    ],
  })

  app.register(mercurius, {
    schema,
    graphiql: !PRODUCTION,
   // jit: 1,
    context: req => ({
      ...req,
      ts: performance.now()
    })
  })
  
  await app.ready()

  app.graphql.addHook("onResolution", async (execution, context: any) => {

    const data = execution.data
    
    let errors = context.errors || []

    if(execution.errors)
      errors = errors.concat(execution.errors.map(e => e.message))

    if(data && data.errors)
      errors = errors.concat(data.errors)

    const dataProps = data ? Object.getOwnPropertyNames(data) : null

    const _log = { 
      time: performance.now() - context.ts, 
      errors, 
      dataProps,
      query: context.body.query, 
      checksum: crc(context.body.query),
      status: context.reply.raw.statusCode
    }

    log(_log, { tags: [ "gql" ] })

  })

}
