import { buildSchema } from 'type-graphql'
import { ObjectId } from 'mongodb'
import ObjectIdScalar from './ObjectIdScalar'
import { InventoryResolver } from '../inventory/Inventory'
import { StripeResolver } from '../payments/Stripe'
import { AccessResolver } from '../access/Access'
import * as path from 'path'
import { PRODUCTION } from './const'
import { PageResolver, ArticleResolver, ProductCategoryResolver, I18nResolver, InventoryItemResolver, ProductPropertyResolver, LineItemResolver, OrderResolver, PaymentResolver, ProductResolver, ProductPropertyCategoryResolver, SessionResolver, UserResolver, VariantResolver, ProductKeywordResolver, ProductIngredientResolver, BrandResolver, SeriesResolver } from '@sergei-gaponik/hedo2.lib.models'
import { FastifyInstance } from 'fastify'
import mercurius from 'mercurius'
import { crc, log } from '@sergei-gaponik/hedo2.lib.util'
import { performance } from 'perf_hooks'
import fastifyCors from 'fastify-cors';

export default async (app: FastifyInstance) => {

  const schema = await buildSchema({ 
    resolvers: [
      PageResolver,
      ArticleResolver,
      InventoryResolver, 
      InventoryItemResolver,
      VariantResolver,
      ProductResolver,
      ProductPropertyResolver,
      ProductPropertyCategoryResolver,
      ProductCategoryResolver,
      ProductKeywordResolver,
      ProductIngredientResolver,
      I18nResolver,
      SessionResolver,
      UserResolver,
      OrderResolver,
      PaymentResolver,
      AccessResolver,
      LineItemResolver,
      BrandResolver,
      SeriesResolver
    ],
    emitSchemaFile: path.resolve(__dirname, "../../schema.gql"),
    scalarsMap: [
      { 
        type: ObjectId, 
        scalar: ObjectIdScalar
      }
    ],
  })

  app.register(fastifyCors);

  app.register(mercurius, {
    schema,
    graphiql: !PRODUCTION,
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
    const ok = !errors.length && context.reply.raw.statusCode < 400

    const _log = { 
      ok,
      errors: JSON.stringify(errors), 
      execTime: performance.now() - context.ts, 
      dataProps,
      query: context.body.query, 
      checksum: crc(context.body.query)
    }

    log(_log, { index: "logs_system_gql", silent: PRODUCTION })
  })

}
