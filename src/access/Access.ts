import { Arg, Field, Mutation, ObjectType, Resolver, registerEnumType, Query, InputType } from "type-graphql"
import { Regional, RegionalInput, Session, SessionModel, SessionInput } from '@sergei-gaponik/hedo2.lib.models'
import { encrypt, decrypt } from '@sergei-gaponik/hedo2.lib.util'
import { DocumentType } from "@typegoose/typegoose"
import { ACCESS_TOKEN_EXPIRATION, SESSION_EXPIRATION } from "../core/const"

@InputType()
class InitSessionInput {

  @Field(() => RegionalInput, { nullable: true })
  regional: RegionalInput
}

enum GetAccessTokenError {
  internalServerError,
  sessionNotFound
}

enum InitSessionError {
  internalServerError
} 


registerEnumType(GetAccessTokenError, { name: "GetAccessTokenError" })
registerEnumType(InitSessionError, { name: "InitSessionError" })


@ObjectType()
class GetAccessTokenResponse{

  @Field(() => [GetAccessTokenError], { nullable: true })
  errors?: GetAccessTokenError[]

  @Field({ nullable: true, description: "encrypted object containing session info" })
  accessToken?: string
}

@ObjectType()
class InitSessionResponse {

  @Field(() => [InitSessionError], { nullable: true })
  errors?: InitSessionError[]

  @Field({ nullable: true, description: "encrypted object containing session info" })
  accessToken?: string
}

async function getAccessToken(session: string | Session | DocumentType<Session>): Promise<GetAccessTokenResponse>{

  let response = new GetAccessTokenResponse()

  let _session = null; 
  
  if(typeof session == "string"){
    const s = await SessionModel().findOne({ _id: session })

    _session = s.toJSON() || null
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
    killToken: Date.now() + ACCESS_TOKEN_EXPIRATION
  }
  
  response.accessToken = encrypt(JSON.stringify(payload), process.env.ACCESS_TOKEN_SECRET)

  return response;
}

@Resolver()
class AccessResolver {

  @Query(() => GetAccessTokenResponse, { description: "creates token and extends session expiration" })
  async getAccessToken(@Arg("sessionId") sessionId: string): Promise<GetAccessTokenResponse> {

    const session = await SessionModel().findById(sessionId)

    session.end = Date.now() + SESSION_EXPIRATION
    await session.save()

    return await getAccessToken(session);
  }

  @Query(() => String)
  parseAccessToken(@Arg("accessToken") accessToken: string): string{

    return decrypt(accessToken, process.env.ACCESS_TOKEN_SECRET)
  }

  @Mutation(() => InitSessionResponse)
  async initSession(@Arg("initSessionInput") initSessionInput: InitSessionInput): Promise<InitSessionResponse> {

    let response = new InitSessionResponse()

    const start = Date.now()

    const sessionInput = {
      regional: initSessionInput.regional as Regional || null,
      lineItems: [],
      start: start,
      end: start + SESSION_EXPIRATION,
      user: null
    } as SessionInput
    
    const session = await SessionModel().create(sessionInput as Session)

    console.log(session)

    const accessTokenResponse = await getAccessToken(session);

    if(accessTokenResponse.errors){
      response.errors = [ InitSessionError.internalServerError ]
      return response;
    }

    response.accessToken = accessTokenResponse.accessToken
    return response;
  }

}

export {
  AccessResolver,
  getAccessToken
}