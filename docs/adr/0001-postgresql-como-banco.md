# ADR 0001 — PostgreSQL como banco a partir da Unidade 3

- **Data:** 2026-10-15
- **Status:** aceito

> Versão original, incompleta: "Decidimos utilizar PostgreSQL porque é um banco melhor."
> Problema: "melhor" não diz em quê, não compara com nada e não mostra o que se perde.

## Contexto

O walking skeleton usa SQLite embutido no Node (`node:sqlite`), gravando no arquivo `dados.sqlite` da máquina onde o servidor roda. Isso funcionou na Unidade 1, com uma pessoa testando por vez. Para o produto ser usado de verdade, pesam:

- Doadores, ONGs e a Marta acessam ao mesmo tempo, de aparelhos diferentes. O banco precisa estar num servidor acessível pela internet, não num arquivo local.
- A regra "doação aceita não fica disponível para outra ONG" depende de duas ONGs não conseguirem aceitar a mesma doação ao mesmo tempo.
- O Risco 1 (vigilância sanitária) exige um histórico que não pode se perder.
- Restrição da disciplina: banco relacional, acessível por `DATABASE_URL`, migrado na Unidade 3 com CI verde.

## Alternativas consideradas

1. **Manter SQLite**
   - Prós: já funciona, nada a instalar, testes rápidos em memória, custo zero.
   - Contras: é um arquivo, acessível só pela máquina onde está; bloqueia o banco inteiro a cada escrita (um escritor por vez); não funciona bem com mais de uma instância do servidor; não atende à restrição da disciplina.
2. **PostgreSQL**
   - Prós: servidor acessível pela rede via `DATABASE_URL`; várias conexões escrevendo ao mesmo tempo, com trava por linha no `UPDATE` (o `aceitar` continua seguro); backup padronizado; oferecido por vários serviços gerenciados.
   - Contras: precisa de um servidor rodando; o SQL muda (`?` vira `$1`, `datetime('now')` vira `now()`, `AUTOINCREMENT` vira `GENERATED ALWAYS AS IDENTITY`); o CI precisa subir um PostgreSQL para os testes.
3. **MySQL**
   - Prós: também é servidor, multiusuário e muito usado.
   - Contras: resolve os mesmos problemas que o PostgreSQL, mas o template, o README e o CI da disciplina já preveem PostgreSQL. Trocar daria trabalho extra sem ganho para o caso.

## Decisão

PostgreSQL. Manter SQLite deixaria o banco preso a uma máquina. Entre as duas opções que resolvem o acesso simultâneo pela rede, o PostgreSQL é a prevista pela disciplina, e o código já está preparado: o `src/db.js` expõe `query()` devolvendo `{ rows }`, então a troca fica contida nesse arquivo.

## Consequências

- **Positivas:** o produto pode ser usado por todos ao mesmo tempo; a trava do `aceitar` continua garantida pelo banco; fica viável a tabela de eventos da Decisão 2 do `projeto.md`.
- **Negativas / o que abrimos mão:** testes em memória sem nada a instalar; precisamos de um servidor PostgreSQL (ver ADR 0002); reescrever o schema e o `query()` do `db.js`.
- **Riscos e o que fazer se der errado:** uma diferença de SQL mudar algum comportamento. Mitigação: os 10 testes atuais precisam passar antes e depois da troca, com o resultado registrado em `docs/refatoracoes.md`.

## Rastreabilidade

Regra de negócio "doação aceita não fica disponível para outra ONG", História 3, Risco 1 e restrição da disciplina no README.
