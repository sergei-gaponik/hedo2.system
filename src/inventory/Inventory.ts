import { Arg, Field, Mutation, ObjectType, Resolver, registerEnumType } from "type-graphql"
import { InventoryItemModel } from '@sergei-gaponik/hedo2.lib.models'
import updateVariants from "./updateVariants"

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
export default class InventoryResolver {

  @Mutation(() => SetInventoryItemQuantityResponse)
  async setInventoryItemQuantity(
    @Arg("relative", { 
      nullable: true, 
      description: "if set to true new quantity will be calculated relative to old" 
    }) relative: boolean = false,
    @Arg("ean", { nullable: true }) ean: string,
    @Arg("_id", { nullable: true }) _id: string,
    @Arg("quantity") quantity: number
  ): Promise<SetInventoryItemQuantityResponse> {

    let response = new SetInventoryItemQuantityResponse()
    let errors = []

    if(ean && _id)
      errors.push(SetInventoryItemQuantityError.tooManyArguments)

    if(!relative && quantity < 0)
      errors.push(SetInventoryItemQuantityError.newQuantityCantBeNegative)

    if(errors.length){
      response.errors = errors
      return response;
    }

    try{
      const filter = ean ? { ean } : { _id }
      const update = relative
        ? { $inc: { availableQuantity: quantity }}
        : { $set: { availableQuantity: quantity } }
      const options = { new: true }

      const item = await InventoryItemModel().findOneAndUpdate(filter, update, options)

      if(item.availableQuantity < 0){

        const undo = { $inc: { availableQuantity: -quantity } }

        await InventoryItemModel().findOneAndUpdate(filter, undo)

        response.errors = [ SetInventoryItemQuantityError.newQuantityCantBeNegative ]
      }
      else {
        updateVariants(item._id)

        response.updatedQuantity = item.availableQuantity
      }
    }
    catch(e){
      response.errors = [ SetInventoryItemQuantityError.databaseError ]
    }

    return response;
  }
}