// Independent OAuth 2.0 authorization-code flow with PKCE S256.
// GitHub is used for identity only; no repository or email scope is requested.
export type AuthEnv={DB:D1Database;APP_ORIGIN:string;GITHUB_CLIENT_ID:string;GITHUB_CLIENT_SECRET:string;ALLOWED_GITHUB_IDS?:string};
export type User={userId:string;login:string;displayName:string};
const SESSION_SECONDS=60*60*24*7;
const FLOW_SECONDS=600;
const encoder=new TextEncoder();
function base64url(bytes:Uint8Array){return btoa(String.fromCharCode(...bytes)).replaceAll('+','-').replaceAll('/','_').replace(/=+$/,'');}
export const randomToken=()=>base64url(crypto.getRandomValues(new Uint8Array(32)));
export async function hashToken(token:string){return base64url(new Uint8Array(await crypto.subtle.digest('SHA-256',encoder.encode(token))));}
export function origin(env:Pick<AuthEnv,'APP_ORIGIN'>){
 const url=new URL(env.APP_ORIGIN);
 if(url.username||url.password||url.search||url.hash||url.pathname!=='/')throw new Error('APP_ORIGIN must be an origin without a path.');
 if(url.protocol!=='https:'&&!(url.protocol==='http:'&&['127.0.0.1','localhost'].includes(url.hostname)))throw new Error('HTTPS is required outside local development.');
 return url.origin;
}
export function cookieNames(env:Pick<AuthEnv,'APP_ORIGIN'>){return origin(env).startsWith('https:')?{session:'__Host-jarvis_session',flow:'__Host-jarvis_oauth'}:{session:'jarvis_dev_session',flow:'jarvis_dev_oauth'};}
function cookie(name:string,value:string,seconds:number,env:AuthEnv){return `${name}=${value}; Path=/; HttpOnly; SameSite=Lax; Max-Age=${seconds}${origin(env).startsWith('https:')?'; Secure':''}`;}
export function readCookie(headers:Headers,name:string){
 const values=(headers.get('cookie')||'').split(';').map(p=>p.trim()).filter(p=>p.startsWith(name+'='));
 if(values.length!==1)return null;
 const value=values[0].slice(name.length+1);return /^[A-Za-z0-9_-]{43}$/.test(value)?value:null;
}
export function sameOrigin(request:Request,env:AuthEnv){return request.headers.get('origin')===origin(env)&&request.headers.get('sec-fetch-site')!=='cross-site';}
function allowed(id:string,env:AuthEnv){const list=(env.ALLOWED_GITHUB_IDS||'').split(',').map(x=>x.trim()).filter(Boolean);return !list.length||list.includes(id);}
export async function currentUser(headers:Headers,env:AuthEnv):Promise<User|null>{
 const token=readCookie(headers,cookieNames(env).session);if(!token)return null;
 const row=await env.DB.prepare('SELECT user_id, github_id, login, display_name FROM jarvis_sessions WHERE token_hash = ? AND expires_at > ?').bind(await hashToken(token),Date.now()).first<{user_id:string;github_id:string;login:string;display_name:string}>();
 if(!row||!allowed(row.github_id,env))return null;
 return {userId:row.user_id,login:row.login,displayName:row.display_name};
}
function authConfigured(env:AuthEnv){return !!env.GITHUB_CLIENT_ID?.trim()&&!!env.GITHUB_CLIENT_SECRET?.trim();}
function response(body:string,status:number){return new Response(body,{status,headers:{'Content-Type':'text/plain; charset=utf-8','Cache-Control':'no-store','Referrer-Policy':'no-referrer'}});}
function redirect(url:string,cookies:string[]=[]){const headers=new Headers({'Location':url,'Cache-Control':'no-store','Referrer-Policy':'no-referrer'});for(const value of cookies)headers.append('Set-Cookie',value);return new Response(null,{status:303,headers});}
export async function beginLogin(request:Request,env:AuthEnv){
 if(!authConfigured(env))return response('O login ainda não foi configurado pelo responsável pelo site.',503);
 const appOrigin=origin(env);
 if(new URL(request.url).origin!==appOrigin)return response('Endereço do site não autorizado.',403);
 const state=randomToken(),binding=randomToken(),verifier=randomToken(),now=Date.now();
 await env.DB.batch([
  env.DB.prepare('DELETE FROM jarvis_oauth_flows WHERE expires_at <= ?').bind(now),
  env.DB.prepare('DELETE FROM jarvis_sessions WHERE expires_at <= ?').bind(now),
  env.DB.prepare('INSERT INTO jarvis_oauth_flows (state_hash,browser_hash,verifier,expires_at) VALUES (?,?,?,?)').bind(await hashToken(state),await hashToken(binding),verifier,now+FLOW_SECONDS*1000),
 ]);
 const url=new URL('https://github.com/login/oauth/authorize');
 url.searchParams.set('client_id',env.GITHUB_CLIENT_ID);url.searchParams.set('redirect_uri',appOrigin+'/auth/github/callback');
 url.searchParams.set('state',state);url.searchParams.set('code_challenge',await hashToken(verifier));url.searchParams.set('code_challenge_method','S256');url.searchParams.set('scope','');
 return redirect(url.toString(),[cookie(cookieNames(env).flow,binding,FLOW_SECONDS,env)]);
}
export async function finishLogin(request:Request,env:AuthEnv,fetcher:typeof fetch=fetch){
 const names=cookieNames(env),clear=cookie(names.flow,'',0,env),fail=(reason:string)=>redirect(origin(env)+'/login?error='+reason,[clear]);
 if(!authConfigured(env))return fail('configuration');
 const url=new URL(request.url);if(url.origin!==origin(env))return response('Endereço não autorizado.',403);
 if(url.searchParams.has('error'))return fail('denied');
 const state=url.searchParams.get('state')||'',code=url.searchParams.get('code')||'',binding=readCookie(request.headers,names.flow);
 if(!binding||!/^[A-Za-z0-9_-]{43}$/.test(state)||!code||code.length>512)return fail('invalid');
 // A flow is consumed atomically and can never be replayed, including after a provider failure.
 const flow=await env.DB.prepare('DELETE FROM jarvis_oauth_flows WHERE state_hash = ? AND browser_hash = ? AND expires_at > ? RETURNING verifier').bind(await hashToken(state),await hashToken(binding),Date.now()).first<{verifier:string}>();
 if(!flow)return fail('expired');
 try{
  const exchange=await fetcher('https://github.com/login/oauth/access_token',{method:'POST',headers:{'Content-Type':'application/x-www-form-urlencoded','Accept':'application/json'},body:new URLSearchParams({client_id:env.GITHUB_CLIENT_ID,client_secret:env.GITHUB_CLIENT_SECRET,code,redirect_uri:origin(env)+'/auth/github/callback',code_verifier:flow.verifier}),signal:AbortSignal.timeout(15000)});
  const token=await exchange.json() as {access_token?:string;token_type?:string;error?:string};
  if(!exchange.ok||token.error||!token.access_token||token.token_type?.toLowerCase()!=='bearer')return fail('provider');
  const profile=await fetcher('https://api.github.com/user',{headers:{'Authorization':'Bearer '+token.access_token,'Accept':'application/vnd.github+json','X-GitHub-Api-Version':'2022-11-28','User-Agent':'JARVIS-Routine-Assistant'},signal:AbortSignal.timeout(15000)});
  const user=await profile.json() as {id?:number;login?:string;name?:string|null};
  if(!profile.ok||!Number.isSafeInteger(user.id)||Number(user.id)<=0||typeof user.login!=='string'||!/^[a-z\d-]{1,39}$/i.test(user.login))return fail('provider');
  const id=String(user.id);if(!allowed(id,env))return fail('restricted');
  const session=randomToken(),old=readCookie(request.headers,names.session);
  const queries=[env.DB.prepare('INSERT INTO jarvis_sessions (token_hash,user_id,github_id,login,display_name,expires_at) VALUES (?,?,?,?,?,?)').bind(await hashToken(session),'github:'+id,id,user.login,(user.name||user.login).slice(0,100),Date.now()+SESSION_SECONDS*1000)];
  if(old)queries.push(env.DB.prepare('DELETE FROM jarvis_sessions WHERE token_hash = ?').bind(await hashToken(old)));
  await env.DB.batch(queries);
  // The provider token is never persisted or returned to the browser.
  return redirect(origin(env)+'/',[clear,cookie(names.session,session,SESSION_SECONDS,env)]);
 }catch{return fail('provider');}
}
export async function logout(request:Request,env:AuthEnv){
 if(!sameOrigin(request,env))return response('Origem não autorizada.',403);
 const names=cookieNames(env),token=readCookie(request.headers,names.session);
 if(token)await env.DB.prepare('DELETE FROM jarvis_sessions WHERE token_hash = ?').bind(await hashToken(token)).run();
 return redirect(origin(env)+'/login',[cookie(names.session,'',0,env)]);
}
export function isAuthConfigured(env:AuthEnv){try{return authConfigured(env)&&!!origin(env);}catch{return false;}}
