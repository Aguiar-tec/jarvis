# Transferir seus registros

A versão independente usa o ID numérico da sua conta GitHub como identidade. Esse ID é diferente do identificador de acesso da instalação anterior. O mesmo nome ou e-mail não vincula contas automaticamente.

## Transferência de uma conta

1. Entre na instalação atual do JARVIS com a conta que contém seus registros.
2. Abra **Configurações → Seus dados → Exportar meus dados** e guarde o JSON. Confira se a exportação é recente e contém as tarefas esperadas. A exportação antiga, sem `schemaVersion`, é aceita.
3. Entre com GitHub na nova instalação.
4. Se já houver registros no destino, exporte-os também antes de substituir o conteúdo.
5. Abra **Configurações → Seus dados → Importar dados de outra instalação** e selecione o JSON.
6. Confira as quantidades informadas. Clique em **Importar e substituir** para salvar no banco da nova conta.
7. Recarregue a página. Compare tarefas, status, prazos, rotinas, metas, áreas, competências, preferências e relatórios com a instalação anterior.

A importação valida o formato e as relações entre registros antes de permitir a confirmação. A gravação no banco passa pela mesma autorização e controle de versão das outras ações. Se outra aba salvar dados antes da confirmação, a importação será recusada por conflito; recarregue e confira antes de repetir.

O arquivo é lido no navegador e os registros validados são enviados à API autenticada da nova instalação. Identificadores de conta encontrados no arquivo não escolhem o usuário de destino. O destino é sempre a conta que está autenticada.

O limite do arquivo JSON é 8 MB; o conjunto de dados serializado para persistência deve caber em 4 MB. Arquivos de outros aplicativos, versões desconhecidas, relações inválidas ou datas inconsistentes são rejeitados. A importação substitui o espaço completo, incluindo preferências e estado de demonstração; não mescla contas ou deduplica tarefas.

## Recorrências e indicadores

IDs de tarefas, rotinas e ocorrências são preservados, assim como exceções de recorrência. Ao carregar o painel, o mecanismo existente pode gerar ocorrências até o dia atual. Se desejar comparar totais, use o mesmo período nas duas instalações. Relatórios e conquistas continuam sendo calculados a partir dos registros salvos.

## Mais de um usuário

Cada pessoa deve exportar seu próprio espaço e importá-lo após entrar com sua conta GitHub. A ferramenta não oferece migração administrativa em massa nem associa contas por e-mail. Não compartilhe exportações pessoais no repositório.

## Retorno e manutenção

A importação não apaga nem altera a instalação de origem. Mantenha a exportação e a URL anterior disponíveis até conferir a transferência. Evite editar nas duas instalações durante a troca, pois elas não sincronizam entre si.

Na mesma instalação independente, futuras publicações mantêm o banco D1 selecionado. O script aplica apenas migrações SQL pendentes. Não altere migrações já aplicadas; gere uma nova com `pnpm db:generate`.

Antes de mudanças futuras no esquema, o responsável pode exportar o banco completo pelo Wrangler:

```sh
pnpm exec wrangler d1 export DB --remote --config wrangler.deploy.json --output jarvis-backup.sql
```

Esse arquivo contém registros e sessões e deve ser guardado em local privado. Ele não substitui o processo de importação entre identidades diferentes. Restauração de banco e reversão de migrações exigem análise específica; voltar uma versão do Worker não reverte automaticamente alterações no banco.
