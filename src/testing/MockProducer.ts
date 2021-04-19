import * as Models from '@sergei-gaponik/hedo2.lib.models'
import * as faker from 'faker'

const getRandomReferences = (collection: any, max: number, min: number = 0) => {

  const amount = Math.max(min, Math.floor(1000 * Math.random()) % max)
  const r = Math.floor(1000 * Math.random())

  let refs = []

  for(let i = 0; i < amount; i ++)
    if(collection[(r + i) %  collection.length]._id)
      refs.push(collection[(r + i) %  collection.length]._id)

  return refs
}

async function createDummyProducts(amount: number){

  let dummies = []

  const variants = await Models.VariantModel().find({}, {_id: 1})
  const assets = await Models.AssetModel().find({}, {_id: 1})

  console.log({variants, assets})

  for(let i = 0; i < amount; i++){

    dummies.push({
      title: faker.commerce.productName(),
      description: faker.commerce.productDescription(),
      variants: getRandomReferences(variants, 3, 1),
      images: getRandomReferences(assets, 3, 1)
    })
  }
  const r = await Models.ProductModel().insertMany(dummies)

  console.log(r)
}

async function createDummyVariants(amount: number){
  
  let dummies = []

  const inventoryItems = await Models.InventoryItemModel().find({}, {_id: 1})
  const assets = await Models.AssetModel().find({}, {_id: 1})

  console.log({inventoryItems, assets})
  

  for(let i = 0; i < amount; i++){

    dummies.push({
      title: `variant ${i}`,
      inventoryItems: getRandomReferences(inventoryItems, 4, 1),
      images: getRandomReferences(assets, 3)
    })
    
  }
  const r = await Models.VariantModel().insertMany(dummies)
  
  console.log(r)

}

async function createDummyInventoryItems(amount: number){
  
  let dummies = []

  for(let i = 0; i < amount; i++){

    dummies.push({
      title: `item ${i}`,
      ean: Math.ceil((Math.random() * 10000000000)).toString().padStart(10, "0"),
      cost: Math.ceil(Math.random() * 100 + 10) + 0.95,
      quantity: Math.floor(Math.random() * 10)
    })
  }

  const r = await Models.InventoryItemModel().insertMany(dummies)
  
  console.log(r)

}

async function createDummyAssets(amount: number){

  let dummies = []

  for(let i = 0; i < amount; i++){

    const types = Object.keys(Models.MIMEType)
    const type = types[i % types.length]

    dummies.push({
      src: faker.image.imageUrl(),
      type
    })
  }

  const r = await Models.AssetModel().insertMany(dummies)
  
  console.log(r)
}

async function populate(){
  await createDummyInventoryItems(1000)
  await createDummyAssets(500)
  await createDummyVariants(800)
  await createDummyProducts(600)
}

export {
  populate,
  createDummyProducts,
  createDummyVariants,
  createDummyInventoryItems,
  createDummyAssets
}