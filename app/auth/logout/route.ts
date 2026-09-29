import { env } from 'cloudflare:workers';
import { logout } from '@/lib/server/github-auth';
export const dynamic='force-dynamic';
export async function POST(request:Request){
 try{return await logout(request,env);}
 catch{return new Response('Não foi possível encerrar a sessão. Tente novamente.',{status:503,headers:{'Cache-Control':'no-store'}});}
}
