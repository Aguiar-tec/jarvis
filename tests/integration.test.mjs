import { createRequire } from 'node:module';
import { readFileSync,readdirSync } from 'node:fs';
import { createHash } from 'node:crypto';
import assert from 'node:assert/strict';
import { resolve } from 'node:path';
const require=createRequire(new URL('../package.json',import.meta.url));
const {Miniflare}=createRequire(require.resolve('wrangler/package.json'))('miniflare');
const hash=value=>createHash('sha256').update(value).digest('base64url');
const moduleFiles=readdirSync('dist/server',{recursive:true}).filter(f=>/\.m?js$/.test(f)).sort((a,b)=>a==='index.js'?-1:b==='index.js'?1:a.localeCompare(b));
const challenges=new Map();let tokenExchanges=0;
// Only external GitHub HTTP responses are mocked. OAuth state, PKCE, session
// creation, cookie validation, routes and persistence run in the compiled Worker.
async function github(request){
 const url=new URL(request.url);
 if(url.href==='https://github.com/login/oauth/access_token'){
  const form=new URLSearchParams(await request.text()),code=form.get('code');
  assert.equal(request.method,'POST');assert.equal(form.get('client_secret'),'test-only-secret');
  assert.equal(form.get('redirect_uri'),'https://qa.test/auth/github/callback');
  assert.equal(hash(form.get('code_verifier')),challenges.get(code));tokenExchanges++;
  if(code==='provider-error')return Response.json({error:'invalid_grant'},{status:400});
  return Response.json({access_token:'test-token-'+code,token_type:'bearer'});
 }
 if(url.href==='https://api.github.com/user'){
  const code=request.headers.get('authorization')?.replace('Bearer test-token-','');
  return Response.json({id:code==='user-b'?202:101,login:code==='user-b'?'qa-b':'qa-a',name:code==='user-b'?'Pessoa B':'Pessoa A'});
 }
 throw new Error('Unexpected external request: '+url.origin+url.pathname);
}
const mf=new Miniflare({modules:moduleFiles.map(file=>({type:'ESModule',path:resolve('dist/server',file)})),modulesRoot:resolve('dist/server'),compatibilityDate:'2026-05-15',compatibilityFlags:['nodejs_compat'],d1Databases:['DB'],bindings:{APP_ORIGIN:'https://qa.test',GITHUB_CLIENT_ID:'test-client',GITHUB_CLIENT_SECRET:'test-only-secret',ALLOWED_GITHUB_IDS:''},outboundService:github});
const fetchApp=(path,options={})=>mf.dispatchFetch('https://qa.test'+path,{redirect:'manual',...options});
const cookie=(response,name)=>response.headers.getSetCookie().find(c=>c.startsWith(name+'='))?.split(';')[0];
async function api(method='GET',session='',body,extra={}){
 const res=await fetchApp('/api/workspace',{method,headers:{...(session?{cookie:session}:{}),...(body!==undefined?{'Content-Type':'application/json',origin:'https://qa.test'}:{}),...extra},...(body!==undefined?{body:JSON.stringify(body)}:{})});return {status:res.status,data:await res.json()};
}
async function flow(){
 const res=await fetchApp('/auth/github');assert.equal(res.status,303);
 const url=new URL(res.headers.get('location'));
 assert.equal(url.origin,'https://github.com');assert.equal(url.searchParams.get('code_challenge_method'),'S256');assert.equal(url.searchParams.get('scope'),'');
 const binding=cookie(res,'__Host-jarvis_oauth');assert.ok(binding);assert.match(res.headers.get('set-cookie'),/HttpOnly; SameSite=Lax; Max-Age=600; Secure/);await res.text();
 return {state:url.searchParams.get('state'),challenge:url.searchParams.get('code_challenge'),binding};
}
async function callback(flow,code,bindings=flow.binding){
 challenges.set(code,flow.challenge);
 return fetchApp('/auth/github/callback?state='+flow.state+'&code='+code,{headers:{cookie:bindings}});
}
async function login(code){const f=await flow(),res=await callback(f,code);assert.equal(res.status,303);assert.equal(res.headers.get('location'),'https://qa.test/');const session=cookie(res,'__Host-jarvis_session');assert.ok(session);assert.match(res.headers.getSetCookie().find(c=>c.startsWith('__Host-jarvis_session=')),/HttpOnly; SameSite=Lax; Max-Age=604800; Secure/);await res.text();return {session,flow:f};}
try{
 const db=await mf.getD1Database('DB');
 for(const file of readdirSync('drizzle').filter(f=>f.endsWith('.sql')).sort())for(const stmt of readFileSync('drizzle/'+file,'utf8').split('--> statement-breakpoint').map(s=>s.trim()).filter(Boolean))await db.prepare(stmt).run();
 assert.equal((await api()).status,401);
 assert.equal((await api('GET','',undefined,{'oai-authenticated-user-id':'github:101','oai-authenticated-user-email':'fake@example.test'})).status,401);
 console.log('PASS anonymous access and forged legacy identity headers rejected');
 const f=await flow(),other=await flow(),before=tokenExchanges;
 const mismatch=await callback(f,'user-a',other.binding);assert.match(mismatch.headers.get('location'),/error=expired/);await mismatch.text();assert.equal(tokenExchanges,before);
 const expired=await flow();await db.prepare('UPDATE jarvis_oauth_flows SET expires_at=0 WHERE state_hash=?').bind(hash(expired.state)).run();const denied=await callback(expired,'user-a');assert.match(denied.headers.get('location'),/error=expired/);await denied.text();
 console.log('PASS browser-bound OAuth state and expired flows rejected');
 const a=await login('user-a'),b=await login('user-b');
 const replay=await callback(a.flow,'user-a');assert.match(replay.headers.get('location'),/error=expired/);await replay.text();
 const stored=await db.prepare('SELECT * FROM jarvis_sessions WHERE user_id=?').bind('github:101').first();assert.equal(stored.token_hash,hash(a.session.split('=')[1]));assert.equal(JSON.stringify(stored).includes('test-token'),false);
 console.log('PASS OAuth, PKCE, secure session creation, hashed storage and replay protection');
 const first=await api('GET',a.session);assert.equal(first.status,200);assert.equal(first.data.version,0);
 const data=first.data.data;
 data.tasks.push({id:'qa-task',title:'Persistência de teste',description:'',due:'2026-09-17',time:'08:00',done:false,completedAt:null,createdAt:'2026-09-17',priority:'high',areaId:'estudos',competencyIds:['disciplina'],goalId:null,routineId:null,occurrence:null});
 assert.equal((await api('PUT',a.session,{version:0,data})).status,200);assert.equal((await api('GET',a.session)).data.data.tasks[0].title,'Persistência de teste');
 assert.equal((await api('GET',b.session)).data.data.tasks.length,0);
 console.log('PASS persistent workspace and account isolation');
 assert.equal((await api('PUT',a.session,{version:0,data:{...data,tasks:[]}})).status,409);
 const bad=structuredClone(data);bad.tasks[0].areaId='orphan';assert.equal((await api('PUT',a.session,{version:1,data:bad})).status,400);assert.equal((await api('PUT',a.session,null)).status,400);
 assert.equal((await api('GET',a.session)).data.version,1);
 console.log('PASS stale writes and invalid imports cannot replace saved data');
 assert.equal((await api('PUT',a.session,{version:1,data},{origin:'https://untrusted.test','sec-fetch-site':'cross-site'})).status,403);
 assert.equal((await api('PUT',a.session,{version:1,data},{origin:''})).status,403);
 data.tasks[0].done=true;data.tasks[0].completedAt='2026-09-17';assert.equal((await api('PUT',a.session,{version:1,data})).status,200);
 assert.equal((await api('GET',a.session)).data.data.tasks[0].done,true);
 console.log('PASS same-origin writes and completion persistence');
 const loginPage=await fetchApp('/login');assert.equal(loginPage.status,200);assert.match(await loginPage.text(),/Entrar com GitHub/);
 const page=await fetchApp('/',{headers:{cookie:a.session}});const html=await page.text();assert.equal(page.status,200);assert.match(html,/J\.A\.R\.V\.I\.S\./);assert.match(html,/Nova tarefa/);assert.match(html,/pt-BR/);
 const anonymousPage=await fetchApp('/');assert.equal(anonymousPage.status,307);assert.equal(anonymousPage.headers.get('location'),'/login');await anonymousPage.text();
 console.log('PASS independent login page and protected server render');
 const sessionToken=a.session.split('=')[1];
 assert.equal((await api('GET',a.session+'; '+a.session)).status,401);
 await db.prepare('UPDATE jarvis_sessions SET expires_at=0 WHERE token_hash=?').bind(hash(sessionToken)).run();assert.equal((await api('GET',a.session)).status,401);
 const relogin=await login('user-a');assert.equal((await api('GET',relogin.session)).data.data.tasks.length,1);
 console.log('PASS duplicate cookies, session expiry and data retained after new login');
 const badLogout=await fetchApp('/auth/logout',{method:'POST',headers:{cookie:relogin.session,origin:'https://untrusted.test'}});assert.equal(badLogout.status,403);await badLogout.text();
 const goodLogout=await fetchApp('/auth/logout',{method:'POST',headers:{cookie:relogin.session,origin:'https://qa.test'}});assert.equal(goodLogout.status,303);assert.match(goodLogout.headers.get('set-cookie'),/Max-Age=0/);await goodLogout.text();assert.equal((await api('GET',relogin.session)).status,401);
 assert.equal((await api('GET',b.session)).status,200);
 console.log('PASS logout revocation and cross-site logout protection');
 const failed=await callback(await flow(),'provider-error');assert.match(failed.headers.get('location'),/error=provider/);assert.equal(cookie(failed,'__Host-jarvis_session'),undefined);await failed.text();
 console.log('PASS provider failure creates no session');
 const final=await api('GET',b.session);final.data.data.tasks=[];assert.equal((await api('PUT',b.session,{version:final.data.version,data:final.data.data})).status,200);
 console.log('PASS a second account saves independently');
}finally{await mf.dispose();}
