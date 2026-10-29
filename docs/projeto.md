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

## ADRs
Ver `docs/adr/`.

## Requisitos não-funcionais

| # | Requisito | Como se verifica | Como afeta o design |
|---|------------------------|------------------|---------------------|
| RNF01 | Toda mudança de estado de uma doação (publicada, aceita, retirada, cancelada) gera um registro com data e hora e ONG responsável. Os registros nunca são alterados nem apagados. | Teste que leva a doação por todos os estados e confere uma linha de evento por mudança, e que não existe rota de alteração ou remoção. | Tabela separada de eventos em vez de sobrescrever o status. Custo: mais uma tabela e mais escrita por operação. |
| RNF02 | GET /api/doacoes responde em até [500 ms] no percentil 95, com [10 mil] doações no banco. | Teste de carga medindo o p95 com [10 mil] doações. | Índices em status e criada_em, e sem pausa por ociosidade (ADR 0003). Custo: espaço extra e escrita um pouco mais lenta. |
| RNF03 | Uma ONG da cidade X recebe, em GET /api/doacoes, zero doações de outras cidades, e 100% das doações têm cidade preenchida. | Teste com doações de 2 cidades e uma ONG de cada, conferindo que as listas não se cruzam. | Novo campo cidade no schema e filtro na listagem. |

## Critérios de validação do projeto

## Reflexão final: decisão técnica mais importante já tomada

A decisão técnica mais difícil que o grupo tomou até agora não foi uma escolha de tecnologia, mas a forma de lidar com concorrência sem usar travas explícitas no código. Tanto aceitar (Unidade 1) quanto cancelar (esta entrega) resolvem o mesmo tipo de problema, duas operações disputando a mesma doação ao mesmo tempo,com um único UPDATE SQL parametrizado que só afeta a linha se ela ainda estiver no status esperado (WHERE id = ? AND status = 'disponivel'), sem fazer uma checagem separada antes de atualizar.

Foi difícil porque a solução mais intuitiva seria checar o status primeiro (SELECT) e só então decidir se atualiza — mas isso abre uma janela de tempo entre checar e agir, onde duas requisições simultâneas poderiam "ver" o mesmo estado disponível e as duas tentarem prosseguir. A solução adotada empurra essa responsabilidade para o próprio banco de dados, que garante atomicidade na operação.

Como verificamos: com testes automatizados que simulam diretamente o cenário de disputa — no caso do cancelamento, o CA05 cobre aceite e cancelamento disputando a mesma doação ao mesmo tempo, confirmando que apenas uma operação é bem-sucedida e o registro final corresponde a quem "venceu". A reutilização do mesmo padrão em duas histórias diferentes (aceitar e cancelar) também foi uma forma de validar que a decisão generaliza bem, e não foi uma solução pontual para um caso só.

## Uso de IA
