import { buildSchema } from 'type-graphql'
import { ObjectId } from 'mongodb'
import ObjectIdScalar from './ObjectIdScalar'
import InventoryResolver from '../inventory/Inventory'
import * as Models from '@sergei-gaponik/hedo2.lib.models'
import * as path from 'path'
import { PRODUCTION } from './const'


export default async () => ({
  schema: await buildSchema({ 
    resolvers: [
      InventoryResolver, 
      Models.InventoryItemResolver,
      Models.VariantResolver,
      Models.AssetResolver,
      Models.ProductResolver,
      Models.I18nResolver,
      Models.SessionResolver,
      Models.UserResolver
    ],
    emitSchemaFile: path.resolve(__dirname, "../../schema.gql"),
    scalarsMap: [
      { 
        type: ObjectId, 
        scalar: ObjectIdScalar
      }
    ],
  }),
  tracing: !PRODUCTION,
  playground: !PRODUCTION,

})