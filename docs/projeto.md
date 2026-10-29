# Documento de Projeto — Prato Cheio

*Trabalho 2 · máximo 4 páginas (fora diagramas) · entrega na Aula 10*

## Decisões de projeto
| # | Decisão | Alternativas | Requisito/risco da Análise que a motiva |
|---|---|---|---|
| 1 | Quem fica com a doação quando duas ONGs querem a mesma? | **A (escolhida):** a primeira ONG que aceitar leva a doação.<br>**B:** as ONGs manifestam interesse durante uma janela curta e a coordenadora (Marta) decide quem leva. | Regra de negócio explícita "doação aceita não fica disponível para outra ONG" e critério de aceite da História 3 ("Aceite de doação já aceita → o sistema bloqueia a ação"). Implementada e validada pelo teste "recusa aceitar uma doação que já foi aceita por outra ONG". |
| 2 | Como guardar o histórico da doação? | **A:** tudo na própria tabela de doações, com o status sendo atualizado e colunas de data.<br>**B (escolhida):** uma tabela separada de eventos (publicada, aceita, retirada, cancelada), em que cada mudança vira uma linha nova que nunca é alterada nem apagada. | Risco 1 (vigilância sanitária): a mitigação precisa manter um histórico auditável, sem apagar registros. Na Alternativa A, cada atualização sobrescreve o estado anterior, então numa fiscalização só daria para mostrar o estado atual da doação. Ainda não implementada: o código atual segue a Alternativa A. |
| 3 | O que acontece com uma doação aceita que não é retirada? | **A (escolhida):** volta automaticamente para a lista de disponíveis depois de X horas.<br>**B:** a Marta é avisada e decide se libera, cobra a ONG ou cancela. | Regra de negócio 3 (prazo de retirada) e papel da Marta no mapa de stakeholders, que já aprova doadores e intermedia conflitos. A Alternativa B atribuiria mais uma tarefa manual para ela. |

## Tabela de trade-offs (uma decisão em detalhe)
**Decisão 1: Quem fica com a doação quando duas ONGs querem a mesma?**

| Critério | Alternativa A: primeira que aceitar leva | Alternativa B: janela de interesse + Marta decide |
|---|---|---|
| Tempo até a coleta (alimento perecível) | Ganha: a ONG sabe na hora e já pode buscar | Perde: a janela e a decisão consomem tempo que o alimento não tem |
| Justiça entre ONGs | Perde: favorece quem acompanha o sistema com mais frequência | Ganha: permite priorizar quem precisa mais ou está mais perto |
| Carga de trabalho da Marta | Ganha: não aumenta, ela não precisa intervir | Perde: cada disputa vira uma decisão manual |
| Complexidade de implementação | Ganha: um único comando SQL, já implementado e testado | Perde: exige novo estado, prazo da janela e tela para a Marta |
| Dependência de uma pessoa | Ganha: funciona de noite e nos fins de semana | Perde: sem a Marta disponível, a doação fica parada |

**Quem paga a conta:** na A, saem prejudicadas as ONGs menores ou menos conectadas, que perdem disputas. Na B, a Marta acaba com mais trabalho e o alimento fica mais tempo parado, o que dificulta o projeto crescer.

**Escolha:** Alternativa A, porque no caso o principal inimigo é o tempo. A injustiça entre ONGs pode ser atenuada pela regra de negócio 1 (limite de N doações pendentes por ONG).

## Diagramas
Reflexão final qual diagrama foi mais útil

O diagrama de Casos de Uso foi o mais útil para dar visão geral do produto. Ele mostra, de uma vez, os 4 atores do sistema e separa claramente o que já está implementado do que ainda é planejado. Isso deixa facil de avaliar, num olhar só, o tamanho do que falta construir em relação ao que já existe.

verificar em `docs/estados.md` e `docs/casos-de-uso`

## Histórias implementadas e decisões

**Cancelamento de doação** (2ª história nova, implementada por Heitor)
 
> Como doador, quero cancelar uma doação enquanto nenhuma ONG a aceitou, para que eu possa retirar uma oferta que não posso mais cumprir.
 
