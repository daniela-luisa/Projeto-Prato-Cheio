# Prato Cheio — Análise (Trabalho 1)

**Grupo:** 202ErrorClub
**Integrantes:** Adrian Marcio Roth, Daniela Luisa da Conceição, Gustavo Franz, Heitor Lopes Reis, João Henrique Souza Rocha

---

## 1. Critérios de aceite (Dado/Quando/Então)

### História 1 — Doador publica doação

> Como doador de restaurante, quero publicar uma doação com quantidade e validade, para que uma ONG possa saber o que está disponível e recolher antes de estragar.

**Cenário: Tentativa de publicar doação vencida**
- Dado que o doador está cadastrando uma doação
- Quando a validade informada já passou da data atual
- Então o sistema rejeita a publicação e exibe uma mensagem de erro

**Cenário: Campos obrigatórios não preenchidos**
- Dado que o doador está cadastrando uma doação
- Quando ele tenta publicar sem informar quantidade ou validade
- Então o sistema impede a publicação até que os campos estejam completos

### História 2 — ONG visualiza doações disponíveis

> Como ONG, quero visualizar as doações disponíveis, para que possa escolher alimentos que consiga recolher.

**Cenário: Doação já aceita não aparece**
- Dado que uma doação já foi aceita por outra ONG
- Quando qualquer ONG consulta a lista de doações
- Então essa doação não aparece mais como disponível

**Cenário: Nenhuma doação disponível**
- Dado que não há doações com status "disponível" no momento
- Quando a ONG acessa a lista
- Então o sistema exibe uma mensagem informando que não há doações no momento

### História 3 — ONG aceita doação

**Cenário: Aceite de doação disponível**
- Dado que uma doação está com status "disponível"
- Quando uma ONG aceita essa doação
- Então o status muda para "aceita" e ela deixa de aparecer para as demais ONGs

**Cenário: Aceite de doação já aceita**
- Dado que uma doação já está com status "aceita"
- Quando outra ONG tenta aceitá-la
- Então o sistema bloqueia a ação e informa que a doação não está mais disponível

---

## 2. Hipótese testável

**Suposição implícita no caso:** assume-se que o doador vai preencher corretamente quantidade e validade só porque o campo é obrigatório — sem checar se a informação é confiável. O sistema exige o dado, mas não valida se ele é verdadeiro.

**Hipótese:** Acreditamos que os doadores irão informar quantidade e validade de forma consistente e confiável apenas com campos obrigatórios no formulário, sem validação adicional (ex.: foto do produto, dupla checagem).

**Critério de sucesso:** saberemos que estamos certos quando a taxa de doações com informação divergente da realidade (ex.: ONG relata que a quantidade recebida foi muito diferente da anunciada) for baixa — abaixo de 10%.

**Experimento — piloto controlado (2 semanas):**
1. Selecionar 5–10 doadores parceiros para publicar doações reais no walking skeleton.
2. Pedir à ONG que recebe para registrar, a cada retirada, se quantidade e tipo bateram com o anunciado.
3. Comparar dado publicado × dado real na retirada.

**Leitura do resultado:** divergência baixa → suposição se sustenta (campo obrigatório é suficiente). Divergência alta → suposição cai, e faz sentido considerar validação extra (foto obrigatória, reputação do doador ao longo do tempo) como uma nova história.

---

## 3. Riscos e mitigação

### Risco 1 — Vigilância sanitária pode interditar a operação
- **Descrição:** o sistema não registra rastreabilidade suficiente (origem, horário de preparo, condições de armazenamento) para provar segurança alimentar em caso de fiscalização ou incidente (ex.: alguém passar mal após consumir uma doação).
- **Probabilidade:** média — não é o cenário mais comum, mas basta um incidente para virar crítico.
- **Impacto:** alto — pode barrar o projeto e até interditar as ONGs.
- **Mitigação:** adicionar campo obrigatório de horário de preparo/embalagem no cadastro da doação (além de tipo, quantidade, validade) e manter esse histórico auditável no banco, sem apagar registros de doações antigas mesmo após entregues, para servir de prova em fiscalização.

### Risco 2 — Falta de patrocinador definido compromete continuidade
- **Descrição:** não está definido no caso quem será responsável por manter o serviço funcionando a longo prazo. Sem patrocinador claro, o projeto pode não ter recursos para sair do walking skeleton acadêmico e virar algo sustentável (hospedagem, manutenção, suporte).
- **Probabilidade:** alta — é uma lacuna que já existe hoje, não uma hipótese futura.
- **Impacto:** médio-alto — não trava o walking skeleton acadêmico, mas trava a sustentação do projeto.
- **Mitigação:** registrar a decisão em aberto neste documento, propondo ao menos um candidato plausível a patrocinador (ver mapa de stakeholders, quadrante "Patrocinador"), para que o risco fique documentado e defensável em vez de ignorado.

---

## 4. Referência — Mapa de stakeholders (Aula 02)

| Stakeholder | Poder | Interesse | Quadrante |
|---|---|---|---|
| Vigilância sanitária | Alto | Baixo | Manter satisfeito |
| Doações institucionais / patrocinador | Alto | Alto | Gerenciar de perto e envolver |
| Marta (coordenadora) | Alto | Alto | Gerenciar de perto e envolver |
| Doadores | Baixo | Alto | Manter informado |
| ONGs | Baixo | Alto | Manter informado |
| Voluntários entregadores | Baixo | Alto | Manter informado |
| Equipe de desenvolvimento | Baixo | Baixo | Monitorar |

### Conflitos de prioridade

| Quem | Quer | Colide com | Critério do conflito |
|---|---|---|---|
| Doador | Cadastrar em 10 segundos | Rastreabilidade da vigilância sanitária | Priorizar como obrigatórias apenas as informações necessárias para segurança/rastreabilidade, mantendo o cadastro simples |
| ONG | Saber com antecedência o que vem | Doador não quer se comprometer | O doador pode informar dados previamente sem compromisso definitivo; o compromisso só ocorre na confirmação |
| Marta | Aceitar todo doador | Qualidade mínima da informação | Aceitar qualquer doador que forneça as informações mínimas obrigatórias para registrar e rastrear a doação |

### Regras de negócio implícitas → explícitas

1. **Limite de doações simultâneas por ONG** — uma ONG não pode ter mais de N doações aceitas e pendentes de retirada ao mesmo tempo.
2. **Cancelamento pelo doador** — o doador só pode cancelar uma doação enquanto nenhuma ONG a tiver aceitado; após aceite, o cancelamento exige contato direto com a coordenação.
3. **Prazo de retirada** — uma doação aceita e não retirada em até X horas volta automaticamente para a lista de disponíveis.

---

## 5. História zero (walking skeleton)

> Como doador de restaurante, quero publicar uma doação com alimento, quantidade e validade, para que uma ONG possa visualizar o alimento disponível.

Fatia vertical inicial: entrada da doação → armazenamento → disponibilização para a ONG. A próxima fatia (fora do escopo da Unidade 1) trata da aceitação da doação, removendo-a da lista de disponíveis.

**Sinais de que uma história está grande demais:** precisa de mais de uma iteração, é difícil de estimar, mistura várias funcionalidades, ou aparece um "e" ligando comportamentos diferentes. Solução: dividir preservando valor independente em cada parte.
