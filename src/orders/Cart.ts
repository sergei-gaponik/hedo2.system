// DEPRECATED


// import { Field, Mutation, ObjectType, Resolver, registerEnumType, InputType, ArgsType, Args } from "type-graphql"
// import { LineItemInput, VariantTotalInput, LineItem, SessionModel, LineItemModel, Variant, VariantModel, Session, LineItemStatus, LineItemTotalInput } from '@sergei-gaponik/hedo2.lib.models'
// import { getAccessToken } from '../access/Access'
// import { LINE_ITEM_EXPIRATION } from '../core/const'
// import { log, decrypt } from '@sergei-gaponik/hedo2.lib.util'
// import { errors } from "@typegoose/typegoose"


// //#region Errors
// enum UpdateCartError {
//   internalServerError,
//   lineItemsNotUnique,
//   sessionNotFound,
//   cantGetAccessToken,
//   quantityNotAvailable,
//   lineItemNotFound,
//   variantNotFound
// }

// enum AddToCartError {
//   internalServerError,
//   variantsNotUnique,
//   sessionNotFound,
//   cantGetAccessToken,
//   quantityNotAvailable,
//   variantNotFound
// }

// registerEnumType(UpdateCartError, { name: "UpdateCartError" })
// registerEnumType(AddToCartError, { name: "AddToCartError" })

// //#endregion

// //#region Responses

// @ObjectType()
// class UpdateCartResponse {

//   @Field({ nullable: true })
//   public accessToken?: string

//   @Field(() => [UpdateCartError], { nullable: true })
//   public errors?: UpdateCartError[]
// }

// @ObjectType()
// class AddToCartResponse {

//   @Field({ nullable: true })
//   public accessToken?: string

//   @Field(() => [AddToCartError], { nullable: true })
//   public errors?: AddToCartError[]
// }
// //#endregion

// //#region Args

// @ArgsType()
// class UpdateCartArgs {
  
//   @Field(() => [LineItemTotalInput])
//   public lineItemTotals: LineItemTotalInput[]
  
//   @Field()
//   public sessionId: string
// }

// @ArgsType()
// class AddToCartArgs {
//   @Field(() => [VariantTotalInput])
//   public variantTotals: VariantTotalInput[]
  
//   @Field()
//   public sessionId: string
// }

// //#endregion

// async function createLineItem(variant: Variant, session: Session, quantity: number, productId: string){

//   const lineItem: LineItemInput = {
//     status: LineItemStatus.cart,
//     session: session._id,
//     variant: variant._id,
//     product: productId,
//     price: variant.price,
//     quantity: quantity,
//     title: variant.title,
//     image: variant.images[0] as string,
//     expiration: Date.now() + LINE_ITEM_EXPIRATION
//   }

//   return await LineItemModel().create(lineItem as LineItem)

// }

// @Resolver()
// class CartResolver {


//   //#region UpdateCart

//   @Mutation(() => UpdateCartResponse)
//   async updateCart(
//     @Args() { lineItemTotals, sessionId }: UpdateCartArgs
//   ): Promise<UpdateCartResponse> {

//     const _r = await (async () => {

//       if(new Set(lineItemTotals.map(a => a.lineItem)).size != lineItemTotals.length)
//         return { errors: [ UpdateCartError.lineItemsNotUnique ] };

//       try{
//         const session = await SessionModel().findById(sessionId)

//         if(!session)
//           return { errors: [ UpdateCartError.sessionNotFound ] }

//         if(lineItemTotals.some(a => !session.lineItems.find(b => b.toString() == a.lineItem)))
//           return { errors: [ UpdateCartError.lineItemNotFound ] }
        
//         const currentLineItems = await LineItemModel().find({ _id: { $in: session.lineItems as string[] }})
//         const variants = await VariantModel().find({ _id: { $in: currentLineItems.map(a => a.variant) as string[] }})

//         for(const lineItemTotal of lineItemTotals){

//           const lineItem = currentLineItems.find(a => a._id == lineItemTotal.lineItem)
//           const variant = variants.find(a => a._id == lineItem.variant.toString())

//           if(!variant)
//             return { errors: [ UpdateCartError.lineItemNotFound ]}

//           if(variant.availableQuantity < lineItemTotal.quantity)
//             return { errors: [ UpdateCartError.quantityNotAvailable ] }
//         }
      
//         let updateSessionFlag = false

//         for(const lineItemTotal of lineItemTotals){

//           console.log(lineItemTotal)

//           const lineItem = currentLineItems.find(a => a._id == lineItemTotal.lineItem)
//           const variant = variants.find(a => a._id == lineItem.variant.toString())

