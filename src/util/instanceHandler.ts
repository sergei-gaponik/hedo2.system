import fetch from 'node-fetch'

interface InstanceHandlerResponse {
  data?: any
  errors?: string[]
}

interface InstanceAPIRequest {
  instance: string
  path: string
  args?: any
}

let cache = {}

export default async function instanceHandler({ args, path, instance }: InstanceAPIRequest): Promise<InstanceHandlerResponse>{

  try{
    const res = await fetch(instance, {
      method: "POST",
      body: JSON.stringify({args,path}),
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${process.env.INSTANCE_SECRET}`
      }
    })
  
    if(!res.ok){
      throw new Error()
    }
  
    return await res.json()
  }
  catch(e){
    console.log(e)
    return { errors: [ "networkError" ]}
  }
}