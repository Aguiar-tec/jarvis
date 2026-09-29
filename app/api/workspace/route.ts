import { env } from 'cloudflare:workers';
import { currentUser,sameOrigin } from '@/lib/server/github-auth';
import { workspaceSchema } from '@/lib/jarvis';
import { readWorkspace, writeWorkspace } from '@/lib/workspace-store';
export const dynamic='force-dynamic';
const response=(data:unknown,status=200)=>Response.json(data,{status,headers:{'Cache-Control':'no-store'}});
export async function GET(req:Request){
 try{
  const user=await currentUser(req.headers,env);if(!user)return response({error:'Entre na sua conta para acessar a rotina.'},401);
  return response(await readWorkspace(user.userId,user.displayName.split(' ')[0].slice(0,80)||user.login));
 }catch{return response({error:'Não foi possível carregar seus dados. Tente novamente.'},503);}
}
export async function PUT(req:Request){
 try{
  const user=await currentUser(req.headers,env);if(!user)return response({error:'Sua sessão expirou. Entre novamente.'},401);
  if(!sameOrigin(req,env))return response({error:'Origem não permitida.'},403);
  if(!req.headers.get('content-type')?.includes('application/json'))return response({error:'Formato inválido.'},415);
  if(Number(req.headers.get('content-length'))>4_000_000)return response({error:'O conjunto de dados ultrapassou o limite de tamanho.'},413);
  const body=await req.arrayBuffer();if(body.byteLength>4_000_000)return response({error:'O conjunto de dados ultrapassou o limite de tamanho.'},413);
  let payload;try{payload=JSON.parse(new TextDecoder().decode(body));}catch{return response({error:'Dados inválidos.'},400);}
  if(!payload||typeof payload!=='object'||!Number.isSafeInteger(payload.version)||payload.version<0)return response({error:'Versão inválida.'},400);
  const parsed=workspaceSchema.safeParse(payload.data);
  if(!parsed.success)return response({error:parsed.error.issues[0]?.message||'Confira os dados.'},400);
  if(!await writeWorkspace(user.userId,parsed.data,payload.version))return response({error:'Seus dados mudaram em outra aba. Atualize antes de salvar novamente.'},409);
  return response({data:parsed.data,version:payload.version+1});
 }catch{return response({error:'Não foi possível salvar. Seus dados anteriores estão preservados. Tente novamente.'},503);}
}
