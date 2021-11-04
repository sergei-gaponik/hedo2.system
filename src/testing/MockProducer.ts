import * as Models from '@sergei-gaponik/hedo2.lib.models'
import { CountryCode, CurrencyCode, LanguageCode, OrderStatus, PaymentMethod } from '@sergei-gaponik/hedo2.lib.models'
import * as faker from 'faker'
import { handleize } from '@sergei-gaponik/hedo2.lib.util'

const randInt = i => Math.floor(10000 * Math.random()) % i

const randRange = (min, max) => [ ...Array(randInt(max - min) + min).keys() ]

const shuffle = arr => [ ...arr.sort(() => 0.5 - Math.random()) ]

const getRandomFromList = list => list[randInt(list.length - 1)]

const getRandomReference = (collection: any, seed = null) => {

  if(!collection || !collection.length) return null;

  const _r = seed % collection.length || randInt(collection.length)
  
  return collection[_r]._id
}

const getRandomPrice = () => randInt(100) + 10.95

const getRandomReferences = (collection: any, max: number, min: number = 0) => {

  if(!collection || !collection.length) return [];

  const amount = Math.max(min, randInt(max))
  const r = randInt(1000)

  let refs = []

  for(let i = 0; i < amount; i ++)
    refs.push(getRandomReference(collection, r + i))

  return refs
}

const getRegional = () => {
  return {
    country: getRandomFromList(Object.values(CountryCode)),
    currency: getRandomFromList(Object.values(CurrencyCode)),
    language: getRandomFromList(Object.values(LanguageCode))
  }
}

const getInventoryItemTotals = (inventoryItems, q) => {
  return [...new Array(randInt(q))].map(() => ({
    inventoryItem: getRandomReference(inventoryItems),
    quantity: randInt(2) + 1
  }))
}

async function createDummyProducts(amount: number){

  let dummies = []

  const variants = await Models.VariantModel().find({}, {_id: 1})
  const productProperties = await Models.ProductPropertyModel().find({}, {_id: 1})
  const shuffledProductProperties = shuffle(productProperties)

  console.log({variants})

  for(let i = 0; i < amount; i++){

    const name = faker.commerce.productName()
    const series = faker.commerce.color()

    dummies.push({
      name,
      brand: faker.commerce.productMaterial(),
      series,
      handle: handleize(series + "-" + name),
      description: faker.commerce.productDescription(),
      variants: getRandomReferences(variants, 3, 1),
      properties: [0,1,2,3,4].map(i => ({
        value: randInt(2) % 2 ? "true" : "false",
        property: productProperties[i]._id
      }))
    })
  }
  const r = await Models.ProductModel().insertMany(dummies)

}

async function createDummyVariants(amount: number){
  
  let dummies = []

  const inventoryItems = await Models.InventoryItemModel().find({}, {_id: 1})

  for(let i = 0; i < amount; i++){

    dummies.push({
      title: `variant ${i}`,
      items: getInventoryItemTotals(inventoryItems, 3),
      availableQuantity: randInt(10)
    })
    
  }
  const r = await Models.VariantModel().insertMany(dummies)
  
}

async function createDummyInventoryItems(amount: number){
  
  let dummies = []

  for(let i = 0; i < amount; i++){

    dummies.push({
      title: `item ${i}`,
      ean: randInt(10000000000).toString().padStart(10, "0"),
      cost: getRandomPrice(),
      availableQuantity: randInt(10)
    })
  }

  const r = await Models.InventoryItemModel().insertMany(dummies)
  

}


async function createDummyUsers(amount: number){

  let dummies = []

  const orders = await Models.OrderModel().find({}, {_id: 1})

  for(let i = 0; i < amount; i++){

    dummies.push({
      regional: getRegional(),
      email: faker.internet.email(),
      orders: getRandomReferences(orders, 4),
      passwordHash: faker.random.alphaNumeric(50)
    })
  }

  const r = await Models.UserModel().insertMany(dummies)
  
}

async function createDummyProductProperties(amount){

  let dummies = []

  for(let i = 0; i < amount; i++){

    dummies.push({
      type: null,
      dataType: "boolean",
      name: faker.commerce.productAdjective(),
      description: faker.commerce.productDescription()
    })
  }

  const r = await Models.ProductPropertyModel().insertMany(dummies)
}

/**
 * drops collections from database and populates with random data
 */
async function dropAndPopulate(){

  await Models.InventoryItemModel().deleteMany({})
  await Models.VariantModel().deleteMany({})
  await Models.ProductModel().deleteMany({})
  await Models.UserModel().deleteMany({})
  await Models.OrderModel().deleteMany({})
  //await Models.ProductPropertyModel().deleteMany({})

  //await createDummyProductProperties(20)
  await createDummyInventoryItems(1000)
  await createDummyVariants(800)
  await createDummyProducts(600)
  await createDummyUsers(20)
  await createDummyUsers(30)

  process.exit()
}

export {
  dropAndPopulate
}