Essa foi a história escolhida com base na regra de negócio 2 do `docs/analise.md`
 
**Critérios de aceite cobertos (8 cenários, CA01–CA08):**
- Cancelamento de doação disponível (sucesso)
- Tentativa de cancelar doação já aceita por uma ONG (bloqueado, orienta contato com a coordenação)
- Id inexistente ou inválido (erro, nenhuma doação afetada)
- Doação já cancelada (nova tentativa de cancelar ou aceitar é bloqueada)
- Aceite e cancelamento disputando a mesma doação ao mesmo tempo (só um vence)
- Integridade do registro cancelado no banco (dado não é apagado, só o status muda)
- Usuário desiste da confirmação na tela (nenhuma requisição é enviada)
- Tela desatualizada tentando cancelar doação que acabou de ser aceita por outra ONG (erro tratado corretamente)
**Implementação:** rota `POST /api/doacoes/:id/cancelar`, regra de negócio em `doacoes.js` (`cancelar`), persistência em `repositorio.js` (`cancelar`), botão de confirmação na interface. A concorrência entre aceite e cancelamento é resolvida com um único `UPDATE` parametrizado (`WHERE id = ? AND status = 'disponivel'`), seguindo o mesmo padrão já usado na função `aceitar` da Unidade 1 — sem checagem prévia, evitando condição de corrida.
 
**Testes:** 8 testes de integração em `tests/cancelamento.test.js`, cobrindo CA01–CA06 com API real e SQLite em memória. CA07 e CA08 (interação de tela) são verificados manualmente, pois dependem de comportamento de interface, não só de backend.
 
**Limitações assumidas e documentadas:** não há autenticação nem dono registrado da doação (o protótipo verifica status, não propriedade); cancelamento pós-aceite continua exigindo contato manual com a Marta, sem rota de força; desistência (ONG recusar depois de aceitar), limite por ONG, expiração automática e histórico de eventos ficam fora do escopo desta entrega.

### Decisão de escopo registrada
 
O grupo documentou explicitamente que a escolha de "cancelamento" como a 2ª história nova foi uma **suposição de trabalho**, já que o enunciado da atividade não especificava qual seria essa história — a decisão foi justificada com base na regra de negócio 2 da Análise, e fica marcada para confirmação do grupo na revisão.

## ADRs

Resumo dos 3 ADRs registrados em `docs/adr/` (conteúdo completo nos arquivos individuais):

| ADR | Decisão | Status | Por quê (resumo) |
|---|---|---|---|
| **0001** — PostgreSQL como banco | Trocar SQLite por PostgreSQL a partir da Unidade 3 | Aceito | SQLite é um arquivo local, de um escritor por vez — não atende acesso simultâneo de ONGs/Marta nem a restrição da disciplina (banco relacional via `DATABASE_URL`). PostgreSQL resolve isso mantendo a trava de concorrência do `aceitar` (via linha do banco), e a troca fica isolada em `src/db.js` (`query()` devolvendo `{ rows }`). |
| **0002** — Hospedagem do PostgreSQL | Serviço gerenciado com plano gratuito (ex.: Neon/Supabase) para produção; contêiner PostgreSQL no CI | **Substituído pelo ADR 0003** | No piloto (um bairro, sem patrocinador — Risco 2), custo zero era decisivo. Rejeitado: instalar localmente (não acessível pelas ONGs) e Docker local (ainda depende de alguém manter a máquina ligada). |
| **0003** — Hospedagem para várias cidades | Plano pago do mesmo tipo de serviço gerenciado (substitui o ADR 0002) | Aceito | Com o produto passando a atender várias cidades, o plano gratuito do ADR 0002 não comporta mais o volume (limites de conexão, pausa por ociosidade atrasando o tempo de coleta, falta de backup agravando o Risco 1). Rejeitada a alternativa de servidor próprio (VPS): a equipe não tem quem administre banco, e o risco de perda de dados por má administração custa mais que a mensalidade. **Consequência importante:** expandir para outras cidades passa a depender de haver um patrocinador que pague o plano (Risco 2 vira bloqueante).

