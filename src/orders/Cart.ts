import { Arg, Field, Mutation, ObjectType, Resolver, registerEnumType, InputType, ArgsType, Args } from "type-graphql"
import { LineItemInput, VariantTotalInput, LineItem, SessionModel, LineItemModel, Variant, VariantModel, Session, LineItemStatus } from '@sergei-gaponik/hedo2.lib.models'
import { getAccessToken } from '../access/Access'
import { LINE_ITEM_EXPIRATION } from '../core/const'


//#region Errors
enum UpdateCartError {
  internalServerError,
  lineItemsNotUnique,
  sessionNotFound,
  cantGetAccessToken,
  quantityNotAvailable,
  lineItemNotFound,
  variantNotFound
}

enum AddToCartError {
  internalServerError,
  variantsNotUnique,
  sessionNotFound,
  cantGetAccessToken,
  quantityNotAvailable,
  variantNotFound
}

registerEnumType(UpdateCartError, { name: "UpdateCartError" })
registerEnumType(AddToCartError, { name: "AddToCartError" })

//#endregion

//#region Responses

@ObjectType()
class UpdateCartResponse {

  @Field({ nullable: true })
  public accessToken?: string

  @Field(() => [UpdateCartError], { nullable: true })
  public errors?: UpdateCartError[]
}

@ObjectType()
class AddToCartResponse {

  @Field({ nullable: true })
  public accessToken?: string

  @Field(() => [AddToCartError], { nullable: true })
  public errors?: AddToCartError[]
}
//#endregion

//#region Args

@InputType()
class LineItemTotalInput{
  
  @Field({ description: "ObjectId" })
  lineItem: string
  
  @Field()
  quantity: number
}

@ArgsType()
class UpdateCartArgs {
  
  @Field(() => [LineItemTotalInput])
  public lineItemTotals: LineItemTotalInput[]
  
  @Field()
  public sessionId: string
}

@ArgsType()
class AddToCartArgs {
  @Field(() => [VariantTotalInput])
  public variantTotals: VariantTotalInput[]
  
  @Field()
  public sessionId: string
}

//#endregion

async function createLineItem(variant: Variant, session: Session, quantity: number){

  const lineItem: LineItemInput = {
    status: LineItemStatus.cart,
    session: session._id,
    variant: variant._id,
    quantity: quantity,
    title: variant.title,
    image: variant.images[0] as string,
    expiration: Date.now() + LINE_ITEM_EXPIRATION
  }

  return await LineItemModel().create(lineItem as LineItem)

}

@Resolver()
class CartResolver {


  //#region UpdateCart

  @Mutation(() => UpdateCartResponse)
  async updateCart(
    @Args() { lineItemTotals, sessionId }: UpdateCartArgs
  ): Promise<UpdateCartResponse> {

    let response = new UpdateCartResponse()

    if(new Set(lineItemTotals.map(a => a.lineItem)).size != lineItemTotals.length){

      response.errors = [ UpdateCartError.lineItemsNotUnique ]
      return response;
    }

    try{

      const session = await SessionModel().findById(sessionId)

      if(!session){
        response.errors = [ UpdateCartError.sessionNotFound ]
        return response;
      }

      if(lineItemTotals.some(a => !session.lineItems.find(b => b.toString() == a.lineItem))){
        response.errors = [ UpdateCartError.lineItemNotFound ]
        return response;
      }
      
      const currentLineItems = await LineItemModel().find({ _id: { $in: session.lineItems as string[] }})
      const variants = await VariantModel().find({ _id: { $in: currentLineItems.map(a => a.variant) as string[] }})

      for(const lineItemTotal of lineItemTotals){

        const lineItem = currentLineItems.find(a => a._id == lineItemTotal.lineItem)
        const variant = variants.find(a => a._id == lineItem.variant.toString())

        if(!variant){
          response.errors = [ UpdateCartError.variantNotFound ]
          return response;
        }

        if(variant.availableQuantity < lineItemTotal.quantity){
          response.errors = [ UpdateCartError.quantityNotAvailable ]
          return response;
        }
      }
      
      let updateSessionFlag = false

      for(const lineItemTotal of lineItemTotals){

        const lineItem = currentLineItems.find(a => a._id == lineItemTotal.lineItem)
        const variant = variants.find(a => a._id == lineItem.variant.toString())

        if(lineItemTotal.quantity <= 0){
          
          session.lineItems = session.lineItems.filter(a => a.toString() != lineItem._id)

          await lineItem.remove()

          updateSessionFlag = true
        }
        else if(lineItem.expiration > Date.now()){
          
          const { _id } = await createLineItem(variant, session, lineItemTotal.quantity)

          session.lineItems = session.lineItems.filter(a => a.toString() != lineItem._id)
          session.lineItems.push(_id)

          updateSessionFlag = true
        }
        else{

          lineItem.quantity = lineItemTotal.quantity
          await lineItem.save()
        }
      }

      if(updateSessionFlag){
        
        await session.save()
        
        const accessTokenResponse = await getAccessToken(session)
  
        if(accessTokenResponse.errors){
          response.errors = [ UpdateCartError.cantGetAccessToken ]
          return response;
        }
  
        response.accessToken = accessTokenResponse.accessToken
      }
    }
    catch(e){
      response.errors = [ UpdateCartError.internalServerError ]
    }

    return response;
  }
  //#endregion
  
