# J.A.R.V.I.S. — DATABASE_SCHEMA.md

**Plataforma Web de Gestão de Rotina e Desenvolvimento Pessoal**  
**Responsável final:** Daniel Aguiar  
**Coordenação de contexto e arquitetura:** Atlas  
**Implementação principal:** Claude Code  
**Auditoria e testes:** Codex  
**Segunda opinião:** Gemini  
**Versão:** 1.0  
**Status:** Especificação de banco baseada nos requisitos e na arquitetura aprovados

## 1. Finalidade

Este documento transforma o modelo conceitual definido no `JARVIS_MASTER_CONTEXT`, no `JARVIS_REQUIREMENTS_SPEC` e no `JARVIS_ARCHITECTURE.md` em uma especificação física inicial para PostgreSQL.

O documento define entidades, chaves, relacionamentos, integridade e índices necessários ao núcleo do J.A.R.V.I.S., sem autorizar funcionalidades ainda pendentes de decisão.

## 2. Fontes oficiais e precedência

A ordem de referência é:

1. `JARVIS_MASTER_CONTEXT`
2. `JARVIS_REQUIREMENTS_SPEC`
3. `JARVIS_ARCHITECTURE.md`
4. `DATABASE_SCHEMA.md`
5. código-fonte e migrations

Em caso de conflito, a documentação oficial superior prevalece. Nenhum agente deve resolver silenciosamente conflito que altere regra de negócio ou estrutura aprovada.

## 3. Banco e princípios

- SGBD: PostgreSQL.
- Identificadores devem ser únicos.
- Cada entidade de dados do usuário deve possuir vínculo inequívoco com seu usuário proprietário, direta ou indiretamente.
- Chaves estrangeiras devem preservar integridade referencial.
- Dados privados de usuários diferentes não podem ser misturados.
- Senhas não são armazenadas em texto puro.
- O banco não deve conter dados derivados inventados para completar relatórios.
- O esquema deve permanecer compatível com a API e com a futura evolução para aplicativo.

## 4. Entidades do núcleo

O modelo físico inicial contém:

- `users`
- `areas`
- `competencies`
- `routines`
- `goals`
- `tasks`
- `task_competencies`

Relatórios, métricas e conquistas permanecem como estruturas derivadas ou módulos posteriores até que suas regras sejam definitivamente especificadas.

## 5. Tabela `users`

Representa a conta e os dados próprios do usuário.

| Campo | Tipo PostgreSQL | Nulo | Regra |
|---|---|---:|---|
| `id` | `BIGINT` | Não | PK |
| `name` | `VARCHAR(150)` | Não | Nome do usuário |
| `email` | `VARCHAR(254)` | Não | Único |
| `password_hash` | `VARCHAR(255)` | Não | Nunca armazenar senha pura |
| `created_at` | `TIMESTAMPTZ` | Não | Data/hora de criação |
| `updated_at` | `TIMESTAMPTZ` | Não | Última atualização |

### Constraints

- `PRIMARY KEY (id)`.
- `UNIQUE (email)`.
- E-mail deve ser tratado de forma consistente quanto a maiúsculas/minúsculas na camada de aplicação; a estratégia física definitiva pode ser fechada antes da migration final.
- `password_hash` deve receber somente hash produzido pelo mecanismo de segurança aprovado.

## 6. Tabela `areas`

Representa uma área personalizada criada pelo usuário para organização e análise.

| Campo | Tipo PostgreSQL | Nulo | Regra |
|---|---|---:|---|
| `id` | `BIGINT` | Não | PK |
| `user_id` | `BIGINT` | Não | FK → `users.id` |
| `name` | `VARCHAR(100)` | Não | Nome da área |
| `created_at` | `TIMESTAMPTZ` | Não | Data/hora de criação |
| `updated_at` | `TIMESTAMPTZ` | Não | Última atualização |

### Constraints

- `PRIMARY KEY (id)`.
- `FOREIGN KEY (user_id) REFERENCES users(id)`.
- `UNIQUE (user_id, name)` para impedir áreas duplicadas com o mesmo nome dentro do mesmo usuário.

## 7. Tabela `competencies`

