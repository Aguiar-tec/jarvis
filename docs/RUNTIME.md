# Runtime independente

## Arquitetura

React 19, TypeScript e Vinext executam no Cloudflare Workers. D1 mantém snapshots por usuário e sessões. As dependências estão fixadas no `pnpm-lock.yaml`; esta migração não atualiza o framework. Desenvolvimento e build usam o plugin oficial Cloudflare Vite. Não são necessários scripts, cabeçalhos de identidade ou dispatcher da hospedagem anterior.

`wrangler.json` define a configuração local. `scripts/configure-deployment.mjs` gera o arquivo ignorado `wrangler.deploy.json` com a conta, banco e origem de produção. O build feito por `pnpm run deploy` usa esse arquivo e gera `dist/server/wrangler.json`, incluindo os arquivos estáticos. O deploy sempre usa essa saída compilada.

## Autenticação

`GET /auth/github` cria state, vínculo com navegador e verificador PKCE aleatórios. A autorização usa S256. Os hashes do state e do vínculo ficam no D1 com expiração de 10 minutos. O callback consome o fluxo atomicamente, troca o código no GitHub e verifica o perfil em `/user`.

Nenhum escopo de repositório ou e-mail é solicitado. A identidade durável é `github:<id numérico>`. O token de acesso do provedor é usado somente durante o callback e não é gravado nem enviado ao navegador.

A sessão usa token aleatório opaco de 256 bits; apenas o hash fica no banco. Em HTTPS, o cookie tem prefixo `__Host-`, `Secure`, `HttpOnly`, `SameSite=Lax`, `Path=/` e expiração de sete dias. No desenvolvimento HTTP local, nomes de cookie específicos são usados sem `Secure`. Tokens desconhecidos, repetidos no cabeçalho ou expirados são rejeitados. Novo login pode revogar a sessão apresentada anteriormente; logout revoga a sessão no servidor.

`POST /auth/logout` e `PUT /api/workspace` exigem Origin igual à origem configurada e recusam `Sec-Fetch-Site: cross-site`. O servidor ignora os cabeçalhos de autenticação usados pela instalação anterior. O login e seu callback aceitam apenas o endereço de origem configurado.

## Dados

`jarvis_workspaces` mantém um JSON validado por usuário. Gravações usam comparação de versão no próprio SQL para impedir perda de alterações concorrentes. A migração `0001` acrescenta tabelas de fluxos OAuth e sessões; não remove registros existentes.

Fluxos e sessões expirados são excluídos ao iniciar novos logins; sessões expiradas também são recusadas na leitura, independentemente da limpeza. A política opcional `ALLOWED_GITHUB_IDS` é verificada a cada leitura de sessão e antes de emitir uma nova.

Exportação/importação se aplica a registros da aplicação, não a sessões nem credenciais. O segredo OAuth deve ficar em `.dev.vars` localmente ou nos secrets do Worker, e no segredo correspondente do ambiente de publicação. Nunca use prefixo `NEXT_PUBLIC_` para credenciais.

## Comandos

| Comando | Resultado |
| --- | --- |
| `pnpm dev` | Desenvolvimento em `127.0.0.1:3000` |
| `pnpm db:migrate:local` | Migrações no banco local |
| `pnpm build` | Build com configuração local, sem publicar |
| `pnpm start` | Preview do build local; use a origem/callback compatíveis com a porta escolhida |
| `pnpm typecheck` | Checagem de tipos |
| `pnpm test` | Domínio, arquivos de transferência e configuração de deploy |
| `pnpm test:integration` | OAuth e API no Worker previamente compilado |
| `pnpm configure:deploy` | Validação e criação da configuração de produção |
| `pnpm run deploy` | Validação, build, testes, migrações remotas e deploy |

## Limites de validação

A suíte automática exercita os fluxos com GitHub HTTP simulado. Um OAuth App real, uma conta Cloudflare e o callback na URL pública precisam ser verificados após a configuração externa. Não houve teste de produção nas contas do usuário durante a preparação do pacote.

Impressão, vozes disponíveis no navegador e WebMCP mantêm as limitações do protótipo original. O catálogo conserva a distinção entre recursos implementados e futuras ofertas. O projeto é independente da hospedagem anterior, mas depende dos serviços Cloudflare e GitHub definidos nesta arquitetura; não é um servidor Node genérico pronto para qualquer VPS.
