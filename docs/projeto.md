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
(contexto + dados ou componentes — em `docs/` ou como imagem)

## ADRs
Ver `docs/adr/`.

## Requisitos não-funcionais
| Requisito | Como afeta o design |
|---|---|

## Critérios de validação do projeto

## Uso de IA
