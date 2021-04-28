import { Arg, Field, Mutation, ObjectType, Resolver, registerEnumType, Query } from "type-graphql"
import { Session, SessionModel } from '@sergei-gaponik/hedo2.lib.models'
import { encrypt, decrypt } from '@sergei-gaponik/hedo2.lib.util'
import { DocumentType } from "@typegoose/typegoose"
import { ACCESS_TOKEN_LIFESPAN } from "../core/const"

enum GetAccessTokenError{
  internalServerError,
  sessionNotFound
}


registerEnumType(GetAccessTokenError, { name: "GetAccessTokenError" })

@ObjectType()
class GetAccessTokenResponse{

  @Field(() => [GetAccessTokenError], { nullable: true })
  errors?: GetAccessTokenError[]

  @Field({ nullable: true, description: "encrypted object containing session info" })
  accessToken?: string
}


async function getAccessToken(session: string | Session | DocumentType<Session>): Promise<GetAccessTokenResponse>{

  let response = new GetAccessTokenResponse()

  let _session = null; 
  
  if(typeof session == "string"){
    const s = await SessionModel().findOne({ _id: session })
    _session = s.toJSON()
  } 
  else{
    try{
      _session = (session as DocumentType<Session>).toJSON()
    }
    catch(e){
      _session = session
    }
  }

  if(!_session){
    response.errors = [ GetAccessTokenError.sessionNotFound ]
    return response;
  }
  
  const payload = {
    ..._session,
    killToken: Date.now() + ACCESS_TOKEN_LIFESPAN
  }
  
  response.accessToken = encrypt(JSON.stringify(payload), process.env.ACCESS_TOKEN_SECRET)

  return response;
}

@Resolver()
class AccessResolver {

  @Query(() => GetAccessTokenResponse)
  async getAccessToken(@Arg("sessionId") sessionId: string): Promise<GetAccessTokenResponse> {

    return await getAccessToken(sessionId);
  }

  @Query(() => String)
  parseAccessToken(@Arg("accessToken") accessToken: string): string{

    return decrypt(accessToken, process.env.ACCESS_TOKEN_SECRET)

  }

}

export {
  AccessResolver,
  getAccessToken
}