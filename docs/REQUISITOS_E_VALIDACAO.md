# Correspondência ao PCC e validação

Fonte exclusiva de requisitos deste ciclo: **PCC_JARVIS_ESTRUTURA_PROF_SANDRA_ABNT(2).pdf**, de Daniel Aguiar, 2026. Referências de página abaixo correspondem à numeração impressa.

| Requisito / origem | Implementação | Parte |
| --- | --- | --- |
| Painel resumido (p. 11) | Visão geral com progresso diário, metas, constância, próximas tarefas e competências | 1 |
| CRUD de tarefas e status (p. 6, 10, 12) | Criar, editar, excluir, concluir e reabrir; prioridade; data, horário e descrição | 1 |
| Rotinas e recorrência (p. 6, 9) | Dias da semana, início e fim, pausa, retomada, tarefa independente por ocorrência | 1 |
| Metas e prazos (p. 6, 11) | CRUD, conclusão explícita e acompanhamento de tarefas vinculadas | 1 |
| Armazenamento confiável (p. 10–12) | D1, isolamento por usuário, validação do estado e versão otimista | 1 |
| Áreas personalizáveis (p. 6, 10) | CRUD e associação às tarefas, rotinas e metas | 2 |
| Competências personalizáveis (p. 6, 11) | CRUD e múltiplos vínculos por tarefa ou rotina | 2 |
| Indicadores percentuais (p. 11–12) | Fórmula do PDF, grupos com denominadores próprios, datas e filtros | 2 |
| Relatórios e evolução (p. 11) | 7/30 dias, trimestre atual e período personalizado; tabelas e gráfico | 2 |
| Conquistas e troféus (p. 9, 11) | Seis marcos verificáveis por execução, metas e constância | 2 |
| Personalização e áudio (p. 9, 12) | Três temas, movimento reduzido e síntese de voz do navegador | 3 |
| Oferta comercial (p. 13) | Catálogo completo de 20 itens com preços e descrições equivalentes ao original | 3 |
| Módulos adicionais e serviços (p. 13–15) | Identificados como planejados; sem contratação, cobrança ou integração fictícia | 3 |
| Validação de fluxos e cálculos (p. 12) | Testes de domínio, persistência, autorização e renderização do servidor | 3 |

## Decisões implementadas para completar detalhes não definidos pelo PDF

- O período analítico usa a data de prazo. O PDF fornece a fórmula, mas não determina qual data usar.
- São permitidas várias competências por tarefa; cada uma recebe a contribuição completa dessa tarefa.
- Gamificação: primeira tarefa; 10 tarefas; 3 e 7 dias consecutivos; primeira meta concluída; 50 tarefas.
- Prazo é obrigatório para tarefas e metas. Horário e descrição são opcionais.
- Uma rotina gera uma atividade por dia escolhido. Essa ocorrência recebe seu próprio prazo e conclusão.
- As funcionalidades implementadas estão liberadas no protótipo acadêmico. O limite de três competências do plano gratuito é preservado no catálogo comercial, sem fingir que uma assinatura foi adquirida.

## Evidências

A suíte `tests/domain.test.mjs` cobre oito cenários controlados:

1. Dez tarefas, oito concluídas: 80%, incluindo denominador por competência.
2. Inclusão exata das datas inicial/final dos períodos.
3. Geração idempotente de recorrências e independência de conclusões.
4. Exclusão de ocorrência sem recriação; exclusão de rotina preservando histórico.
5. Remoção atômica dos vínculos de áreas, competências e metas.
6. Rejeição de datas inexistentes, relações órfãs, IDs duplicados e conclusão inconsistente.
7. Constância e marcos revistos após reabertura de registros.
8. Dias úteis, pausa e fim de recorrência.

Validação adicional da API com o Worker compilado e banco SQLite isolado: rejeição de acesso anônimo, criação e leitura, isolamento entre duas identidades de teste, conflito de edição, rejeição de relações inválidas, edição/conclusão, bloqueio de origem externa e exclusão. Renderização do servidor verificada para a página inicial e ação principal.

A compilação e a checagem de tipos são verificadas antes da publicação. Não houve sessão de teste visual em navegador nem teste real de impressão, voz ou WebMCP; essas capacidades dependem do ambiente do usuário. Testes automatizados não substituem a pesquisa de usabilidade com usuários proposta no PCC.

## Expansões que ainda exigem desenvolvimento ou operação

IA generativa e recomendação avançada; OAuth/sincronização de calendários; backup automático e restauração avançada; API pública; gestão corporativa; metodologias prontas; finanças; cobrança e licenciamento; consultoria, análise profissional, treinamento e atendimento 24/7.

## Preparação para hospedagem independente (17/09/2026)

As funcionalidades acima foram mantidas. O acesso passa a usar OAuth GitHub com PKCE e sessões D1; as gravações continuam isoladas por usuário e protegidas contra conflitos. Foi adicionada importação das exportações anteriores, com validação do conteúdo e confirmação de substituição.

A suíte de domínio mantém os oito cenários originais. Quatro testes adicionais verificam compatibilidade/validação das exportações e configuração de produção sem vazamento de segredos. A integração do Worker cobre identidade forjada, vínculo OAuth com navegador, expiração, PKCE, repetição de callback, persistência, isolamento, conflitos, dados inválidos, CSRF, renderização, cookies repetidos, reentrada, logout e falha do provedor. Apenas as respostas externas do GitHub são simuladas.

A configuração das contas externas, o envio ao repositório de destino e a validação real do callback público dependem do acesso às contas do responsável. A preparação do pacote não transfere os registros pessoais automaticamente.