Representa competências acompanhadas pelo usuário. Exemplos previstos no projeto incluem disciplina, foco e estudo.

| Campo | Tipo PostgreSQL | Nulo | Regra |
|---|---|---:|---|
| `id` | `BIGINT` | Não | PK |
| `user_id` | `BIGINT` | Não | FK → `users.id` |
| `name` | `VARCHAR(100)` | Não | Nome da competência |
| `created_at` | `TIMESTAMPTZ` | Não | Data/hora de criação |
| `updated_at` | `TIMESTAMPTZ` | Não | Última atualização |

### Constraints

- `PRIMARY KEY (id)`.
- `FOREIGN KEY (user_id) REFERENCES users(id)`.
- `UNIQUE (user_id, name)`.

## 8. Tabela `routines`

Representa uma organização recorrente de atividades.

| Campo | Tipo PostgreSQL | Nulo | Regra |
|---|---|---:|---|
| `id` | `BIGINT` | Não | PK |
| `user_id` | `BIGINT` | Não | FK → `users.id` |
| `name` | `VARCHAR(150)` | Não | Nome da rotina |
| `description` | `TEXT` | Sim | Descrição opcional |
| `created_at` | `TIMESTAMPTZ` | Não | Data/hora de criação |
| `updated_at` | `TIMESTAMPTZ` | Não | Última atualização |

### Observação de escopo

A estrutura de recorrência detalhada ainda é uma decisão pendente. Portanto, este esquema **não cria campos de frequência, dias da semana, intervalo ou regra de repetição** até que essa regra seja aprovada.

## 9. Tabela `goals`

Representa um resultado desejado acompanhado dentro de um período.

| Campo | Tipo PostgreSQL | Nulo | Regra |
|---|---|---:|---|
| `id` | `BIGINT` | Não | PK |
| `user_id` | `BIGINT` | Não | FK → `users.id` |
| `title` | `VARCHAR(150)` | Não | Identificação da meta |
| `description` | `TEXT` | Sim | Descrição opcional |
| `start_date` | `DATE` | Não | Início do período |
| `end_date` | `DATE` | Não | Fim do período |
| `created_at` | `TIMESTAMPTZ` | Não | Data/hora de criação |
| `updated_at` | `TIMESTAMPTZ` | Não | Última atualização |

### Constraints

- `PRIMARY KEY (id)`.
- `FOREIGN KEY (user_id) REFERENCES users(id)`.
- `CHECK (end_date >= start_date)`.

A regra de estados e o modelo definitivo de progresso da meta permanecem pendentes e não são materializados como campos inventados neste documento.

## 10. Tabela `tasks`

Representa uma atividade executável e seu registro de execução.

| Campo | Tipo PostgreSQL | Nulo | Regra |
|---|---|---:|---|
| `id` | `BIGINT` | Não | PK |
| `user_id` | `BIGINT` | Não | FK → `users.id` |
| `area_id` | `BIGINT` | Não | FK → `areas.id` |
| `routine_id` | `BIGINT` | Sim | FK → `routines.id` |
| `goal_id` | `BIGINT` | Sim | FK → `goals.id` |
| `title` | `VARCHAR(200)` | Não | Título |
| `description` | `TEXT` | Sim | Descrição opcional |
| `task_date` | `DATE` | Não | Data da tarefa |
| `task_time` | `TIME` | Sim | Horário opcional |
| `priority` | `VARCHAR(30)` | Não | Valor definido pela aplicação |
| `completed` | `BOOLEAN` | Não | `FALSE` por padrão |
| `created_at` | `TIMESTAMPTZ` | Não | Data/hora de criação |
| `completed_at` | `TIMESTAMPTZ` | Sim | Data/hora da conclusão |
| `updated_at` | `TIMESTAMPTZ` | Não | Última atualização |

### Constraints

- `PRIMARY KEY (id)`.
- `FOREIGN KEY (user_id) REFERENCES users(id)`.
- `FOREIGN KEY (area_id) REFERENCES areas(id)`.
- `FOREIGN KEY (routine_id) REFERENCES routines(id)`.
- `FOREIGN KEY (goal_id) REFERENCES goals(id)`.
- `CHECK` garantindo coerência entre `completed` e `completed_at` será definido na migration final conforme a política de reversão de conclusão aprovada.

