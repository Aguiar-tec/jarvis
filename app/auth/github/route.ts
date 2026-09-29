import { env } from 'cloudflare:workers';
import { beginLogin } from '@/lib/server/github-auth';
export const dynamic='force-dynamic';
export async function GET(request:Request){
 try{return await beginLogin(request,env);}
 catch{return new Response('O login está indisponível. Tente novamente em instantes.',{status:503,headers:{'Cache-Control':'no-store'}});}
}
