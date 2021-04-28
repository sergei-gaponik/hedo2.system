import * as Models from '@sergei-gaponik/hedo2.lib.models'
import { CountryCode, CurrencyCode, LanguageCode, OrderStatus, PaymentMethod, PaymentProvider, PaymentStatus } from '@sergei-gaponik/hedo2.lib.models'
import * as faker from 'faker'

const randInt = i => Math.floor(10000 * Math.random()) % i

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

}

async function createDummyVariants(amount: number){
  
  let dummies = []

  const inventoryItems = await Models.InventoryItemModel().find({}, {_id: 1})
  const assets = await Models.AssetModel().find({}, {_id: 1})

  for(let i = 0; i < amount; i++){

    dummies.push({
      title: `variant ${i}`,
      items: getInventoryItemTotals(inventoryItems, 3),
      images: getRandomReferences(assets, 3),
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

async function createDummySessions(amount: number){

  let dummies = []

  const users = await Models.UserModel().find({}, {_id: 1})
  const lineItems = await Models.LineItemModel().find({}, {_id: 1})


  for(let i = 0; i < amount; i++){

    dummies.push({
      regional: getRegional(),
      start: Date.now() - randInt(100000),
      end: Date.now() + randInt(100000),
      user: getRandomReference(users),
      lineItems: getRandomReferences(lineItems, 3)
    })
  }

  const r = await Models.SessionModel().insertMany(dummies)
  
}

async function createDummyPayments(amount: number){

  let dummies = []

  const users = await Models.PaymentModel().find({}, {_id: 1})

  for(let i = 0; i < amount; i++){

    dummies.push({
      paymentProvider: getRandomFromList(Object.values(PaymentProvider)),
      paymentMethod: getRandomFromList(Object.values(PaymentMethod)),
      status: getRandomFromList(Object.values(PaymentStatus)),
    })
  }

  const r = await Models.PaymentModel().insertMany(dummies)
  
}

async function createDummyLineItems(amount: number){

  let dummies = []

  const inventoryItems = await Models.InventoryItemModel().find({}, {_id: 1})
  const variants = await Models.VariantModel().find({}, {_id: 1})
  const assets = await Models.AssetModel().find({}, {_id: 1})
  
  for(let i = 0; i < amount; i++){
    const p = getRandomPrice()
    dummies.push({
      items: getInventoryItemTotals(inventoryItems, 3),
      price: p,
      compareToPrice: randInt(3) == 1 ? p + 5 : p,
      priceWithoutTaxes: p / 1.19,
      title: faker.commerce.productName(),
      variant: getRandomReference(variants),
      image: getRandomReference(assets),
      quantity: randInt(3) + 1
    })
  }

  const r = await Models.LineItemModel().insertMany(dummies)


  console.log(r)
}

async function createDummyOrders(amount: number){

  let dummies = []

  const sessions = await Models.SessionModel().find({}, {_id: 1})
  const payments = await Models.PaymentModel().find({}, {_id: 1})
  //const shipments = await Models.ShipmentModel().find({}, {_id: 1})
  const lineItems = await Models.LineItemModel().find({}, {_id: 1})
  


  for(let i = 0; i < amount; i++){

    dummies.push({
      status: getRandomFromList(Object.values(OrderStatus)),
      session: getRandomReference(sessions),
      payments: getRandomReferences(payments, 1, 1),
      lineItems: getRandomReferences(lineItems, 3, 1),
      total: getRandomPrice()
    })
  }

  const r = await Models.OrderModel().insertMany(dummies)
  
}

/**
 * drops all collections from database and populates with random data
 */
async function dropAndPopulate(){

  await Models.InventoryItemModel().deleteMany({})
  await Models.AssetModel().deleteMany({})
  await Models.VariantModel().deleteMany({})
  await Models.ProductModel().deleteMany({})
  await Models.LineItemModel().deleteMany({})
  await Models.UserModel().deleteMany({})
  await Models.SessionModel().deleteMany({})
  await Models.PaymentModel().deleteMany({})
  await Models.OrderModel().deleteMany({})

  await createDummyInventoryItems(1000)
  await createDummyAssets(500)
  await createDummyVariants(800)
  await createDummyProducts(600)
  await createDummyLineItems(100)
  await createDummyUsers(20)
  await createDummySessions(100)
  await createDummyPayments(300)
  await createDummyOrders(300)
  await createDummyUsers(30)

  process.exit()
}

export {
  dropAndPopulate
}