### Regra de status

O requisito aprovado garante os estados **concluída** e **não concluída**. Por isso o esquema utiliza `completed BOOLEAN` em vez de introduzir estados adicionais como `IN_PROGRESS` sem autorização.

## 11. Tabela `task_competencies`

Implementa a relação de muitas-para-muitas entre tarefas e competências, permitindo que uma tarefa possua múltiplas competências.

| Campo | Tipo PostgreSQL | Nulo | Regra |
|---|---|---:|---|
| `task_id` | `BIGINT` | Não | FK → `tasks.id` |
| `competency_id` | `BIGINT` | Não | FK → `competencies.id` |

### Constraints

- `PRIMARY KEY (task_id, competency_id)`.
- `FOREIGN KEY (task_id) REFERENCES tasks(id)`.
- `FOREIGN KEY (competency_id) REFERENCES competencies(id)`.

## 12. Relacionamentos

```text
USERS 1 ───── N AREAS
USERS 1 ───── N COMPETENCIES
USERS 1 ───── N ROUTINES
USERS 1 ───── N GOALS
USERS 1 ───── N TASKS

AREAS 1 ───── N TASKS
ROUTINES 1 ── N TASKS   (opcional em TASKS)
GOALS 1 ───── N TASKS   (opcional em TASKS)

TASKS N ───── N COMPETENCIES
       via TASK_COMPETENCIES
```

## 13. Integridade de propriedade

Uma tarefa pertencente ao usuário A não pode apontar para área, rotina, meta ou competência pertencente ao usuário B.

Essa regra precisa ser garantida pela aplicação e pelos mecanismos de integridade escolhidos para o banco. A simples existência de chaves estrangeiras isoladas não é suficiente para garantir propriedade cruzada.

A solução física definitiva para esse isolamento — por exemplo, constraints compostas, chaves de propriedade ou validação transacional no serviço — deverá ser fechada antes das migrations finais.

## 14. Exclusão e atualização

O comportamento de exclusão em cascata **não será presumido**.

Antes das migrations finais, deve ser decidido, para cada relação, se a exclusão será:

- bloqueada quando houver dependências;
- desvinculada;
- propagada em cascata;
- tratada pela aplicação.

Nenhum agente deve escolher silenciosamente uma dessas estratégias quando ela alterar comportamento funcional.

## 15. Índices mínimos

Os seguintes índices são justificados pelo modelo atual:

- `users(email)` por causa do login e unicidade.
- `areas(user_id)`.
- `competencies(user_id)`.
- `routines(user_id)`.
- `goals(user_id)`.
- `tasks(user_id, task_date)` para consultas das tarefas do usuário por data.
- `tasks(area_id)`.
- `tasks(routine_id)`.
- `tasks(goal_id)`.
- `task_competencies(competency_id)` para consultas por competência.

Índices adicionais somente devem ser incluídos com justificativa de consulta ou evidência de necessidade.

## 16. Métricas e relatórios

O banco deve preservar os registros necessários para que métricas sejam calculadas posteriormente a partir de dados reais.

Não será criada uma tabela de métricas consolidadas no MVP sem que a fórmula, período, agregação, arredondamento e política para ausência de dados sejam aprovados.

A arquitetura já reserva o módulo de métricas, mas a fórmula definitiva permanece pendente.

## 17. Gamificação

Não serão criadas estruturas definitivas de pontos, níveis, medalhas, ranking ou recompensas nesta versão do esquema.

A gamificação foi deliberadamente deixada para uma proposta específica do Atlas e posterior aprovação de Daniel.

## 18. IA

Não há tabela específica de IA nesta versão.

A integração de IA ocorrerá somente depois que o núcleo estiver funcional e validado, conforme arquitetura aprovada.

## 19. Migrations

A implementação do banco deverá utilizar migrations versionadas.

Cada migration deve:

1. possuir identificação sequencial;
2. criar ou alterar somente estruturas especificadas;
3. preservar integridade referencial;
4. ser revisável e reproduzível;
5. possuir testes ou evidência de validação quando aplicável;
6. não apagar dados ou estruturas existentes sem autorização explícita.

