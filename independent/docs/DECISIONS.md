# Decisões da implementação independente

Daniel solicitou implementar o banco e a aplicação independente e adicioná-los ao GitHub. Foi escolhida a opção PostgreSQL + Java, com autenticação por e-mail/senha e interface baseada no visual do aplicativo anterior. Esta pasta contém o núcleo dessa implementação; a aplicação Cloudflare existente na raiz continua separada.

As fontes deste ciclo, em ordem, são `JARVIS_MASTER_CONTEXT(1).docx`, `JARVIS_REQUIREMENTS_SPEC(1).docx`, `JARVIS_ARCHITECTURE(1).md` e `DATABASE_SCHEMA(2).md`. O último tem versão interna 1.0 e está preservado em [DATABASE_SCHEMA_SOURCE.md](DATABASE_SCHEMA_SOURCE.md). As decisões explícitas de Daniel na conversa sobre cadastro, login, tarefas, recorrência, metas, competências, métricas, gamificação e IA completam essas fontes. A implementação não constitui aprovação de decisões de negócio ainda abertas.

## Escolhas técnicas desta branch

| Tema | Implementação e justificativa |
| --- | --- |
| Estrutura | Monólito Spring Boot com API REST e arquivos HTML/CSS/JS no mesmo domínio. A execução não depende de Node.js. |
| Persistência | JPA, PostgreSQL 17, Flyway; Hibernate valida o esquema e não o altera. |
| Identificação | BIGINT com identity; IDs e versões retornam como strings no JSON para preservar precisão no JavaScript. |
| Propriedade | Serviços consultam pelo usuário autenticado. FKs compostas incluem `user_id`; nenhum vínculo pode misturar proprietários. O banco não usa RLS, portanto a conta técnica não deve ser exposta aos usuários finais. |
| Concorrência | Campo técnico `version` com `@Version`, obrigatório nas alterações/exclusões; responde 409 ao detectar edição desatualizada. |
| Competências | Relação N:N, sem duplicação do par. Tarefa exige pelo menos uma competência. Trigger de restrição adiada valida no commit; bloqueio do pai serializa alterações dos vínculos. |
| Nomes repetidos | Sem unicidade de nomes de áreas/competências nesta branch. A auditoria identificou que essa restrição do schema não está justificada nas fontes superiores; decisão de negócio continua pendente. |
| E-mail | Normalizado com trim e minúsculas; unicidade no banco. |
| Autenticação | Sessão de servidor, cookie HttpOnly/SameSite=Lax, CSRF em todas as gravações. Logout invalida sessão. Credenciais não vão para localStorage. |
| Senha | BCrypt com custo 12; confirmação apenas na entrada. Política técnica inicial: 8 caracteres ou mais, até 72 bytes UTF-8; sem truncamento silencioso. Recuperação e verificação de e-mail ainda não implementadas. |
| Privilégios | Compose separa proprietário das migrations e conta de execução com DML; histórico Flyway fica inacessível à conta de execução. |
| Limites técnicos | Texto de descrição até 10.000 caracteres, até 100 competências por requisição e corpo JSON até 64 KiB. São limites de entrada, não planos comerciais. |
| Abuso | Limitador de autenticação por IP no processo (60 tentativas/minuto). Não substitui proteção de borda em uma publicação pública com várias instâncias. |

## Políticas conservadoras da versão para revisão

Estas escolhas tornam o núcleo executável e ficam explícitas para revisão de Daniel antes de adoção definitiva:

- Exclusão de tarefa remove seus vínculos com competências. Área, competência, rotina ou meta com tarefas vinculadas tem a exclusão bloqueada. Não existe exclusão de conta nem cascata destrutiva de dados do usuário. Desvincular registros opcionais ou trocar a área/competência permite excluí-los depois.
- Reabrir tarefa limpa `completed_at`; concluir registra o instante atual. Não há histórico de múltiplas conclusões nesta versão.
- Prioridade é um texto obrigatório de até 30 caracteres, sem enum ou pesos. O vocabulário definitivo continua pendente.
- Datas de tarefa/meta são datas locais, horário é opcional sem fuso, timestamps de criação/conclusão usam instante UTC. Não são enviados lembretes agendados.

## Decisões de negócio pendentes

1. Fórmulas, períodos, arredondamento e ausência de dados das métricas e relatórios (RF-013 a RF-016).
2. Frequência, geração, alteração e histórico das ocorrências de rotina. O núcleo permite o agrupamento manual de tarefas; não implementa um motor de recorrência.
3. Estados e critérios de progresso das metas (RF-008 parcialmente atendido pelo acompanhamento das tarefas vinculadas).
4. Mecânicas de gamificação, mediante proposta e aprovação.
5. Vocabulário de prioridades, unicidade de nomes, política definitiva de exclusão e preservação de histórico ao reabrir tarefas.
6. Recuperação de senha, verificação de e-mail e política final de senha antes de uma operação pública.
7. Hospedagem, domínio, HTTPS, backups e eventual transferência dos dados da aplicação Cloudflare. O código desta pasta não importa dados D1 automaticamente.

IA, integrações, pagamentos e aplicativo móvel são etapas futuras. A autorização deste ciclo permite desenvolvimento e envio do código ao GitHub; não configura publicação pública da aplicação ou contratação de serviços.
