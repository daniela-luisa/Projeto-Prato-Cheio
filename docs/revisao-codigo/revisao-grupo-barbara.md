# Revisão de código — grupo da Bárbara (Prato Cheio)

| | |
|---|---|
| **Repositório revisado** | [BarbaraScharf/g1126-template-prato-cheio](https://github.com/BarbaraScharf/g1126-template-prato-cheio) |
| **Integrantes do grupo revisado** | Ana Beatriz Pedrozo, Bárbara Scharf de Almeida, Leonardo André Ferreira, Marcelo Gustavo Eger, Willian Squena |
| **Revisado por** | grupo 202ErrorClub (Adrian, Daniela, Gustavo, Heitor, João) |
| **Versão revisada** | `main` no commit `7596f26` (merge do PR #13, "refactor: constantes de status, asyncHandler, buscarOuLancar…") |

## Como revisamos

Lemos o código de `src/` (controller, service, repository, `database/db.js`, `status.js`), os testes em `tests/doacoes.test.js`, o CI (`.github/workflows/ci.yml`), o `public/index.html` e a pasta `docs/`. Usamos IA (Claude) para fazer uma primeira leitura e apontar cheiros de código com base no catálogo da aula; **cada item abaixo foi conferido por nós no código**, com o arquivo e a linha indicados.

> Resultado de `npm test` na nossa máquina: ___ testes passando *(preencher)*

Legenda: ✅ atende · ⚠️ atende em parte / pode melhorar · ❌ não atende

---

## Checklist

### 1. Organização e legibilidade

| # | Item | Situação | Observação |
|:--:|---|:--:|---|
| 1.1 | Responsabilidades separadas em camadas | ✅ | `controllers/` → `services/` → `repositories/` → `database/`. Bem mais organizado que o template. |
| 1.2 | Nomes claros e em português, coerentes com o domínio | ✅ | `aceitar`, `cancelar`, `liberar`, `concluir`, `buscarOuLancar`. |
| 1.3 | Funções curtas, com uma responsabilidade | ⚠️ | `criarDoacao` (service, linhas 14–62) tem ~48 linhas e 5 regras diferentes. Ver **F3**. |
| 1.4 | Sem strings mágicas | ✅ | `src/status.js` centraliza os status. Ótima decisão. |
| 1.5 | Sem código duplicado | ⚠️ | Repositório (**F2**), `db.js` (**F4**) e testes (**F6**). |
| 1.6 | Comentários úteis e atualizados | ✅ | Explicam o *porquê* (ex.: verificação de data "arredondada" pelo JS). |

### 2. Corretude e regras de negócio

| # | Item | Situação | Observação |
|:--:|---|:--:|---|
| 2.1 | Validação de campos obrigatórios, quantidade e validade | ✅ | Inclusive `30/02` rejeitado e data interpretada no fuso **local** (`'T00:00:00'`) — tratam um bug de fuso que nós mesmos tínhamos. |
| 2.2 | Duas ONGs não aceitam a mesma doação | ✅ | `UPDATE … WHERE id = ? AND status = ?` no repositório. |
| 2.3 | Comportamento igual em SQLite e PostgreSQL | ⚠️ | Id não numérico se comporta diferente nos dois bancos. Ver **F1**. |
| 2.4 | Regras de produto bem justificadas | ⚠️ | "Tipo não pode conter números" e "quantidade só números". Ver **F7**. |

### 3. Testes

| # | Item | Situação | Observação |
|:--:|---|:--:|---|
| 3.1 | Critérios de aceite das histórias têm teste | ✅ | H1 a H6, liberar reserva e listar aceitas — 41 casos `it(...)`. |
| 3.2 | Casos de erro e de borda | ✅ | Quantidade zero, data inexistente, id não numérico, ONG em branco, cancelar duas vezes. |
| 3.3 | Testes rodam contra o banco de produção (PostgreSQL) | ❌ | Ver **F1**. |
| 3.4 | Testes sem duplicação, fáceis de manter | ⚠️ | Ver **F6**. |
| 3.5 | Teste de concorrência (duas ONGs ao mesmo tempo) | ❌ | A trava existe no SQL, mas nenhum teste prova. Ver **F5**. |

### 4. CI, documentação e processo

| # | Item | Situação | Observação |
|:--:|---|:--:|---|
| 4.1 | CI com testes + verificação de saúde | ✅ | Já sobe o serviço `postgres:16-alpine`. |
| 4.2 | README com os comandos de instalar, testar e executar | ✅ | Bem completo, com tabela de histórias e rotas. |
| 4.3 | README e ADRs coerentes com o código | ⚠️ | README diz "39 testes", mas há 41 `it(...)`. A ADR 0001 diz que os testes rodam no PostgreSQL, mas rodam em SQLite (ver **F1**). |
| 4.4 | `docs/refatoracoes.md` preenchido | ❌ | Ainda é o modelo, mas o commit `c22817d` já fez 3 refatorações. Ver **F8**. |
| 4.5 | `docs/validacao.md` preenchido | ❌ | Ainda é o modelo. |
| 4.6 | Frontend protegido contra injeção de HTML | ✅ | `escapeHtml`/`escapeAttr` em todo dado vindo da API. |

---

## Feedback detalhado (o que encontramos e por que propomos)

### F1 — Os testes nunca rodam no PostgreSQL, e há uma diferença real entre os bancos ❌ *(prioridade alta)*

**Onde:** `vitest.config.js` (linha 4), `src/database/db.js` (linha 11), `tests/doacoes.test.js` (linhas 158–164 e 232–236), `.github/workflows/ci.yml`.

**O que vimos:** o `vitest.config.js` força `DATABASE_FILE: ':memory:'`, e o `db.js` usa SQLite sempre que essa variável existe. Então, mesmo com o serviço PostgreSQL subindo no CI, **todos os testes rodam em SQLite** — o PostgreSQL só é usado no `npm start` do health check.

Isso esconde uma diferença concreta: o teste `recusa aceitar quando o id não é numérico` espera a mensagem `'Doação não encontrada'`. No SQLite, `WHERE id = 'abc'` simplesmente não acha nada. No PostgreSQL, a coluna `id` é `SERIAL` (inteiro) e `WHERE id = 'abc'` dá **erro de sintaxe** (`invalid input syntax for type integer`) — essa mensagem técnica do banco iria direto para o usuário, e o teste falharia.

Além disso, o `docs/adr/0001-sqlite-ou-postgresql.md` (linha 16) diz que "os testes usam um banco separado (`pratocheio_teste`)" e que "rodar os testes agora exige Docker". Isso não vale mais: depois dos commits `1a85602`/`3c1205b` (CI verde sem Docker), os testes voltaram para SQLite, e o banco `pratocheio_teste` criado em `docker/init.sql` não é usado por nada. **A ADR ficou desatualizada.**

**Por que propomos:** a Unidade 3 pede que os testes **provem** que o comportamento se manteve depois da troca de banco. Hoje essa prova não existe, e a documentação diz que existe.

**Sugestão:**
1. No CI, rodar os testes também com PostgreSQL, por exemplo um segundo passo `DATABASE_FILE= npm test` (ou deixar o `vitest.config.js` usar SQLite só quando `DATABASE_URL` não estiver definido);
2. Validar o id no service antes de ir ao banco (ex.: `if (!Number.isSafeInteger(Number(id))) throw new Error('Doação não encontrada')`), para que a resposta seja a mesma nos dois bancos.

---

### F2 — Quatro funções quase iguais no repositório ⚠️

**Onde:** `src/repositories/doacoesRepository.js` — `aceitar` (25–33), `cancelar` (36–44), `liberar` (73–81), `concluir` (84–92).

**Cheiro:** código duplicado. As quatro fazem `UPDATE … SET status = ? WHERE id = ? AND status = ?`, conferem `alteradas === 0` e depois fazem um `SELECT` para devolver a linha. Muda só o status de origem, o de destino e o que acontece com a ONG.

**Por que propomos:** a regra mais importante dessa camada (a trava `AND status = ?`) está escrita quatro vezes. Se uma história nova copiar e esquecer a condição, reabre a disputa entre ONGs. Além disso, cada transição faz **duas** idas ao banco.

**Sugestão** (*Extract Function* + *Parameterize Function*): uma função `transicionar(id, { de, para, ong })` com `RETURNING *`, que funciona em SQLite e PostgreSQL e devolve a linha em uma só consulta:

```js
async function transicionar(id, { de, para, ong }) {
  const { rows } = await query(
    `UPDATE doacoes SET status = ?, ong = ? WHERE id = ? AND status = ? RETURNING *`,
    [para, ong, id, de]
  );
  return rows[0];
}
export const aceitar  = (id, ong) => transicionar(id, { de: STATUS.DISPONIVEL, para: STATUS.ACEITA,     ong });
export const liberar  = (id)      => transicionar(id, { de: STATUS.ACEITA,     para: STATUS.DISPONIVEL, ong: null });
// cancelar/concluir mantêm a ONG atual: usar `ong = COALESCE(?, ong)` no SQL.
```

O `listarDisponiveisPorTipo` (48–61) também repete a consulta inteira só para acrescentar o filtro; dá para montar o `WHERE` uma vez e adicionar `AND LOWER(tipo) = LOWER(?)` só quando houver tipo.

---

### F3 — `criarDoacao` ainda é um método longo ⚠️

**Onde:** `src/services/doacoesService.js`, linhas 14–62.

**Cheiro:** método longo + expressão repetida. A função faz 5 validações diferentes, e `quantidade.toString().trim()` e `validade.trim()` aparecem **3 vezes cada**.

**Por que propomos:** para mudar uma regra (ex.: a de quantidade, ver F7) é preciso ler a função inteira; e se alguém esquecer o `.trim()` em um dos lugares, a validação e o valor gravado ficam diferentes.

**Sugestão** (*Extract Variable* + *Extract Method*): normalizar uma vez no começo e separar cada regra em uma função com nome:

```js
export async function criarDoacao(dados = {}) {
  const doacao = normalizar(dados);        // trim/toString uma única vez
  exigirCamposObrigatorios(doacao);
  exigirTipoSemNumeros(doacao.tipo);
  exigirQuantidadePositiva(doacao.quantidade);
  exigirValidadeDeHojeEmDiante(doacao.validade);
  return repo.inserir(doacao);
}
```

---

### F4 — `db.js` repete `if (usarSQLite)` em todas as funções ⚠️

**Onde:** `src/database/db.js` — `query` (42), `migrar` (58), `limparBanco` (87), `encerrar` (95).

**Cheiro:** condicional repetida (parente do "comando switch" da aula) e o schema escrito **duas vezes** (linhas 59–69 e 73–83).

**Por que propomos:** cada função nova do banco vai precisar do mesmo `if`, e uma alteração no schema precisa ser feita em dois lugares — fácil de esquecer um (é a *alteração divergente* da aula).

**Sugestão** (*Replace Conditional with Polymorphism*): dois objetos com a mesma interface, `sqlite` e `postgres`, cada um com `query/migrar/limpar/encerrar`, e uma escolha só: `const banco = usarSQLite ? sqlite : postgres;`. As funções exportadas passam a só delegar. Se der, manter um schema só (as diferenças são `SERIAL`/`AUTOINCREMENT` e `TIMESTAMPTZ`/`TEXT`).

---

### F5 — Falta o teste de concorrência ❌

**Onde:** `tests/doacoes.test.js` (não existe).

**O que vimos:** a regra "uma doação aceita não fica disponível para outra ONG" é protegida pela condição no `UPDATE`, e isso está bem feito. Mas o único teste é sequencial (uma ONG aceita, **depois** a outra tenta). Não há teste com as duas requisições **ao mesmo tempo**.

**Por que propomos:** é exatamente esse cenário que justifica a trava no SQL. Sem teste, uma refatoração futura (por exemplo, trocar para "busca, confere o status em JS e depois atualiza") passaria em todos os testes e reabriria o problema.

**Sugestão:**

```js
it('só uma de duas ONGs simultâneas consegue aceitar', async () => {
  const id = await publicarDoacao();
  const [a, b] = await Promise.all([
    request(app).post(`/api/doacoes/${id}/aceitar`).send({ ong: 'ONG A' }),
    request(app).post(`/api/doacoes/${id}/aceitar`).send({ ong: 'ONG B' }),
  ]);
  expect([a.status, b.status].sort()).toEqual([200, 400]);
});
```

Vale também um para aceitar × cancelar ao mesmo tempo.

---

### F6 — Duplicação nos testes ⚠️

**Onde:** `tests/doacoes.test.js`.

**O que vimos:** um arquivo de ~500 linhas; o mesmo `beforeEach(migrar + limparBanco)` / `afterAll(encerrar)` repetido em **9** `describe`; a função de publicar doação reescrita 5 vezes com nomes diferentes (`publicarDoacao` ×2, `publicar`, `publicarEAceitar` ×2).

**Por que propomos:** é fácil uma cópia ficar diferente da outra (validade, quantidade) sem ninguém perceber, e o arquivo fica difícil de navegar.

**Sugestão:** criar `tests/helpers.js` com `hojeMais`, `publicar(tipo)` e `publicarEAceitar(tipo, ong)`; colocar o `beforeEach`/`afterAll` uma vez só no topo do arquivo; separar por história (`publicar.test.js`, `aceitar.test.js`, `cancelar.test.js`…).

---

### F7 — Duas regras de produto merecem ser revistas ⚠️ *(discussão, não é erro de código)*

**Onde:** `src/services/doacoesService.js`, linhas 23–35.

- **"Tipo não pode conter números":** rejeita doações reais como `Leite 2L`, `Pão 7 grãos` ou `Ômega 3`.
- **"Quantidade só com números":** `10 kg` e `10 porções` são recusados, então se perde a unidade — a ONG não sabe se `10` são quilos, porções ou caixas.

**Por que propomos:** essas regras afetam diretamente o doador e não encontramos o motivo delas nos critérios de aceite. Se forem decisões do grupo, vale registrar o porquê (em `docs/projeto.md` ou num ADR). Uma alternativa é ter um campo `unidade` separado (kg, L, porções, unidades).

---

### F8 — Documentação do Trabalho 3 ainda vazia ❌ *(prioridade alta para a entrega)*

**Onde:** `docs/refatoracoes.md` e `docs/validacao.md`.

**O que vimos:** os dois ainda são o modelo da disciplina. Porém o commit `c22817d` já fez três refatorações boas: constantes de `STATUS`, `asyncHandler` no controller e `buscarOuLancar` no service.

**Por que propomos:** a atividade pede o registro do **cheiro atacado, o que mudou e a evidência dos testes**. O trabalho já foi feito; só falta registrar. Sugestão para cada uma:
- `STATUS` → cheiro: *strings mágicas*; técnica: *Replace Magic Literal with Symbolic Constant*;
- `asyncHandler` → cheiro: *código duplicado* (try/catch em toda rota); técnica: *Extract Function*;
- `buscarOuLancar` → cheiro: *código duplicado* (busca + `if (!doacao)` em 4 métodos); técnica: *Extract Function*;
- e em cada uma: "testes antes: N passando / depois: N passando" + link do CI verde.

Aproveitar e corrigir o README (39 → 41 testes) e atualizar a ADR 0001 (ver F1), ou registrar uma ADR nova explicando a volta dos testes para SQLite.

---

## Pontos fortes (para manter)

- Separação em camadas bem feita e consistente.
- Refatorações já aplicadas (`STATUS`, `asyncHandler`, `buscarOuLancar`) estão corretas e bem comentadas.
- Validação de data mais completa que a nossa: rejeita `30/02` e evita o erro de fuso horário montando a data como horário local.
- Uso de `.trim()` em tudo que vem do usuário: evita doação com tipo `"   "`.
- Frontend escapa todo o HTML que vem da API.
- PostgreSQL já integrado ao CI e ao `docker-compose.yml`, antes do prazo da Unidade 3.

## Resumo das prioridades

| Prioridade | Item | Esforço |
|:--:|---|:--:|
| 1 | **F8** — preencher `refatoracoes.md` e `validacao.md` | baixo |
| 2 | **F1** — rodar os testes no PostgreSQL e validar o id | médio |
| 3 | **F5** — teste de concorrência | baixo |
| 4 | **F2** — unificar as transições do repositório | baixo |
| 5 | **F3**, **F4**, **F6** — método longo, `db.js`, testes | médio |
| — | **F7** — discutir as regras de tipo e quantidade com o grupo | — |

Ficamos à disposição para conversar sobre qualquer item.