A ferramenta de migration ainda não foi fixada neste documento para evitar adicionar uma dependência não aprovada.

## 20. Segurança do banco

- Credenciais do banco não devem ser armazenadas no código-fonte.
- A aplicação deve utilizar usuário de banco com privilégios mínimos necessários.
- Senhas de usuários devem existir apenas como hashes seguros.
- Logs não devem registrar senhas ou credenciais.
- Consultas devem utilizar mecanismos parametrizados/ORM para reduzir risco de SQL injection.

## 21. Decisões pendentes relacionadas ao banco

### DP-B01 — Estratégia física de identificação

Definir o mecanismo definitivo de geração de IDs (`BIGINT` sequencial, identidade ou outra estratégia aprovada).

### DP-B02 — Exclusão

Definir comportamento de exclusão de entidades relacionadas.

### DP-B03 — Isolamento de propriedade

Fechar a estratégia física para impedir referências cruzadas entre dados de usuários diferentes.

### DP-B04 — Prioridade

Definir os valores válidos para `priority` e sua validação.

### DP-B05 — Recorrência

Definir a regra de recorrência das rotinas antes de adicionar campos específicos.

### DP-B06 — Métricas

Definir fórmulas e agregações antes de persistir indicadores derivados.

### DP-B07 — Migrações

Selecionar a ferramenta de migrations quando a implementação do banco for iniciada.

## 22. Critérios de aceitação do schema

- [ ] Todas as entidades centrais possuem definição.
- [ ] Todas as relações principais possuem chaves estrangeiras.
- [ ] Tarefas suportam múltiplas competências.
- [ ] Áreas são personalizadas por usuário.
- [ ] Rotinas e metas podem ser vinculadas opcionalmente a tarefas.
- [ ] Tarefa suporta concluída/não concluída sem inventar estados adicionais.
- [ ] Senhas não são armazenadas em texto puro.
- [ ] Dados de usuários possuem isolamento de propriedade.
- [ ] Índices essenciais estão identificados.
- [ ] Métricas não possuem fórmula inventada.
- [ ] Gamificação não possui mecânicas inventadas.
- [ ] IA não foi acoplada ao núcleo do banco.
- [ ] Decisões pendentes estão explicitamente registradas.
- [ ] O schema pode ser transformado em migrations sem adivinhações relevantes.

## 23. Prompt para auditoria do Codex

> Atue como auditor técnico independente do `DATABASE_SCHEMA.md` do projeto J.A.R.V.I.S.
>
> Compare este documento com `JARVIS_MASTER_CONTEXT`, `JARVIS_REQUIREMENTS_SPEC` e `JARVIS_ARCHITECTURE.md`.
>
> Não altere o schema automaticamente.
>
> Verifique entidades, chaves primárias, chaves estrangeiras, cardinalidades, constraints, índices, isolamento entre usuários, segurança, campos inventados, decisões pendentes e compatibilidade com os requisitos.
>
> Procure principalmente:
> - relacionamentos incorretos;
> - campos sem justificativa nos requisitos;
> - regras de negócio embutidas indevidamente no banco;
> - risco de acesso cruzado entre usuários;
> - constraints ausentes;
> - índices desnecessários ou ausentes;
> - decisões ainda abertas tratadas como definitivas;
> - incompatibilidades com a arquitetura.
>
> Para cada achado informe: severidade, requisito/artefato afetado, evidência, impacto e correção mínima sugerida.
>
> Finalize com `PASS`, `PASS WITH RESERVATIONS` ou `FAIL`.

## 24. Próximo passo após aprovação

O próximo artefato técnico, depois da validação do schema e da resolução das pendências necessárias, será:

`API_CONTRACT.md`

A implementação do banco somente deve começar depois da validação deste documento e da definição das decisões necessárias para uma migration segura.

## 25. Regra de ouro

> **SE NÃO ESTIVER ESPECIFICADO, NÃO INVENTE.**  
> **SE ESTIVER ESPECIFICADO, NÃO ALTERE SEM AUTORIZAÇÃO.**  
> **SE HOUVER CONFLITO, PARE E PEÇA DECISÃO.**

---

**Fim de `DATABASE_SCHEMA.md`**
