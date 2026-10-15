# ADR 0003 — Hospedagem do banco para várias cidades

- **Data:** 2026-10-15
- **Status:** aceito. Substitui o ADR 0002.

## Contexto

O Prato Cheio deixa de atender um único bairro e passa a ser usado por ONGs e doadores de várias cidades, com acessos simultâneos e mais doações. Reavaliamos o ADR 0001 e o ADR 0002.

**ADR 0001 (PostgreSQL): mantido.** A mudança reforça essa decisão: mais acessos simultâneos é exatamente o que o SQLite não suporta, e a trava por linha do PostgreSQL mantém o `aceitar` seguro mesmo com muitas ONGs disputando doações.

**ADR 0002 (plano gratuito): deixa de servir, porque:**

- os limites de armazenamento e de conexões do plano gratuito não comportam várias cidades;
- a pausa por ociosidade atrasa respostas, e o principal inimigo do caso é o tempo até a coleta (Decisão 1 do `projeto.md`);
- o plano gratuito não garante backup nem disponibilidade, e com mais doações perder o histórico fica mais grave (Risco 1).

## Alternativas consideradas

1. **Plano pago do mesmo tipo de serviço gerenciado**
   - Prós: não exige trocar de fornecedor; backup automático; sem pausa por ociosidade; suporta mais conexões simultâneas.
   - Contras: custo mensal recorrente; continua dependendo do fornecedor.
2. **Servidor próprio (VPS) com PostgreSQL administrado por nós**
   - Prós: controle total; o custo pode ser menor.
   - Contras: alguém precisa cuidar de atualizações, segurança, backup e monitoramento, e não temos essa pessoa; um erro de administração pode perder dados.

## Decisão

Substituir o ADR 0002 pela alternativa 1. A equipe não tem quem administre um banco, e o risco de perder o histórico num servidor mal mantido custa mais do que a mensalidade.

## Consequências

- **Positivas:** respostas sem pausa; backup automático; suporte a acessos simultâneos de várias cidades.
- **Negativas / o que abrimos mão:** custo zero. Isso torna o Risco 2 bloqueante: a expansão para outras cidades só pode acontecer quando houver um patrocinador que pague o plano.
- **Mudanças no código:** o `db.js` passa a usar um pool de conexões; criar índices nas colunas mais consultadas (`status`, `criada_em`).
- **Fora deste ADR:** a escala traz outras necessidades, por exemplo a ONG ver só doações da sua cidade, o que exige um campo de cidade e uma nova história.

## Rastreabilidade

Risco 1, Risco 2, Decisão 1 do `projeto.md` (tempo até a coleta) e ADR 0001.
