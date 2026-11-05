## Definição de Pronto (DoD)

Uma história só é considerada pronta quando todos os itens abaixo são verdadeiros.

**Requisitos**
- [ ] A história está escrita em uma issue, com critérios de aceite numerados
- [ ] Cada critério de aceite é coberto por pelo menos um teste automatizado

**Qualidade**
- [ ] `npm test` passa localmente antes de abrir o PR
- [ ] O CI está verde no PR
- [ ] A funcionalidade foi exercitada manualmente com `npm start`
- [ ] Nenhum segredo ou credencial no código; variáveis novas constam no `.env.example`

**Processo**
- [ ] O trabalho foi feito em branch própria, nunca direto na `main`
- [ ] O PR foi revisado e aprovado por um integrante que não é o autor
- [ ] O PR está vinculado à issue (`Closes #n`)
- [ ] Se houve IA, o PR registra o que foi mantido, o que mudou e por quê
- [ ] O README e os docs foram atualizados quando comandos ou comportamento mudaram
- [ ] Merge na `main` por squash, só depois de todos os itens acima