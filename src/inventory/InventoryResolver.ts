import { Arg, Field, Mutation, ObjectType, Resolver, registerEnumType } from "type-graphql"
import Models from '@sergei-gaponik/hedo2.lib.models'

enum SetInventoryItemQuantityError {
  error1
}

registerEnumType(SetInventoryItemQuantityError, {
  name: "SetInventoryItemQuantityError"
})

@ObjectType()
class SetInventoryItemQuantityResponse {

  @Field(() => Models.InventoryItem)
  public inventoryItem?: typeof Models.InventoryItem

  @Field(() => [SetInventoryItemQuantityError])
  public errors?: SetInventoryItemQuantityError[]
}

@Resolver()
export default class InventoryResolver {

  @Mutation(() => SetInventoryItemQuantityResponse)
  async setInventoryItemQuantity(
    @Arg("absolute", { nullable: true }) absolute: number,
    @Arg("relative", { nullable: true }) relative: number
  ): Promise<SetInventoryItemQuantityResponse> {

    return new SetInventoryItemQuantityResponse()
  }
}