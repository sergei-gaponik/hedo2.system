import { Arg, Field, Mutation, ObjectType, Resolver, registerEnumType } from "type-graphql"
import { PaymentModel, OrderInput } from '@sergei-gaponik/hedo2.lib.models'

enum SetInventoryItemQuantityError {
  databaseError,
  newQuantityCantBeNegative,
  tooManyArguments
}

registerEnumType(SetInventoryItemQuantityError, { name: "SetInventoryItemQuantityError" })


@ObjectType()
class SetInventoryItemQuantityResponse {

  @Field({ nullable: true })
  public updatedQuantity?: number

  @Field(() => [SetInventoryItemQuantityError], { nullable: true })
  public errors?: SetInventoryItemQuantityError[]
}

@Resolver()
class StripeResolver {

  @Mutation(() => SetInventoryItemQuantityResponse, {
    description: ""
  })
  async createStripeCheckoutSession(
    @Arg("order") order: OrderInput,
  ): Promise<SetInventoryItemQuantityResponse> {

    let response = new SetInventoryItemQuantityResponse()

    try{

      
    }
    catch(e){
      response.errors = [ SetInventoryItemQuantityError.databaseError ]
    }

    return response;
  }
}

export {
  StripeResolver
}