  //#region AddToCart

  @Mutation(() => AddToCartResponse)
  async addToCart(
    @Args() { variantTotals, sessionId }: AddToCartArgs
  ): Promise<AddToCartResponse> {

    let response = new AddToCartResponse()

    if(new Set(variantTotals.map(a => a.variant)).size != variantTotals.length){

      response.errors = [ AddToCartError.variantsNotUnique ]
      return response;
    }

    try{

      const session = await SessionModel().findById(sessionId)

      if(!session){
        response.errors = [ AddToCartError.sessionNotFound ]
        return response;
      }

      const [ currentLineItems, variants ] = await Promise.all([

        ( async () => await LineItemModel().find({ _id: { $in: session.lineItems as string[] }}))(),
        ( async () => await VariantModel().find({ _id: { $in: variantTotals.map(a => a.variant) }}))()
      ])

      if(variantTotals.length != variants.length){
        response.errors = [ AddToCartError.variantNotFound ]
        return response;
      }

      
      for(const variant of variants){
        
        const currentLineItem = currentLineItems.find(a => a.variant.toString() == variant._id.toString())
        const variantQuantity = variantTotals.find(a => a.variant.toString() == variant._id.toString()).quantity
        const currentQuantity = currentLineItem?.quantity || 0
        
        if(variant.availableQuantity < variantQuantity + currentQuantity){
          response.errors = [ AddToCartError.quantityNotAvailable ]
          return response;
        }
      }
      
      let updateSessionFlag = false
      
      for(const variant of variants){

        const currentLineItem = currentLineItems.find(a => a.variant.toString() == variant._id.toString())
        const variantQuantity = variantTotals.find(a => a.variant.toString() == variant._id.toString()).quantity
        
        if(currentLineItem){

          if(currentLineItem.expiration > Date.now()){

            const quantity = variantQuantity + currentLineItem.quantity

            await currentLineItem.remove()

            const { _id } = await createLineItem(variant, session, quantity)
            session.lineItems = session.lineItems.filter(a => a != currentLineItem._id)
            session.lineItems.push(_id)

            updateSessionFlag = true;
          }
          else{
            currentLineItem.quantity += variantQuantity
            await currentLineItem.save()
          }
        }
        else{
          const { _id } = await createLineItem(variant, session, variantQuantity)
          session.lineItems.push(_id)

          updateSessionFlag = true;
        }

      }

      if(updateSessionFlag){

        await session.save()

        const accessTokenResponse = await getAccessToken(session)

        if(accessTokenResponse.errors){
          response.errors = [ AddToCartError.cantGetAccessToken ]
          return response;
        }

        response.accessToken = accessTokenResponse.accessToken
      }
    }
    catch(e){
      console.log(e)
      response.errors = [ AddToCartError.internalServerError ]
    }

    return response;
  }
  //#endregion
}

export {
  CartResolver
}