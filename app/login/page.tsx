import { env } from 'cloudflare:workers';
import { redirect } from 'next/navigation';
import { Orbit, ShieldCheck, ArrowRight } from 'lucide-react';
import { getAuthenticatedUser } from '@/app/auth';
import { isAuthConfigured } from '@/lib/server/github-auth';
export const dynamic='force-dynamic';
export default async function Login({searchParams}:{searchParams:Promise<{error?:string}>}){
 if(await getAuthenticatedUser())redirect('/');
 const {error}=await searchParams,configured=isAuthConfigured(env);
 const message=error==='restricted'?'Esta conta não está autorizada a acessar este JARVIS.':error==='denied'?'O acesso foi cancelado. Você pode tentar novamente.':'Não foi possível confirmar o acesso. Inicie uma nova tentativa.';
 return <main className="login-screen"><section className="login-card" aria-labelledby="login-title"><div className="login-orbit" aria-hidden="true"><Orbit size={70}/></div><p className="eyebrow">SUA CENTRAL DE ROTINA</p><h1 id="login-title">J.A.R.V.I.S.</h1><p>Seus planos, sua evolução.<br/>Um espaço para colocar o dia em movimento.</p>{error&&<p role="alert" className="form-error">{message}</p>}{configured?<a className="login-button" href="/auth/github">Entrar com GitHub <ArrowRight size={18}/></a>:<p role="status" className="help">O responsável pelo site precisa concluir a configuração do login para liberar o acesso.</p>}<div className="login-note"><ShieldCheck size={18}/><span>Seus registros ficam vinculados à sua conta.<br/>O login usa apenas sua identidade pública do GitHub.</span></div></section></main>;
}
