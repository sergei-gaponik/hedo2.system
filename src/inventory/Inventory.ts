import { Arg, Field, Mutation, ObjectType, Resolver, registerEnumType } from "type-graphql"
import * as Models from '@sergei-gaponik/hedo2.lib.models'

enum SetInventoryItemQuantityError {
  databaseError,
  newQuantityCantBeNegative
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
export default class InventoryResolver {

  @Mutation(() => SetInventoryItemQuantityResponse)
  async setInventoryItemQuantity(
    @Arg("relative", { 
      nullable: true, 
      description: "if set to true new quantity will be calculated relative to old" 
    }) relative: boolean = false,
    @Arg("ean") ean: string,
    @Arg("quantity") quantity: number
  ): Promise<SetInventoryItemQuantityResponse> {

    let response = new SetInventoryItemQuantityResponse()
    let errors = []

    if(!relative && quantity < 0)
      errors.push(SetInventoryItemQuantityError.newQuantityCantBeNegative)

    if(errors.length){
      response.errors = errors
      return response;
    }

    try{
      const filter = { ean }
      const update = relative
        ? { $inc: { quantity }}
        : { $set: { quantity } }
      const options = { new: true }

      const item = await Models.InventoryItemModel().findOneAndUpdate(filter, update, options)

      if(item.quantity < 0){

        const undo = { $inc: { quantity: -quantity } }

        await Models.InventoryItemModel().findOneAndUpdate(filter, undo)

        response.errors = [ SetInventoryItemQuantityError.newQuantityCantBeNegative ]
      }
      else {
        response.updatedQuantity = item.quantity
      }
    }
    catch(e){
      response.errors = [ SetInventoryItemQuantityError.databaseError ]
    }

    return response;
  }
}