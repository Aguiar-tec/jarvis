# JARVIS — hospedagem independente

Assistente de rotina do PCC de Daniel Aguiar. Este código preserva o painel e as funcionalidades implementadas e pode ser mantido em um repositório GitHub, com aplicação e banco na sua conta Cloudflare.

**Comece por [docs/HOSPEDAGEM.md](docs/HOSPEDAGEM.md).** Há um caminho pelo navegador e GitHub Actions, sem instalar Node.js no seu computador. Para transferir seus registros atuais, siga [docs/MIGRACAO.md](docs/MIGRACAO.md).

## As três partes desta entrega

1. **Aplicação independente:** remoção das dependências da hospedagem anterior, login com GitHub, sessões protegidas, banco D1 e migrações versionadas.
2. **Continuidade dos dados:** tarefas, recorrências, metas, áreas, competências, relatórios, conquistas, temas, voz e catálogo preservados; importação das exportações anteriores com validação e confirmação.
3. **Código e publicação:** configuração de desenvolvimento/produção, GitHub Actions, testes automatizados e guia de instalação/migração.

A aplicação depende de serviços externos para executar: Cloudflare Workers/D1 e um aplicativo OAuth do GitHub da sua conta. As credenciais e o repositório de destino precisam ser configurados antes da publicação. O código não cria contas nem transfere automaticamente os dados da instalação anterior.

## Funcionalidades mantidas

- Tarefas: criar, editar, excluir, concluir/reabrir, prioridade, prazos e vínculos.
- Rotinas recorrentes por dia da semana, pausa e histórico por ocorrência.
- Metas, áreas e competências personalizáveis.
- Painel, percentuais, períodos e filtros, relatórios para impressão/PDF.
- Conquistas, três temas, preferências de movimento e leitura de voz do navegador.
- Exportação JSON, importação com confirmação e demonstração acadêmica.
- Catálogo de 20 itens do PCC, com as expansões futuras identificadas como planejadas.

A migração não transforma os itens planejados em serviços disponíveis. IA generativa, cobrança, calendários externos e backup automático continuam fora do escopo implementado, conforme [a matriz de requisitos](docs/REQUISITOS_E_VALIDACAO.md).

## Executar no computador

Node.js 24 LTS e a versão de pnpm indicada em `package.json`.

```sh
corepack enable
pnpm install --frozen-lockfile
```

Copie `.dev.vars.example` para `.dev.vars`, preencha as credenciais de um OAuth App de desenvolvimento e mantenha `APP_ORIGIN=http://127.0.0.1:3000`. O callback desse app deve ser `http://127.0.0.1:3000/auth/github/callback`.

```sh
pnpm db:migrate:local
pnpm dev
```

Abra `http://127.0.0.1:3000`. O login é real, inclusive no desenvolvimento. O banco local fica separado do D1 de produção. Sem as credenciais, a tela informa que o login aguarda configuração.

## Validação

```sh
pnpm typecheck
pnpm test
pnpm build
pnpm test:integration
```

Os testes de integração usam o Worker compilado e um banco isolado. Apenas as respostas HTTP do provedor GitHub são simuladas; o fluxo OAuth, PKCE, sessões, rotas, validação e gravação são executados de verdade no runtime local. Não são necessárias credenciais reais para a suíte.

## Publicação

Preencha `.env` a partir de `.env.example` conforme o guia e execute:

```sh
pnpm run deploy
```

O comando valida as configurações, executa testes e build, aplica as migrações pendentes no D1 selecionado e publica o Worker com seu segredo OAuth. Interrompe a execução se os testes falharem ou faltar configuração. O segredo fica em arquivo temporário com acesso restrito durante o envio e é removido ao terminar; não entra no build ou no Git.

Também está disponível o workflow **Publicar JARVIS**, iniciado manualmente pelo GitHub Actions na branch `main`. Commits e pull requests executam apenas a validação; não alteram a produção.

## Estrutura

| Caminho | Responsabilidade |
| --- | --- |
| `components/jarvis/` | Interface e fluxos existentes |
| `lib/jarvis.ts` | Regras do domínio e validação dos registros |
| `lib/backup.ts` | Leitura e validação das exportações |
| `lib/server/github-auth.ts` | OAuth com PKCE, sessões, expiração e logout |
| `app/api/workspace/route.ts` | API autenticada e proteção de gravações |
| `db/`, `drizzle/` | Esquema e migrações do D1 |
| `scripts/` | Preparação e execução do deploy |
| `.github/workflows/` | Validação e publicação pelo GitHub |

Detalhes técnicos em [docs/RUNTIME.md](docs/RUNTIME.md). Não inclua `.env`, `.dev.vars`, banco local, exportações pessoais ou `node_modules` no repositório.
