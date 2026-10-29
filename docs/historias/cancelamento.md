# História nova — Doador cancela uma doação antes do aceite

## Escolha de escopo

Esta história foi preparada para a contribuição de Heitor na segunda entrega.
A divisão de tarefas recebida pede a implementação da “2ª história nova”, mas
o repositório não identifica qual funcionalidade corresponde a essa atribuição.
**A escolha do cancelamento é uma suposição de trabalho, a ser confirmada na
revisão do grupo**, fundamentada na regra de negócio 2 de
[`docs/analise.md`](../analise.md). Ela não é a História 2 daquele documento:
a listagem de doações já está implementada.

> Como doador, quero cancelar uma doação enquanto nenhuma ONG a tiver aceitado,
> para retirar uma oferta que não posso mais disponibilizar.

## Critérios de aceite

| ID | Dado | Quando | Então |
|---|---|---|---|
| CA01 | Uma doação disponível | O doador confirma o cancelamento | O status muda de `disponivel` para `cancelada`; a API responde 200; a tela confirma a operação e a doação deixa a lista de disponíveis. |
| CA02 | Uma doação que uma ONG já aceitou | Há tentativa de cancelamento | A API responde 400 e orienta contato com a coordenação; status, ONG e demais dados permanecem intactos. |
| CA03 | Um identificador inexistente ou inválido | Há tentativa de cancelamento | A API responde 400 com mensagem de erro e não modifica outra doação. |
| CA04 | Uma doação já cancelada | Há novo cancelamento ou tentativa de aceite | A API responde 400 e a doação continua cancelada. |
| CA05 | Uma doação disponível | Aceite e cancelamento são solicitados simultaneamente | Apenas uma operação tem sucesso; a outra é recusada, e o registro corresponde à operação que venceu. |
| CA06 | Uma doação cancelada | O registro é consultado no banco | O registro e seus dados continuam presentes; somente o status foi alterado. Outras doações permanecem inalteradas. |
| CA07 | A tela pede confirmação do cancelamento | O usuário desiste na confirmação | Nenhuma requisição de cancelamento é enviada e a doação permanece disponível. |
| CA08 | A tela ainda mostra uma oferta que outra ONG acabou de aceitar | O doador tenta cancelar | A mensagem de erro da API aparece na tela, sem informar sucesso. |

## Implementação

- **API:** `POST /api/doacoes/:id/cancelar`, sem corpo obrigatório.
- **Regra:** `cancelar(id)` em [`src/doacoes.js`](../../src/doacoes.js).
- **Persistência:** `cancelar(id)` em [`src/repositorio.js`](../../src/repositorio.js).
- **Interface:** botão “Cancelar doação”, confirmação e mensagens de sucesso/erro
  em [`public/index.html`](../../public/index.html).
- **Diagrama:** [`docs/estados.md`](../estados.md).

A alteração ocorre em um único `UPDATE` parametrizado com a condição
`WHERE id = ? AND status = 'disponivel'`. A disputa com o aceite é resolvida
nessa escrita: não há uma consulta prévia usada para autorizar a alteração.
Se a escrita não alterar uma linha, uma consulta posterior apenas identifica
a mensagem de recusa adequada. Mantém-se o padrão HTTP 200/400 das operações
de negócio já existentes no projeto.

A mensagem de erro do aceite foi ajustada para contemplar qualquer doação
indisponível, incluindo uma cancelada. A interface agora verifica a resposta
HTTP antes de exibir sucesso nas ações de publicar, aceitar e cancelar.

## Como verificar

Requisito: Node.js 22.13 ou superior, conforme o README.

```bash
npm ci
npm test
npm start
```

1. Abrir `http://localhost:3000` e publicar uma doação com validade futura.
2. Clicar em “Cancelar doação” e desistir: a oferta deve continuar na lista.
3. Repetir e confirmar: a tela deve mostrar “Doação cancelada.” e remover a oferta.
4. Publicar outra oferta. Abrir a mesma página em uma segunda aba e aceitar a oferta.
5. Na primeira aba, que ainda mostra a oferta, tentar cancelar e confirmar:
   deve aparecer a orientação para procurar a coordenação.
6. Tentar publicar sem preencher os campos: deve aparecer a mensagem de erro.

Os comportamentos de API e persistência de CA01–CA06 são cobertos por oito testes de integração em
[`tests/cancelamento.test.js`](../../tests/cancelamento.test.js), usando API real
e SQLite em memória. A confirmação e a atualização da tela em CA01, assim como
CA07–CA08, são verificadas pelos passos na interface acima.
Os testes anteriores continuam exercitando publicação, listagem e aceite.

**Verificação:** executar `npm test` e conferir os fluxos da interface pelos passos acima. A integração e a interface devem ser revisadas no PR antes do merge.

## Compatibilidade com as decisões do repositório

- A [Decisão 1](../projeto.md) permanece válida: aceite e cancelamento só
  alteram a doação que ainda está disponível.
- O [ADR 0001](../adr/0001-postgresql-como-banco.md) prevê PostgreSQL na Unidade 3.
  Esta entrega da Unidade 2 usa SQLite, como definido no README. Nenhuma
  migração de banco ou contratação de hospedagem é necessária para esta história.
- O [ADR 0003](../adr/0003-hospedagem-para-varias-cidades.md) substitui o ADR 0002;
  as decisões de hospedagem não alteram a regra de cancelamento.
- Preservar a linha de `doacoes` evita apagar o registro, mas **não implementa
  a tabela imutável de eventos** prevista na Decisão 2 e no RNF01.

## Limites e revisão

O protótipo atual não possui autenticação nem identidade persistida do doador.
Esta história valida o estado da doação, mas **não comprova quem é seu dono**.
O controle de acesso por doador precisa de identidade/autorização em uma
história própria antes de uso com usuários reais.

Cancelamento após aceite continua exigindo contato com a coordenação, sem uma
rota para forçar esse cancelamento. Retirada, limite por ONG, expiração, liberação
após X horas e histórico de eventos continuam fora desta implementação.

A implementação e os testes receberam apoio de IA na preparação. A revisão de outro integrante, o CI e a confirmação do escopo desta história continuam pendentes.