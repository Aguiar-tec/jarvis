# Publicar com GitHub e Cloudflare

O GitHub guarda o código e executa a automação; Cloudflare Workers executa o site/API e D1 guarda os registros e sessões. Esta preparação mantém o runtime e o banco utilizados pelo projeto, agora na sua conta. GitHub Pages, sozinho, não executa esse backend.

## Caminho pelo navegador, sem instalações locais

É possível realizar a publicação pelos painéis web. As instalações e os comandos Node/pnpm ficam no GitHub Actions.

1. Crie o repositório no GitHub e envie **o conteúdo extraído** do ZIP por **Add file → Upload files**, preservando as pastas. O `package.json` deve estar na raiz. Inclua a pasta `.github/workflows`; enviar somente o ZIP não disponibiliza o código para execução. Se o navegador limitar a quantidade, faça mais de um envio mantendo os caminhos.
2. No painel Cloudflare, abra **Storage & databases → D1** e crie `jarvis-db`. Copie o UUID e o Account ID. Em Workers & Pages, ative o subdomínio `workers.dev`.
3. Crie o OAuth App no painel GitHub como na etapa 3 abaixo.
4. Configure as variáveis e os segredos do ambiente `production` do repositório, conforme a etapa 5.
5. Execute **Actions → Publicar JARVIS → Run workflow**, na branch `main`. A automação instala as dependências, testa o projeto e publica na sua conta.

As instruções de terminal a seguir são uma alternativa para quem quiser desenvolver localmente. Os dados atuais devem ser transferidos por exportação/importação depois da publicação.

## 1. Colocar o código no GitHub

Na conta em que deseja manter o projeto, crie um repositório chamado `jarvis`. Use privado se quiser restringir a leitura do código. O endereço será `https://github.com/SEU_USUARIO/jarvis`.

Se recebeu o ZIP, extraia-o, abra um terminal **na pasta que contém `package.json`** e use:

```sh
git init -b main
git add .
git commit -m "Preparar JARVIS para hospedagem independente"
git remote add origin https://github.com/SEU_USUARIO/jarvis.git
git push -u origin main
```

Substitua `SEU_USUARIO` pelo seu login. Crie o repositório vazio, sem README, para esse primeiro envio. Autentique-se pelo gerenciador de credenciais do Git ou GitHub CLI. Não coloque tokens na URL do remote. O ZIP não leva o histórico da hospedagem anterior.

Se já existe um repositório com código, use uma branch e uma pull request; não force a substituição do histórico. Para continuar com Atlas, disponibilize esse repositório na conexão GitHub e informe o link.

## 2. Preparar a conta Cloudflare e o D1

Instale Node.js 24 LTS, habilite Corepack e execute `pnpm install --frozen-lockfile`. No terminal local:

```sh
pnpm exec wrangler login
pnpm exec wrangler d1 create jarvis-db
```

Anote o `database_id` retornado e o Account ID da conta. Crie/ative seu subdomínio `workers.dev` no painel Workers & Pages. Com o nome padrão deste projeto, a URL será `https://jarvis-routine-assistant.SEU_SUBDOMINIO.workers.dev`.

Crie um banco de destino novo para a migração entre instalações. O código aplica migrações incrementais; não copia um banco hospedado em outra conta.

Para publicar pelo GitHub Actions, crie um token Cloudflare limitado à conta de destino, com as permissões de edição de Workers Scripts e D1 e leitura da conta necessárias ao Wrangler. O modelo de token para editar Workers ajuda na configuração; acrescente D1 Edit. Se também configurar domínio/rotas pelo Wrangler, serão necessárias as respectivas permissões de zona. Guarde o token nos Secrets do GitHub.

## 3. Criar o login independente

No GitHub, vá a **Settings → Developer settings → OAuth Apps → New OAuth App**.

- Application name: `JARVIS`.
- Homepage URL: a URL HTTPS definitiva do Worker.
- Authorization callback URL: a mesma URL, acrescida de `/auth/github/callback`.

Copie o Client ID e gere o Client Secret. Este app serve apenas para autenticar os usuários do JARVIS; não dá acesso aos repositórios deles. Não é o mesmo que a conexão GitHub usada por Atlas para editar código.

O host do callback e `JARVIS_APP_ORIGIN` precisam coincidir. Para trabalhar localmente, crie outro OAuth App com callback `http://127.0.0.1:3000/auth/github/callback`; assim a configuração de produção continua funcionando.

## 4. Configurar a publicação

Para publicar pelo terminal, copie `.env.example` para `.env` e preencha:

