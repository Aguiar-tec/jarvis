import { env } from 'cloudflare:workers';
import { finishLogin } from '@/lib/server/github-auth';
export const dynamic='force-dynamic';
export async function GET(request:Request){
 try{return await finishLogin(request,env);}
 catch{return new Response('Não foi possível iniciar sua sessão. Volte à página de entrada e tente novamente.',{status:503,headers:{'Cache-Control':'no-store'}});}
}
