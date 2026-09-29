# Validação da preparação — 18/09/2026

## Concluído no código

- Login independente por GitHub OAuth com PKCE S256, vínculo de navegador e expiração.
- Sessões no D1, cookies protegidos, revogação por logout e restrição opcional por ID GitHub.
- API protegida, dados isolados por conta, validação e controle de conflitos preservados.
- Importação das exportações antigas e novas, com confirmação antes de substituir registros.
- Funcionalidades do painel original mantidas; núcleo de regras e formulários de tarefas/rotinas/metas preservados.
- Configuração Cloudflare, migrações e GitHub Actions para validação e publicação.
- Guias de publicação, inclusive pelo navegador, transferência de registros e manutenção.

## Verificado

- TypeScript: sem erros.
- 12 testes de domínio, transferência e configuração: aprovados.
- Worker compilado com D1 isolado: 11 grupos de verificações de autenticação, proteção das gravações, persistência, isolamento, renderização e logout aprovados.
- Build com configuração de produção: aprovado.
- Wrangler `deploy --dry-run`: pacote de aplicação e arquivos estáticos validado, sem publicação e sem alteração de banco remoto.
- Fluxo de produção exercitado com identificadores de destino fictícios, sem credenciais reais.

O login real no GitHub, o callback da URL pública, a aplicação de migrações na conta Cloudflare e a transferência dos registros pessoais ainda exigem configuração/validação nas contas de destino. Os testes simulam somente as respostas HTTP externas do provedor OAuth; não substituem essa confirmação final.

## Ações externas pendentes

1. Disponibilizar um repositório de destino no GitHub e enviar o código.
2. Criar o banco D1 e o OAuth App nas contas escolhidas; configurar as variáveis e os segredos.
3. Executar o workflow de publicação e validar o login na URL definitiva.
4. Exportar os registros da instalação atual e importá-los na nova conta autenticada.

A instalação anterior não foi republicada nem teve seus dados alterados durante esta preparação.
