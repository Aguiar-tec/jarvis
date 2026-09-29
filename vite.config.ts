import vinext from 'vinext';
import { defineConfig } from 'vite';
import { existsSync } from 'node:fs';

export default defineConfig(async()=>{
  process.env.CLOUDFLARE_CF_FETCH_ENABLED ??= 'false';
  process.env.WRANGLER_SEND_METRICS ??= 'false';
  const {cloudflare}=await import('@cloudflare/vite-plugin');
  const deploy=process.env.JARVIS_DEPLOY_CONFIG==='1';
  if(deploy&&!existsSync('wrangler.deploy.json'))throw new Error('Execute pnpm configure:deploy antes de gerar a versão de produção.');
  return {
    server:{host:'127.0.0.1',port:3000,strictPort:true},
    plugins:[vinext(),cloudflare({configPath:deploy?'wrangler.deploy.json':'wrangler.json',viteEnvironment:{name:'rsc',childEnvironments:['ssr']},inspectorPort:false})],
  };
});
