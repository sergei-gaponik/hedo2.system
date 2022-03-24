
import instanceHandler from '../util/instanceHandler'
import { systemContext as context } from '../core/systemContext'
import { VariantModel } from '@sergei-gaponik/hedo2.lib.models'

export default async function updateVariants(){

  const instances = process.env.INSTANCE_ENDPOINTS.split(";")

  const pulls = await context().mongoDB.collection("pulls")
    .find({ entity: "variants" })
    .sort({ updated: -1 })
    .limit(1)
    .toArray()

  const updatedSince = pulls.length ? pulls[0].updated : 0

  const updateCount = await VariantModel().count({ _updated: { $gt: updatedSince } })

  if(updateCount == 0){
    return {}
  }

  let responses = []

  for(const instance of instances){
    
    const r = await instanceHandler({ 
      instance, 
      path: "updateVariantsUpdatedSince", 
      args: { updatedSince }
    })

    responses.push(r)
  }

  const nModified = responses.filter(a => a.data?.nModified).map(a => a.data.nModified)
  const errors = responses.filter(a => a.errors?.length).map(a => a.errors)

  if(nModified.length && !errors.length){
    await context().mongoDB.collection("pulls").insertOne({
      entity: "variants",
      updated: Date.now()
    })
  }

  let response: any = {}

  if(nModified) response.nModified = nModified
  if(errors) response.errors = errors

  return response
}