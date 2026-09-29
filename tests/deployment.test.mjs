import test from 'node:test';
import assert from 'node:assert/strict';
import {deploymentConfig} from '../scripts/configure-deployment.mjs';
const settings={CLOUDFLARE_ACCOUNT_ID:'a'.repeat(32),CLOUDFLARE_D1_DATABASE_ID:'12345678-1234-4234-8234-123456789abc',JARVIS_APP_ORIGIN:'https://jarvis.workers.dev',JARVIS_GITHUB_CLIENT_ID:'test-client',JARVIS_ALLOWED_GITHUB_IDS:'101,202',JARVIS_GITHUB_CLIENT_SECRET:'must-not-leak'};
test('production configuration binds the selected account/database and excludes secrets',()=>{
 const config=deploymentConfig(settings);assert.equal(config.account_id,settings.CLOUDFLARE_ACCOUNT_ID);assert.equal(config.d1_databases[0].database_id,settings.CLOUDFLARE_D1_DATABASE_ID);assert.equal(config.vars.APP_ORIGIN,settings.JARVIS_APP_ORIGIN);assert.equal(config.preview_urls,false);assert.equal(JSON.stringify(config).includes('must-not-leak'),false);
});
test('deployment rejects missing settings, placeholder database and unsafe origins',()=>{
 assert.throws(()=>deploymentConfig({}));
 for(const origin of ['http://jarvis.workers.dev','https://jarvis.workers.dev/extra','https://user:pass@jarvis.workers.dev','https://qa.test'])assert.throws(()=>deploymentConfig({...settings,JARVIS_APP_ORIGIN:origin}));
 assert.throws(()=>deploymentConfig({...settings,CLOUDFLARE_D1_DATABASE_ID:'00000000-0000-4000-8000-000000000000'}));
});