## Requisitos não-funcionais

| # | Requisito | Como se verifica | Como afeta o design |
|---|------------------------|------------------|---------------------|
| RNF01 | Toda mudança de estado de uma doação (publicada, aceita, retirada, cancelada) gera um registro com data e hora e ONG responsável. Os registros nunca são alterados nem apagados. | Teste que leva a doação por todos os estados e confere uma linha de evento por mudança, e que não existe rota de alteração ou remoção. | Tabela separada de eventos em vez de sobrescrever o status. Custo: mais uma tabela e mais escrita por operação. |
| RNF02 | GET /api/doacoes responde em até [500 ms] no percentil 95, com [10 mil] doações no banco. | Teste de carga medindo o p95 com [10 mil] doações. | Índices em status e criada_em, e sem pausa por ociosidade (ADR 0003). Custo: espaço extra e escrita um pouco mais lenta. |
| RNF03 | Uma ONG da cidade X recebe, em GET /api/doacoes, zero doações de outras cidades, e 100% das doações têm cidade preenchida. | Teste com doações de 2 cidades e uma ONG de cada, conferindo que as listas não se cruzam. | Novo campo cidade no schema e filtro na listagem. |

## Critérios de validação do projeto

- As decisões de projeto (1, 2 e 3) devem estar implementadas ou claramente marcadas como pendentes, sem alegar que algo está pronto quando não está (ex.: Decisão 2 ainda não implementada, registrado explicitamente).
- A trava de concorrência da Decisão 1 precisa continuar coberta por teste automatizado (`recusa aceitar uma doação que já foi aceita por outra ONG`), já validada na Unidade 1.
- Os 3 ADRs precisam ter rastreabilidade explícita a um requisito, risco ou regra de negócio da Análise — critério já atendido pelos 3 ADRs atuais.
- Qualquer nova história implementada nesta unidade deve vir com critérios de aceite no formato Dado/Quando/Então e teste cobrindo o cenário de erro, não só o caminho feliz (conforme o padrão já usado na história zero).
- O CI precisa continuar verde após qualquer mudança de schema ou dependência (ex.: ao preparar a migração para PostgreSQL).

## Reflexão final: decisão técnica mais importante já tomada

A decisão técnica mais difícil que o grupo tomou até agora não foi uma escolha de tecnologia, mas a forma de lidar com concorrência sem usar travas explícitas no código. Tanto aceitar (Unidade 1) quanto cancelar (esta entrega) resolvem o mesmo tipo de problema, duas operações disputando a mesma doação ao mesmo tempo,com um único UPDATE SQL parametrizado que só afeta a linha se ela ainda estiver no status esperado (WHERE id = ? AND status = 'disponivel'), sem fazer uma checagem separada antes de atualizar.

Foi difícil porque a solução mais intuitiva seria checar o status primeiro (SELECT) e só então decidir se atualiza — mas isso abre uma janela de tempo entre checar e agir, onde duas requisições simultâneas poderiam "ver" o mesmo estado disponível e as duas tentarem prosseguir. A solução adotada empurra essa responsabilidade para o próprio banco de dados, que garante atomicidade na operação.

Como verificamos: com testes automatizados que simulam diretamente o cenário de disputa — no caso do cancelamento, o CA05 cobre aceite e cancelamento disputando a mesma doação ao mesmo tempo, confirmando que apenas uma operação é bem-sucedida e o registro final corresponde a quem "venceu". A reutilização do mesmo padrão em duas histórias diferentes (aceitar e cancelar) também foi uma forma de validar que a decisão generaliza bem, e não foi uma solução pontual para um caso só.

## Uso de IA

Usamos IA no nível declarado para este trabalho **IA para consulta** para: revisar a consistência entre as decisões de projeto e os riscos/regras de negócio definidos na Análise, esclarecer dúvidas conceituais e organizar a estrutura deste documento a partir do conteúdo já produzido e decidido pelo grupo. As decisões em si, quais alternativas considerar, qual escolher e por quê, foram tomadas pelo grupo.