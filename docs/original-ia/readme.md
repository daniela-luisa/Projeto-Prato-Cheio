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

### Problema 1 — (diagrama): (título curto)

- **Problema:**
- **Justificativa:**
- **Correção:**

### Problema 2 — (diagrama): (título curto)

- **Problema:**
- **Justificativa:**
- **Correção:**

## Parte 4 — Versões finais

Ver `casos-de-uso.md` e `estados.md`.

(Explicar com o que os diagramas foram conferidos: histórias, regras de negócio, decisões de projeto e estrutura do banco em `src/db.js`.)

## Reflexão final

**Qual dos dois diagramas foi mais útil para compreender ou questionar uma decisão do projeto? Por quê?**

(Resposta do grupo.)