| Variável | Conteúdo |
| --- | --- |
| `CLOUDFLARE_ACCOUNT_ID` | Account ID da conta Cloudflare |
| `CLOUDFLARE_D1_DATABASE_ID` | UUID real do banco `jarvis-db` |
| `JARVIS_APP_ORIGIN` | URL HTTPS do site, sem caminho |
| `JARVIS_GITHUB_CLIENT_ID` | Client ID do OAuth App de produção |
| `JARVIS_GITHUB_CLIENT_SECRET` | Client Secret desse OAuth App |
| `JARVIS_WORKER_NAME` | `jarvis-routine-assistant`, ou outro nome escolhido |
| `JARVIS_ALLOWED_GITHUB_IDS` | Opcional: IDs numéricos GitHub autorizados, separados por vírgula |
| `CLOUDFLARE_API_TOKEN` | Token para automação; pode ficar vazio no terminal autenticado por `wrangler login` |

Com a lista de IDs vazia, qualquer conta GitHub pode entrar e criar seu próprio espaço; cada usuário só acessa seus registros. Se deseja uso particular, preencha a lista com seu ID numérico do GitHub, não o nome de usuário. A mudança da lista também restringe sessões já emitidas na próxima requisição.

Nunca compartilhe o `.env` preenchido. O `.gitignore` já exclui os arquivos com credenciais e os dados locais.

Execute:

```sh
pnpm run deploy
```

O comando gera `wrangler.deploy.json`, valida o projeto, compila, testa a integração, aplica migrações D1 pendentes e publica aplicação/arquivos estáticos/segredo OAuth. O Wrangler envia o segredo usando `--secrets-file`, sem colocá-lo no código ou na configuração versionada. A configuração local contém um UUID fictício e não é usada pelo comando de publicação.

Para validar o pacote de produção sem publicar nem executar migrações remotas, use `pnpm run deploy --dry-run`. As variáveis de destino continuam necessárias; o segredo OAuth não é exigido nessa verificação.

Um domínio próprio é opcional: configure-o no painel Cloudflare, altere a origem e o callback do OAuth App e publique novamente. A URL `workers.dev` antiga não inicia outro fluxo de login, pois o servidor aceita apenas a origem configurada.

## 5. Publicar pelo GitHub Actions

No repositório, crie o ambiente **production** em **Settings → Environments**. Configure nele:

**Secrets:** `CLOUDFLARE_API_TOKEN` e `JARVIS_GITHUB_CLIENT_SECRET`.

**Variables:** `CLOUDFLARE_ACCOUNT_ID`, `CLOUDFLARE_D1_DATABASE_ID`, `JARVIS_APP_ORIGIN`, `JARVIS_GITHUB_CLIENT_ID`, `JARVIS_WORKER_NAME` e, se necessário, `JARVIS_ALLOWED_GITHUB_IDS`.

Abra **Actions → Publicar JARVIS → Run workflow**, escolhendo `main`. O workflow executa os mesmos testes e o mesmo comando usado no terminal. Apenas um deploy de produção roda por vez. Os workflows não têm permissão para alterar o conteúdo do repositório.

O workflow **Validar JARVIS** roda em pushes e pull requests, sem credenciais externas. Um workflow de validação aprovado não significa que o site já foi publicado.

## 6. Conferir o resultado e transferir os registros

1. Acesse a nova URL e entre com GitHub.
2. Crie uma tarefa de teste, recarregue e confira sua permanência.
3. Saia da conta; o painel deve solicitar login novamente.
4. Siga [MIGRACAO.md](MIGRACAO.md) para importar a exportação da instalação anterior.
5. Confira tarefas, recorrências, metas, competências e relatórios antes de adotar a nova URL.

## Falhas comuns

| Mensagem / situação | Ação |
| --- | --- |
| Login aguarda configuração | Verifique Client ID e o segredo `GITHUB_CLIENT_SECRET` do Worker |
| Erro no callback | Confira origem/callback, use a mesma janela e inicie o login novamente |
| Conta não autorizada | Confira o ID numérico na lista de acesso |
| Banco indisponível | Confira o binding `DB`, database ID e aplicação das migrações |
| Conflito de edição | Recarregue os dados salvos antes de importar ou editar de novo |
| GitHub Action sem configuração | Confira Secrets/Variables do ambiente `production` e execução na branch `main` |

## Referências oficiais

- [GitHub: fluxo OAuth](https://docs.github.com/en/apps/oauth-apps/building-oauth-apps/authorizing-oauth-apps).
- [Cloudflare: deploy com GitHub Actions](https://developers.cloudflare.com/workers/ci-cd/external-cicd/github-actions/).
- [Cloudflare: gerenciamento de secrets](https://developers.cloudflare.com/workers/configuration/secrets/).
- [Cloudflare: opções do Wrangler](https://developers.cloudflare.com/workers/wrangler/commands/).
