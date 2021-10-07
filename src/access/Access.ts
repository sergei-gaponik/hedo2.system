import { Arg, Field, Mutation, ObjectType, Resolver, registerEnumType, Query, InputType } from "type-graphql"
import { Regional, RegionalInput, Session, SessionModel, SessionInput } from '@sergei-gaponik/hedo2.lib.models'
import { encrypt, decrypt, log } from '@sergei-gaponik/hedo2.lib.util'
import { DocumentType } from "@typegoose/typegoose"
import { ACCESS_TOKEN_EXPIRATION, SESSION_EXPIRATION } from "../core/const"

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

    const _r = await getAccessToken(session)

    log({ ..._r, sessionId }, { tags: [ "sessions", "getAccessToken" ] })

    return _r
  }

  @Query(() => String)
  parseAccessToken(@Arg("accessToken") accessToken: string): string{

    return decrypt(accessToken, process.env.ACCESS_TOKEN_SECRET)
  }

  @Mutation(() => InitSessionResponse)
  async initSession(@Arg("sessionInput") sessionInput: SessionInput): Promise<InitSessionResponse> {

    let response = new InitSessionResponse()

    const start = Date.now()

    let _sessionInput = {
      regional: null,
      lineItems: [],
      start: start,
      end: start + SESSION_EXPIRATION,
      user: null
    } as SessionInput

    _sessionInput = { ..._sessionInput, ...sessionInput }
    
    const session = await SessionModel().create(_sessionInput as Session)

    const { errors, accessToken } = await getAccessToken(session);

    const ok = !response.errors?.length

    if(!ok)
      response.errors = [ InitSessionError.internalServerError ]
    else
      response.accessToken = accessToken

    log({ errors, ok, sessionInput }, { tags: [ "sessions", "initSession" ] })
    
    return response;
  }

}

export {
  AccessResolver,
  getAccessToken
}