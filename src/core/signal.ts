import fetch from 'node-fetch'

export async function sendSignal(collection: string, ids: string[]){

  const url = process.env.SHOP_API_ENDPOINT

  const options = {
    body: JSON.stringify({ collection, ids }),
    headers: {
      "Content-Type": "application/json"
    },
    method: "POST"
  }

  const response = await fetch(url, options)

  console.log(response)

}