//           if(lineItemTotal.quantity <= 0){
            
//             session.lineItems = session.lineItems.filter(a => a.toString() != lineItem._id)

//             await lineItem.remove()

//             updateSessionFlag = true
//           }
//           else if(lineItem.expiration > Date.now()){
            
//             const { _id } = await createLineItem(variant, session, lineItemTotal.quantity, lineItem.product.toString())

//             session.lineItems = session.lineItems.filter(a => a.toString() != lineItem._id)
//             session.lineItems.push(_id)

//             updateSessionFlag = true
//           }
//           else{

//             lineItem.quantity = lineItemTotal.quantity
//             await lineItem.save()
//           }
//         }

//         if(updateSessionFlag){
          
//           await session.save()
          
//           const r = await getAccessToken(session)
    
//           if(r.errors)
//             return { errors: [ UpdateCartError.cantGetAccessToken ] }
    
//           return { accessToken: r.accessToken }
//         }

//         return {}
//       }
//       catch(e){
//         return { errors: [ UpdateCartError.internalServerError ] }
//       }
      
//     })()

//     log({ ..._r, lineItemTotals, sessionId }, { tags: [ "cart", "updateCart" ] })

//     return _r
//   }
//   //#endregion
  
//   //#region AddToCart

//   @Mutation(() => AddToCartResponse)
//   async addToCart(
//     @Args() { variantTotals, sessionId }: AddToCartArgs
//   ): Promise<AddToCartResponse> {

//     const _r = await (async () => {

//       if(new Set(variantTotals.map(a => a.variant)).size != variantTotals.length)
//         return { errors: [ AddToCartError.variantsNotUnique ]}
  
//       try{
  
//         const session = await SessionModel().findById(sessionId)
  
//         if(!session)
//           return { errors: [ AddToCartError.sessionNotFound ] };
  
//         const [ currentLineItems, variants ] = await Promise.all([
  
//           ( async () => await LineItemModel().find({ _id: { $in: session.lineItems as string[] }}))(),
//           ( async () => await VariantModel().find({ _id: { $in: variantTotals.map(a => a.variant) }}))()
//         ])
  
//         if(variantTotals.length != variants.length)
//           return { errors: [ AddToCartError.variantNotFound ] }
        
//         for(const variant of variants){

//           const currentLineItem = currentLineItems.find(a => a.variant.toString() == variant._id.toString())
//           const variantQuantity = variantTotals.find(a => a.variant.toString() == variant._id.toString()).quantity
//           const currentQuantity = currentLineItem?.quantity || 0
          
//           if(variant.availableQuantity < variantQuantity + currentQuantity)
//             return { errors:  [ AddToCartError.quantityNotAvailable ] }
//         }
        
//         let updateSessionFlag = false
        
//         for(const variant of variants){

//           const _variantTotal = variantTotals.find(a => a.variant.toString() == variant._id.toString())
  
//           const currentLineItem = currentLineItems.find(a => a.variant.toString() == variant._id.toString())
//           const variantQuantity = _variantTotal.quantity
//           const product = _variantTotal.product

//           if(currentLineItem){
  
//             if(currentLineItem.expiration < Date.now()){
  
//               const quantity = variantQuantity + currentLineItem.quantity
  
//               await currentLineItem.remove()
              
//               const { _id } = await createLineItem(variant, session, quantity, product)
//               session.lineItems = session.lineItems.filter(a => a.toString() != currentLineItem._id)

//               session.lineItems.push(_id)
  
//               updateSessionFlag = true;
//             }
//             else{
//               currentLineItem.quantity += variantQuantity
//               await currentLineItem.save()
//             }
//           }
//           else{
//             const { _id } = await createLineItem(variant, session, variantQuantity, product)
//             session.lineItems.push(_id)
  
//             updateSessionFlag = true;
//           }
  
//         }
  
//         if(updateSessionFlag){
  
//           const r = await session.save()

//           const accessTokenResponse = await getAccessToken(session)
  
//           if(accessTokenResponse.errors)
//             return { errors: [ AddToCartError.cantGetAccessToken ] } 
  
//           return { accessToken: accessTokenResponse.accessToken }
//         }

//         return {}
//       }
//       catch(e){
//         console.log(e)
//         return { errors: [ AddToCartError.internalServerError ] }
//       }

//     })()

//     log({ ..._r, variantTotals, sessionId }, { tags: [ "cart", "addToCart" ] })

//     return _r
//   }
//   //#endregion
// }

// export {
//   CartResolver
// }