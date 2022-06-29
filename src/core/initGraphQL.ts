import { buildSchema } from 'type-graphql'
import { ObjectId } from 'mongodb'
import ObjectIdScalar from './ObjectIdScalar'
import * as path from 'path'
import { PRODUCTION } from './const'
import * as models from '@sergei-gaponik/hedo2.lib.models'
import { FastifyInstance } from 'fastify'
import mercurius from 'mercurius'
import { crc } from '@sergei-gaponik/hedo2.lib.util'
import { performance } from 'perf_hooks'
import fastifyCors from 'fastify-cors';

export default async (app: FastifyInstance) => {

  const schema = await buildSchema({ 
    nullableByDefault: true,
    resolvers: [
      models.PageResolver,
      models.ArticleResolver,
      models.VariantResolver,
      models.ProductResolver,
      models.ProductPropertyResolver,
      models.ProductPropertyCategoryResolver,
      models.ProductCategoryResolver,
      models.ProductKeywordResolver,
      models.ProductImageResolver,
      models.ProductIngredientResolver,
      models.UserResolver,
      models.OrderResolver,
      models.BrandResolver,
      models.SeriesResolver,
      models.ShippingMethodResolver,
      models.CustomPageResolver,
      models.FrontPageSectionResolver,
      models.BannerResolver
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

    let _log: any = { 
      execTime: Math.round((performance.now() - context.ts) * 100) / 100, 
      query: context.body.query.trim().slice(0,50),
      crc: crc(context.body.query + context.body.variables)
    }

    if(errors?.length)
      _log.errors = errors

    const properties = Object.getOwnPropertyNames(data)

    if(properties.length && Array.isArray(data[properties[0]])){
      _log.items = data[properties[0]].length
    }

    console.log(_log)
  })

}
