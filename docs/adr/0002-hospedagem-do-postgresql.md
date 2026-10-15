# ADR 0002 — Onde o PostgreSQL vai rodar

- **Data:** 2026-10-15
- **Status:** substituído pelo ADR 0003

## Contexto

O ADR 0001 decidiu usar PostgreSQL. Falta decidir onde ele roda. O cenário é um piloto em um único bairro, com poucos usuários, sem patrocinador definido (Risco 2) e, portanto, sem orçamento. O banco precisa ser acessível pelas ONGs e pela Marta, e o CI precisa continuar verde.

## Alternativas consideradas

1. **Instalar o PostgreSQL na máquina de cada integrante**
   - Prós: não depende de serviço externo.
   - Contras: cada um configura de um jeito (versões diferentes, "na minha máquina funciona"); o banco fica local, então ONGs e Marta não conseguem acessar.
2. **PostgreSQL em contêiner Docker**
   - Prós: mesmo ambiente para todos, sobe com um comando, e o mesmo contêiner serve no CI.
   - Contras: Docker no Windows exige WSL e pesa na máquina; continua local, então alguém teria que manter um computador ligado e exposto na internet.
3. **Serviço gerenciado com plano gratuito (ex.: Neon ou Supabase)**
   - Prós: acessível de qualquer lugar por `DATABASE_URL`; ninguém precisa administrar servidor; custo zero.
   - Contras: limites de armazenamento e de conexões; o banco pode pausar quando fica sem uso, e a primeira requisição depois disso demora; dependemos de um fornecedor externo, que pode mudar as regras do plano.

## Decisão

Alternativa 3 para o banco do produto e, para os testes do CI, um PostgreSQL em contêiner (service container do GitHub Actions). No piloto, o volume cabe no plano gratuito, e o custo zero é decisivo porque não há patrocinador. Os testes ficam independentes da internet e do fornecedor.

## Consequências

- **Positivas:** custo zero; ninguém instala banco na própria máquina; o produto fica acessível para ONGs e Marta.
- **Negativas / o que abrimos mão:** controle sobre onde os dados ficam; desempenho estável (pausa por ociosidade); folga para crescer, por causa dos limites do plano.
- **Riscos e o que fazer se der errado:** o fornecedor mudar ou encerrar o plano. Mitigação: usar PostgreSQL padrão, sem recurso exclusivo do fornecedor; o `migrar()` recria o schema e um backup periódico com `pg_dump` permite trocar de fornecedor.

## Rastreabilidade

Risco 2 (falta de patrocinador), ADR 0001 e restrição da disciplina (`DATABASE_URL` e CI verde).
