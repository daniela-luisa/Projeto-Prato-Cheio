# História Retirar Doação — ONG confirma a retirada de uma doação aceita
 
## Escolha de escopo
 
Hoje o ciclo da doação termina no aceite: a doação sai da lista de disponíveis e **nada registra que o alimento foi de fato retirado**. A história de cancelamento já lista a retirada como fora de sua implementação, e nenhuma história existente cobre o passo seguinte ao aceite.
 
Esta história fecha esse ciclo. A escolha é uma **suposição de trabalho, a ser confirmada na revisão do grupo**, e deve ser conferida contra `docs/historias/analise.md` para evitar sobreposição com outra história.
 
## A história
 
> **Como** ONG, **quero** registrar que retirei a doação que aceitei,
> **para** encerrar o ciclo e deixar claro que o alimento chegou ao destino.
 
## Critérios de aceite
 
| ID | Dado | Quando | Então |
| --- | --- | --- | --- |
| CA01 | Uma doação aceita por uma ONG | A ONG confirma a retirada | O status muda de `aceita` para `retirada`; a API responde 200; a tela confirma a operação e a doação deixa a lista de aguardando retirada. |
| CA02 | Uma doação disponível, que nenhuma ONG aceitou | Há tentativa de confirmar a retirada | A API responde 400 e o status permanece `disponivel`. |
| CA03 | Uma doação cancelada | Há tentativa de confirmar a retirada | A API responde 400 e a doação continua cancelada. |
| CA04 | Um identificador inexistente ou inválido | Há tentativa de confirmar a retirada | A API responde 400 com mensagem de erro e não modifica outra doação. |
| CA05 | Uma doação já retirada | Há nova confirmação de retirada | A API responde 400 e a doação continua retirada, com os dados intactos. |
| CA06 | Uma doação aceita | Duas confirmações são solicitadas simultaneamente | Apenas uma tem sucesso; a outra é recusada, e o registro termina como `retirada`. |
| CA07 | Uma doação retirada | O registro é consultado no banco | O registro e seus dados continuam presentes, incluindo a ONG que aceitou; somente o status foi alterado. Outras doações permanecem inalteradas. |
| CA08 | Uma doação retirada | Há tentativa de cancelamento ou de novo aceite | A API responde 400 e a doação continua retirada. |
| CA09 | A tela pede confirmação da retirada | O usuário desiste na confirmação | Nenhuma requisição é enviada e a doação permanece aguardando retirada. |
| CA10 | A tela ainda mostra uma doação que já foi confirmada em outra aba | A ONG tenta confirmar | A mensagem de erro da API aparece na tela, sem informar sucesso. |
 
## Implementação
 
| Camada | Onde | O que |
| --- | --- | --- |
| API | `POST /api/doacoes/:id/retirar` | Sem corpo obrigatório |
| API (leitura) | listagem de doações aceitas | Rota nova ou filtro por status na listagem existente (ver pendências) |
| Regra | `src/doacoes.js` | `retirar(id)` |
| Persistência | `src/repositorio.js` | `retirar(id)` |
| Interface | `public/index.html` | Seção "Aguardando retirada", botão "Confirmar retirada", confirmação e mensagens de sucesso e erro |
| Diagrama | `docs/estados.md` | Nova transição `aceita → retirada` |
| Testes | `tests/retirada.test.js` | Integração com API real e SQLite em memória |
 
**Como a concorrência é resolvida.** Seguindo o padrão do cancelamento, a alteração ocorre em um único `UPDATE` parametrizado com a condição `WHERE id = ? AND status = 'aceita'`. Se a escrita não alterar nenhuma linha, uma consulta posterior apenas identifica a mensagem de recusa adequada. Não há consulta prévia usada para autorizar a alteração.
 
**Padrão HTTP.** Mantém-se o padrão 200/400 das operações de negócio já existentes.
 
**Por que ainda precisa de uma tela nova.** Depois do aceite a doação sai da lista de disponíveis, então hoje a ONG não tem onde vê-la. Sem uma lista de doações aceitas, não há onde clicar em "Confirmar retirada".
 
## Como verificar
 
Requisito: Node.js 22.13 ou superior, conforme o README do projeto.
 
```
npm ci
npm test
npm start
```
 
Depois, em http://localhost:3000:
 
1. Publicar uma doação com validade futura e aceitá-la. Ela deve sair de "Disponíveis" e aparecer em "Aguardando retirada".
2. Clicar em "Confirmar retirada" e desistir: a doação deve continuar em "Aguardando retirada". *(CA09)*
3. Repetir e confirmar: a tela deve mostrar uma mensagem de sucesso e remover a doação da seção. *(CA01)*
4. Publicar e aceitar outra doação, abrir a página em uma segunda aba e confirmar a retirada lá.
5. Na primeira aba, que ainda mostra a doação, tentar confirmar: deve aparecer a mensagem de erro da API. *(CA10)*
**O que cada verificação cobre**
- CA01 a CA08: testes de integração em `tests/retirada.test.js`.
- A confirmação e a atualização da tela em CA01, mais CA09 e CA10: passos manuais acima.
- Os testes anteriores (publicação, listagem, aceite, cancelamento) devem continuar passando.
## Compatibilidade com as decisões do repositório
 
- **Decisão 1** continua válida: aceite e cancelamento só alteram a doação que ainda está disponível. A retirada é a única transição que parte de `aceita`.
- **ADR 0001**: esta entrega da Unidade 2 usa SQLite, como definido no README. Nenhuma migração de banco é necessária.
- **Decisão 2 e RNF01**: a história **não** registra data e hora da retirada nem implementa a tabela imutável de eventos. Só o status muda.
## Limites e revisão
 
**Sem identidade da ONG.** O protótipo não tem autenticação. A API valida o estado da doação, mas não consegue comprovar que quem confirma a retirada é a ONG que a aceitou. O controle de acesso exige identidade e autorização em uma história própria antes de uso com usuários reais.
 
**Sem desistência pós-aceite.** Se a ONG aceitar e não retirar, a doação fica em `aceita` indefinidamente. A liberação após X horas e a desistência da ONG continuam fora desta implementação.
 
**Fora desta implementação:** expiração, liberação após X horas, limite por ONG, notificação ao doador e histórico de eventos.
 
**Uso de IA.** Esta especificação foi preparada com apoio de IA e não foi conferida contra o código nem contra `docs/analise.md`.
 
### Pendências antes de implementar
 
- [ ] Confirmar o nome real do status de doação aceita no schema (`src/db.js`); aqui assumido como `aceita`
- [ ] Verificar em `src/app.js` se a listagem existente aceita filtro por status ou se é preciso criar uma rota para doações aceitas
- [ ] Conferir se `docs/analise.md` já tem história para a retirada
- [ ] Confirmação do escopo pelo grupo
### Pendências antes do merge
 
- [ ] Revisão de outro integrante (integração e interface)
- [ ] CI verde