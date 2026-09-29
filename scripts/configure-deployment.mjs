import {readFileSync,writeFileSync,existsSync} from 'node:fs';
import {pathToFileURL} from 'node:url';

if(existsSync('.env'))process.loadEnvFile('.env');

export function deploymentConfig(settings=process.env){
 const required=key=>{const value=settings[key]?.trim();if(!value)throw new Error('Configure '+key+' antes de publicar. Veja docs/HOSPEDAGEM.md.');return value;};
 const accountId=required('CLOUDFLARE_ACCOUNT_ID'),databaseId=required('CLOUDFLARE_D1_DATABASE_ID');
 if(!/^[a-f\d]{32}$/i.test(accountId))throw new Error('CLOUDFLARE_ACCOUNT_ID inválido.');
 if(!/^[a-f\d]{8}(-[a-f\d]{4}){3}-[a-f\d]{12}$/i.test(databaseId)||databaseId.startsWith('00000000-'))throw new Error('Informe o identificador real do banco D1 de destino.');
 const url=new URL(required('JARVIS_APP_ORIGIN'));
 if(url.protocol!=='https:'||url.username||url.password||url.search||url.hash||url.pathname!=='/'||['localhost','127.0.0.1'].includes(url.hostname)||/\.(test|invalid|example)$/.test(url.hostname))throw new Error('JARVIS_APP_ORIGIN deve conter somente o endereço HTTPS real do site.');
 const clientId=required('JARVIS_GITHUB_CLIENT_ID');if(!/^[a-z\d._-]+$/i.test(clientId))throw new Error('JARVIS_GITHUB_CLIENT_ID inválido.');
 const allowedIds=(settings.JARVIS_ALLOWED_GITHUB_IDS||'').trim();if(allowedIds&&!/^\d+(\s*,\s*\d+)*$/.test(allowedIds))throw new Error('Use IDs numéricos separados por vírgula em JARVIS_ALLOWED_GITHUB_IDS.');
 const name=settings.JARVIS_WORKER_NAME?.trim()||'jarvis-routine-assistant';if(!/^[a-z][a-z\d-]{0,62}$/.test(name))throw new Error('JARVIS_WORKER_NAME inválido.');
 const base=JSON.parse(readFileSync(new URL('../wrangler.json',import.meta.url),'utf8'));
 return {...base,name,account_id:accountId,workers_dev:true,preview_urls:false,d1_databases:base.d1_databases.map(db=>({...db,database_id:databaseId})),vars:{APP_ORIGIN:url.origin,GITHUB_CLIENT_ID:clientId,ALLOWED_GITHUB_IDS:allowedIds}};
}
export function writeDeploymentConfig(){
 const config=deploymentConfig();writeFileSync('wrangler.deploy.json',JSON.stringify(config,null,2)+'\n');return config;
}
if(process.argv[1]&&pathToFileURL(process.argv[1]).href===import.meta.url){
 try{const config=writeDeploymentConfig();console.log('Configuração gerada para '+config.name+' em '+config.vars.APP_ORIGIN+'. Nenhum segredo foi incluído.');}
 catch(error){console.error(error.message);process.exitCode=1;}
}
