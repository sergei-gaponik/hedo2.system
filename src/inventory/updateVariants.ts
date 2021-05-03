import { VariantModel, getReferences, InventoryItemModel } from '@sergei-gaponik/hedo2.lib.models'


export default async function updateVariants(inventoryItemId = null){

  const variantIds = await getReferences(InventoryItemModel, VariantModel, [inventoryItemId])

  for(const variantId of variantIds){
    
    const variant = await VariantModel().findOne({ _id: variantId })
    const inventoryItemIds = variant.items.map(i => i.inventoryItem) as string[]
    const inventoryItems = await InventoryItemModel().find({ _id: { $in: inventoryItemIds }})

    let available = null;

    for(const item of variant.items){

      const { availableQuantity = 0 } = inventoryItems.find(a => a._id.toString() == item.inventoryItem.toString())
      const max = Math.floor(availableQuantity / item.quantity)

      if(available == null || available > max)
        available = max
    }

    variant.availableQuantity = available
    await variant.save()
  }
}