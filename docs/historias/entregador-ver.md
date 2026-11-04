## Histórias entregues

### História 1: Entregador vê as remessas aceitas por ONGs

> Como **entregador**, quero ver as remessas já aceitas por ONGs, para saber o que precisa ser entregue.

**Por que esta história agora:** é a primeira fatia do fluxo do entregador. Ela fecha o ciclo da história zero (doador publica → ONG aceita) mostrando o que fica aguardando entrega, e não exige novas tabelas nem mudança no schema. As próximas fatias (assumir a remessa, concluir a entrega, prazo de entrega) dependem dela.

#### Critérios de aceite

| # | Critério | Coberto por |
|---|----------|-------------|
| 1 | Lista apenas doações com status `aceita` | `tests/entregas.test.js` |
| 2 | Não lista doações `disponivel` nem `cancelada` | `tests/entregas.test.js` |
| 3 | Cada item traz ONG, tipo, quantidade e validade | `tests/entregas.test.js` |
| 4 | Ordena pela validade mais próxima primeiro | `tests/entregas.test.js` |
| 5 | Sem remessas aceitas, devolve lista vazia | `tests/entregas.test.js` |

A ordenação por validade é intencional: o alimento que vence primeiro tem prioridade de entrega.

#### Como usar

**API**

```
GET /api/entregas/disponiveis
```

Resposta `200`, lista de doações aceitas, da validade mais próxima para a mais distante:

```json
[
  {
    "id": 3,
    "tipo": "Leite",
    "quantidade": "12L",
    "validade": "2026-11-05",
    "status": "aceita",
    "ong": "ONG Esperança",
    "criada_em": "2026-11-04 14:30:00"
  }
]
```

Sem remessas aceitas, a resposta é `[]`.

**Interface**

Com `npm start`, abra http://localhost:3000 e use a seção **Entregador**.

#### Como verificar

```
npm test                    # inclui tests/entregas.test.js
npm run dev                 # teste manual, abaixo
```

Roteiro manual:
1. Publique uma doação com validade futura.
2. Aceite a doação como ONG.
3. Abra a seção **Entregador** e confira que a doação aparece com o nome da ONG.
4. Publique outra doação e não a aceite: ela não deve aparecer na lista.

#### Onde está o código

| Camada | Arquivo | Função |
|--------|---------|--------|
| Rota | `src/app.js` | `GET /api/entregas/disponiveis` |
| Regra de negócio | `src/doacoes.js` | `listarAceitas()` |
| SQL | `src/repositorio.js` | `listarAceitas()` |
| Interface | `public/index.html` | seção Entregador |
| Testes | `tests/entregas.test.js` | um teste por critério |

#### Fora do escopo desta história

Ficam para as próximas fatias do fluxo do entregador:
- assumir uma remessa (e impedir que dois entregadores assumam a mesma)
- concluir a entrega
- prazo de entrega e expiração
- filtro por proximidade (cidade, bairro ou distância)