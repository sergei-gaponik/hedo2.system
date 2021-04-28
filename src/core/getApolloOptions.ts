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


export default async () => ({
  schema: await buildSchema({ 
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
  }),
  tracing: !PRODUCTION,
  playground: !PRODUCTION,

})