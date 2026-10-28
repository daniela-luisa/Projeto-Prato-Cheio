# Diagramas — Prato Cheio

Atividade avaliativa da N2: diagramas gerados com IA, avaliados e evoluídos pelo grupo.

## Onde está cada parte

| Parte                                  | Arquivo                                                                          |
| -------------------------------------- | -------------------------------------------------------------------------------- |
| Versões originais da IA (sem correção) | `original-ia/ia-casos-de-uso.md` e `original-ia/ia-estados.md` |
| Versão final: casos de uso             | `casos-de-uso.md`                                                                |
| Versão final: estados da doação        | `estados.md`                                                                     |
| Escolha, problemas e reflexão          | este arquivo                                                                     |

## Ferramenta de diagramas

Mermaid, porque é texto (versionável no Git) e o GitHub mostra o diagrama direto no arquivo `.md`. O Mermaid não tem um tipo próprio para casos de uso, então esse diagrama foi feito como fluxograma (`flowchart`). O de estados usa o tipo nativo `stateDiagram-v2`.

## Parte 1 — Diagramas escolhidos

1. **Casos de uso (UML):** responde "quem usa o sistema e para fazer o quê?". Mostra os atores e as funcionalidades que cada um usa.
2. **Estados (UML):** responde "por quais estados uma doação passa e o que faz ela mudar?". É o diagrama que mostra as regras de negócio aplicadas ao ciclo de vida da doação.

Os dois respondem a perguntas diferentes: o primeiro olha para os usuários, o segundo para a doação.

## Parte 2 — Geração com IA

- **Ferramenta de IA:** Claude (Anthropic).
- **Data:** 07/10/2026.
- **Informações fornecidas:** o repositório (histórias de usuário e critérios de aceite em `docs/analise.md`, regras de negócio, decisões em `docs/projeto.md` e o código em `src/`) e o pedido: "Faça um diagrama de estados e de casos de uso. Quais atores interagem com o sistema e quais funcionalidades utilizam? Quais estados uma doação pode assumir e quais eventos provocam mudanças?"
- A IA entregou os diagramas como imagem. As versões em `original-ia/` são a transcrição em Mermaid desses mesmos diagramas, sem nenhuma correção.

## Parte 3 — Problemas encontrados

### Problema 1 — Casos de uso: "Tempo" modelado como ator

- **Problema:** a IA colocou "Tempo (prazo de X horas)" como ator ligado ao caso de uso "Liberar doação não retirada".
- **Justificativa:** ator, em UML, é algo externo que interage com o sistema. A liberação após X horas é uma regra automática do próprio sistema: a Decisão 3 do `projeto.md` escolheu que a doação aceita e não retirada volte sozinha para a lista de disponíveis, sem ninguém decidir (a alternativa B, a Marta decidir, foi descartada). Com "Tempo" como ator, o diagrama sugere um agente externo que a Marta ou a ONG poderiam acionar.
- **Correção:** remover o ator "Tempo". A liberação passa a ser representada como regra automática do sistema (caso de uso interno ou nota), ligada à Decisão 3, e marcada como planejada, porque o código ainda não a implementa.

### Problema 2 — Casos de uso: regra do limite de doações por ONG ausente

- **Problema:** nenhum caso de uso ou relação mostra que a ONG não pode ter mais de N doações aceitas e pendentes de retirada (regra de negócio 1 da análise).
- **Justificativa:** o `projeto.md` usa essa regra para atenuar a injustiça da Decisão 1 ("a primeira ONG que aceitar leva"): quem acompanha o sistema mais vezes levaria tudo. Sem ela no modelo, "Aceitar doação" parece sempre possível, e o diagrama esconde uma das condições que protegem as ONGs menores.
- **Correção:** acrescentar a regra ao caso "Aceitar doação", como extensão ("recusar aceite por limite") ou nota, e marcá-la como planejada, já que o `doacoes.js` não a implementa.

### Problema 3 — Estados: não existe estado para doação vencida

- **Problema:** o diagrama só tem Disponível, Aceita, Cancelada e Retirada. Nada acontece com uma doação disponível cuja validade passa.
- **Justificativa:** o alimento é perecível e a validade é campo obrigatório. O código só valida a validade na criação (`doacoes.js`), e `listarDisponiveis` filtra apenas por `status = 'disponivel'`. Uma doação que vence depois de publicada continuaria na lista, e uma ONG poderia aceitá-la. Isso também agrava o Risco 1 (vigilância sanitária).
- **Correção:** acrescentar o estado "Vencida" (final), com a transição Disponível → Vencida quando a validade passa, e registrar que isso ainda não é implementado.

### Problema 4 — Estados: tentativa recusada desenhada como transição

- **Problema:** a IA desenhou `Aceita --> Aceita : outra ONG - recusado`, um laço no estado "Aceita".
- **Justificativa:** o critério de aceite da História 3 diz que o sistema **bloqueia a ação e informa** que a doação não está mais disponível. O estado não muda. No código, `repo.aceitar` não atualiza nada (o `WHERE status = 'disponivel'` não casa) e `doacoes.js` lança o erro "já aceita por outra ONG". Isso é uma rejeição, não uma transição, e o laço usa a notação de forma incorreta.
- **Correção:** remover o laço e registrar a recusa como nota no estado "Aceita". Aproveitar para ligar "Cancelada" e "Retirada" ao estado final `[*]`, que a IA rotulou como finais mas não conectou.

## Parte 4 — Versões finais

Ver `casos-de-uso.md` e `estados.md`.

(Explicar com o que os diagramas foram conferidos: histórias, regras de negócio, decisões de projeto e estrutura do banco em `src/db.js`.)

## Reflexão final

**Qual dos dois diagramas foi mais útil para compreender ou questionar uma decisão do projeto? Por quê?**

(Resposta do grupo.)
