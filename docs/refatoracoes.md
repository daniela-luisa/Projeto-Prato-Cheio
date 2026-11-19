# Refatorações — Prato Cheio

*Trabalho 3 · uma seção por refatoração · o que importa é o motivo e a evidência*

> **Refatorar** = mudar a estrutura do código **sem mudar o comportamento**.
> Por isso, em cada refatoração abaixo: (1) conferimos se havia testes cobrindo o trecho;
> (2) onde não havia, escrevemos testes de caracterização **antes** de mexer e vimos eles passarem no código original;
> (3) refatoramos; (4) rodamos a suíte inteira de novo. Nenhum teste antigo foi alterado.

## Como a IA foi usada

- **Ferramenta:** Claude (Anthropic).
- **O que pedimos:** que lesse `src/` e `tests/`, apontasse cheiros de código usando o catálogo da aula (método longo, código duplicado, comentários desatualizados etc.), sugerisse a técnica de refatoração ([refactoring.guru](https://refactoring.guru/refactoring/techniques)) e escrevesse os testes que faltavam.
- **O que verificamos:** rodamos `npm test` antes e depois de cada passo; fizemos um **teste de mutação manual** (estragamos o código de propósito para ver se os testes novos acusavam, e depois desfizemos); subimos a aplicação e testamos o fluxo pela API, como o CI faz.
- **O que descartamos ou mudamos:** a IA também achou um **bug** de fuso horário (ver abaixo). Como corrigir bug muda o comportamento, ele **não** entrou nas refatorações e ficou registrado para uma história separada.

## Linha de base

| Momento | Arquivos de teste | Testes passando |
|---|:--:|:--:|
| Antes de tudo (suíte original) | 4 | **24 / 24** |
| Depois de adicionar os testes de caracterização, **ainda com o código original** | 7 | **52 / 52** |
| Depois da Refatoração 1 | 7 | **52 / 52** |
| Depois da Refatoração 2 | 7 | **52 / 52** |
| Depois da Refatoração 3 | 7 | **52 / 52** |
| Depois da Refatoração 4 | 7 | **52 / 52** |

Verificações extras no estado final:
- suíte rodada **10 vezes seguidas**: 10 × 52/52 (o teste de concorrência aceitar × cancelar não ficou instável);
- suíte rodada com `TZ=America/Sao_Paulo`: 52/52;
- `npm start` + `curl --fail http://localhost:3000/api/saude` → `{"ok":true}` (o mesmo passo do CI);
- fluxo manual pela API: publicar → recusar sem campos (400) → aceitar → recusar cancelamento depois de aceita (400, mensagem da coordenação) → aparecer em `/api/entregas/disponiveis`.

**Testes novos** (escritos antes de refatorar, todos passando no código original):

| Arquivo | Protege | Qtd. |
|---|---|:--:|
| `tests/rotas.test.js` | Refatoração 1 — status de sucesso de cada rota, ONG padrão `"ONG"` e "qualquer exceção vira 400 `{ erro }`" em **todas** as rotas (provocando uma falha real de banco) | 8 |
| `tests/regras.test.js` | Refatoração 2 — **texto exato** de cada mensagem de erro, **ordem** das validações e o que hoje é aceito (quantidade em texto livre) | 11 |
| `tests/repositorio-transicoes.test.js` | Refatorações 3 e 4 — `aceitar`/`cancelar`/`listarAceitas` direto no repositório: transição certa, não altera nada quando o status não é `disponivel`, ONG preservada no cancelamento, ordenação | 9 |

**Teste de mutação manual** (para provar que os testes novos protegem de verdade): mudamos de propósito o código original em 4 pontos e rodamos os testes novos. Depois desfizemos.

| Mutação introduzida | Detectada? |
|---|:--:|
| rota devolvendo 500 em vez de 400 no erro | sim — `rotas.test.js` |
| mensagem `"validade já vencida"` trocada por `"validade vencida"` | sim — `regras.test.js` |
| `cancelar` passando a gravar uma ONG | sim — `repositorio-transicoes.test.js` |
| remover o desempate `, id` do `ORDER BY validade, id` | **não** — ver *Limitações* |

---

## Refatoração 1 — Extrair função `responder()` nas rotas

- **Cheiro de código atacado:** **código duplicado**. As 5 rotas de `src/app.js` repetiam o mesmo bloco `try { res.json(await …) } catch (erro) { res.status(400).json({ erro: erro.message }) }`.
- **Técnica:** *Extract Function* (Extrair Função).
- **Qual dor concreta isso resolvia:** cada rota nova (ex.: concluir retirada, liberar reserva) ia copiar o bloco de novo. Se o grupo decidisse mudar o formato de erro (ex.: devolver 404 para "não encontrada"), teria que alterar 5 lugares e um ficaria para trás — o *shotgun change* da aula.
- **O que mudou:**
  - `src/app.js`: nova função `responder(acao, statusSucesso = 200)` que executa a ação, responde com o JSON e transforma qualquer exceção em `400 { erro }`. Cada rota virou uma linha.

  ```js
  // antes (repetido 5 vezes)
  app.get('/api/doacoes', async (req, res) => {
    try { res.json(await doacoes.listarDisponiveis()); }
    catch (erro) { res.status(400).json({ erro: erro.message }); }
  });

  // depois
  app.get('/api/doacoes', responder(() => doacoes.listarDisponiveis()));
  app.post('/api/doacoes', responder(req => doacoes.criarDoacao(req.body), 201));
  ```
- **O que NÃO mudou:** URLs, métodos HTTP, códigos de status (200/201/400), formato `{ erro }`, a ONG padrão `"ONG"` quando o corpo vem vazio.
- **Evidência:** antes 52/52 → depois 52/52. Os testes que travam este comportamento estão em `tests/rotas.test.js` (eles derrubam a tabela para forçar um erro de banco e conferem o 400 em todas as rotas).

## Refatoração 2 — Quebrar o método longo `criarDoacao()`

- **Cheiro de código atacado:** **método longo** — `criarDoacao` em `src/doacoes.js` misturava três regras diferentes (campos obrigatórios, quantidade, validade) em ~28 linhas, com comentários explicando cada bloco.
- **Técnica:** *Extract Method* (Extrair Método). Os comentários que explicavam cada bloco viraram **nomes de função**.
- **Qual dor concreta isso resolvia:** para mexer numa regra (ex.: corrigir o bug de fuso da validade) era preciso ler a função inteira e arriscar quebrar as outras. Agora cada regra tem um lugar só, e `criarDoacao` se lê como a história de usuário.
- **O que mudou:**
  - `src/doacoes.js`: três funções internas — `exigirCamposObrigatorios`, `exigirQuantidadePositiva`, `exigirValidadeNaoVencida`.

  ```js
  export async function criarDoacao({ tipo, quantidade, validade }) {
    exigirCamposObrigatorios({ tipo, quantidade, validade });
    exigirQuantidadePositiva(quantidade);
    exigirValidadeNaoVencida(validade);
    return repo.inserir({ tipo, quantidade, validade });
  }
  ```
- **O que NÃO mudou:** a **ordem** das validações (quantidade é checada antes da validade), o **texto** de cada mensagem e o que é aceito hoje (inclusive quantidade em texto livre, como `"dez porções"`).
- **Evidência:** antes 52/52 → depois 52/52. Os testes antigos só conferiam o status 400; por isso criamos `tests/regras.test.js`, que trava a mensagem exata de cada caso e a ordem das validações.

## Refatoração 3 — Substituir strings soltas de status por constantes

- **Cheiro de código atacado:** **dados repetidos / "número mágico"** — os valores `'disponivel'`, `'aceita'` e `'cancelada'` estavam digitados à mão dentro do SQL do `src/repositorio.js` (6 vezes) e numa comparação em `src/doacoes.js`.
- **Técnica:** *Replace Magic Literal with Symbolic Constant* (Substituir literal mágico por constante).
- **Qual dor concreta isso resolvia:** um erro de digitação (`'aceitaa'`) passa calado — a consulta só não acha nada e o bug aparece em produção. Com `STATUS.ACEITAA` o valor vira `undefined` e o teste quebra na hora. Também deixa num só lugar quais estados existem (combina com `docs/estados.md`) e prepara a chegada de novos estados (ex.: `concluida`).
- **O que mudou:**
  - **novo** `src/status.js` com `export const STATUS = Object.freeze({ DISPONIVEL, ACEITA, CANCELADA })`;
  - `src/repositorio.js`: o status deixou de ser texto fixo no SQL e passou a ir como **parâmetro** `?` (`WHERE status = ?`, `[STATUS.DISPONIVEL]`);
  - `src/doacoes.js`: `existente.status === 'aceita'` → `existente.status === STATUS.ACEITA`;
  - também removemos os comentários `TODO (grupo): implementar…` do topo do repositório, que já estavam **desatualizados** (as funções já tinham sido implementadas) — cheiro *comentários excessivos/enganosos*.
- **O que NÃO mudou:** os valores gravados no banco (são as mesmas strings) e o `DEFAULT 'disponivel'` do schema em `src/db.js`, que deixamos como está de propósito (é DDL, roda uma vez, e o `db.js` será reescrito na migração para PostgreSQL).
- **Evidência:** antes 52/52 → depois 52/52. Os testes de `cancelamento.test.js` comparam o registro inteiro do banco (`status: 'cancelada'`, `'aceita'`), então provam que os valores gravados continuam iguais.

## Refatoração 4 — Unificar as transições de status no repositório

- **Cheiro de código atacado:** **código duplicado** — `aceitar()` e `cancelar()` em `src/repositorio.js` eram o mesmo `UPDATE … WHERE id = ? AND status = 'disponivel' RETURNING *`, mudando só o status de destino (e a ONG).
- **Técnica:** *Extract Function* + *Parameterize Function* (Parametrizar Função).
- **Qual dor concreta isso resolvia:** a trava contra duas ONGs aceitarem a mesma doação (o `AND status = ?` no próprio UPDATE) é a regra mais importante da camada de dados e estava escrita duas vezes. As próximas histórias (concluir retirada, liberar reserva) iam copiar uma terceira e quarta vez — e bastava uma cópia esquecer o `AND status = ?` para reabrir a condição de corrida.
- **O que mudou:**
  - `src/repositorio.js`: nova função interna `transicionar(id, { de, para, ong })`, com a trava escrita **uma vez** e comentada. `aceitar` e `cancelar` viraram uma linha cada.

  ```js
  async function transicionar(id, { de, para, ong = null }) {
    const { rows } = await query(
      `UPDATE doacoes SET status = ?, ong = COALESCE(?, ong)
       WHERE id = ? AND status = ? RETURNING *`,
      [para, ong, id, de]
    );
    return rows[0];
  }

  export async function aceitar(id, ong) {
    return transicionar(id, { de: STATUS.DISPONIVEL, para: STATUS.ACEITA, ong });
  }
  export async function cancelar(id) {
    return transicionar(id, { de: STATUS.DISPONIVEL, para: STATUS.CANCELADA });
  }
  ```
  - `COALESCE(?, ong)` mantém a ONG atual quando nenhuma é passada — assim o cancelamento continua sem mexer na coluna `ong`.
- **O que NÃO mudou:** a assinatura pública de `aceitar(id, ong)` e `cancelar(id)`, o retorno (`linha` ou `undefined`) e a garantia contra corrida.
- **Evidência:** antes 52/52 → depois 52/52; 10 execuções seguidas sem falha. `tests/repositorio-transicoes.test.js` testa direto no repositório que a transição só acontece a partir de `disponivel`, que nada muda nos outros casos e que o cancelamento mantém `ong = null`; o teste de concorrência de `cancelamento.test.js` (aceitar × cancelar ao mesmo tempo) continua garantindo que só uma transição vence.

---

## Bug encontrado durante a análise (não corrigido aqui)

**Validade "hoje" é rejeitada no fuso do Brasil.** Em `exigirValidadeNaoVencida`, `new Date('2026-11-18')` é interpretado como meia-noite **UTC**, que no Brasil (UTC−3) é 21h do dia **anterior**; já `hoje` é meia-noite **local**. Resultado: com `TZ=America/Sao_Paulo`, uma doação com validade de hoje recebe `"validade já vencida"`. No CI (servidor em UTC) não aparece, por isso a suíte passa.

Como corrigir muda o comportamento, **não é refatoração** — fica para uma história/PR próprio, com um teste que rode com o relógio fixo em horário de Brasília. Correção sugerida: montar a data como local, `new Date(validade + 'T00:00:00')`, e validar o formato `AAAA-MM-DD`.

---

**Limitações e o que ficou de fora:**

- **Desempate por `id` na ordenação** (`ORDER BY validade, id` / `criada_em, id`): o teste de mutação mostrou que nenhum teste quebra se o `, id` for removido, porque o SQLite já devolve as linhas na ordem de inserção. A garantia só vai ser testável de verdade no PostgreSQL, que não promete ordem nenhuma sem `ORDER BY`.
- **Quantidade em texto livre** (`"dez porções"`) é aceita. Os testes de caracterização registram isso como comportamento atual; se o grupo quiser exigir número, é uma mudança de regra (história nova), não refatoração.
- **`aceitar` com ONG vazia:** `doacoes.aceitar` recusa ONG vazia, mas a rota troca a ausência de ONG por `"ONG"`, então pela API essa regra nunca dispara. Mantivemos igual e deixamos travado nos testes; vale o grupo decidir qual dos dois comportamentos é o certo.
- **Funções auxiliares duplicadas nos testes** (`validadeFutura`/`publicarDoacao` aparecem em vários arquivos): poderiam ir para `tests/helpers.js`. Ficou de fora para não mexer em testes que já existiam durante a refatoração.
- **`public/index.html`**: a montagem da lista no `carregar()` também é longa; não refatoramos porque não há teste automatizado de interface que proteja a mudança.

---

## Migração de SQLite para PostgreSQL

*(seção do modelo da disciplina — preencher quando a migração da Unidade 3 for feita)*

- **Motivo:** ver `docs/adr/0001-postgresql-como-banco.md`
- **O que mudou:** (arquivos e o que neles)
- **O que NÃO mudou:** (as regras de negócio? as rotas? os testes?)
- **Evidência de que o comportamento se manteve:**
  - testes antes da mudança: ___ passando
  - testes depois da mudança: ___ passando
  - link da execução do CI verde:
