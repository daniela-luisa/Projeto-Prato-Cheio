import { describe, it, expect, beforeEach, afterAll } from 'vitest';
import request from 'supertest';
import { criarApp } from '../src/app.js';
import { migrar, limparBanco, encerrar } from '../src/db.js';

const app = criarApp();

// Gera uma validade sempre no futuro, relativa ao momento em que o teste
// roda. Evita que a suíte quebre com o tempo (o que aconteceria com uma
// data fixa: mais cedo ou mais tarde ela vira passado).
function validadeFutura(diasNoFuturo = 30) {
  const data = new Date();
  data.setDate(data.getDate() + diasNoFuturo);
  return data.toISOString().slice(0, 10); // 'YYYY-MM-DD'
}

// Este teste já passa e não depende do banco:
// prova que a aplicação sobe e que o CI está funcionando.
describe('a aplicação sobe', () => {
  it('responde na verificação de saúde', async () => {
    const res = await request(app).get('/api/saude');
    expect(res.status).toBe(200);
    expect(res.body.ok).toBe(true);
  });
});

describe('publicar e listar doações', () => {
  beforeEach(async () => { await migrar(); await limparBanco(); });
  afterAll(async () => { await encerrar(); });

  // Dado que um doador publicou uma doação
  // Quando uma ONG consulta as doações disponíveis
  // Então a doação aparece na lista
  it('mostra a doação publicada na lista de disponíveis', async () => {
    await request(app)
      .post('/api/doacoes')
      .send({ tipo: 'Sopa', quantidade: '10 porções', validade: validadeFutura() });

    const res = await request(app).get('/api/doacoes');
    expect(res.status).toBe(200);
    expect(res.body).toHaveLength(1);
    expect(res.body[0].tipo).toBe('Sopa');
  });

  // Dado que faltam campos obrigatórios
  // Quando um doador tenta publicar
  // Então a API recusa e nada é gravado
  it('recusa doação sem os campos obrigatórios', async () => {
    const res = await request(app)
      .post('/api/doacoes')
      .send({ tipo: 'Sopa' }); // faltando quantidade e validade

    expect(res.status).toBe(400);
    expect(res.body.erro).toBeDefined();

    const lista = await request(app).get('/api/doacoes');
    expect(lista.body).toHaveLength(0);
  });

  // Critério extra que doacoes.js já implementa: validade vencida é rejeitada.
  it('recusa doação com validade já vencida', async () => {
    const res = await request(app)
      .post('/api/doacoes')
      .send({ tipo: 'Sopa', quantidade: '10 porções', validade: '2020-01-01' });

    expect(res.status).toBe(400);
    expect(res.body.erro).toBeDefined();
  });
});

describe('aceitar uma doação', () => {
  beforeEach(async () => { await migrar(); await limparBanco(); });
  afterAll(async () => { await encerrar(); });

  async function publicarDoacao() {
    const res = await request(app)
      .post('/api/doacoes')
      .send({ tipo: 'Sopa', quantidade: '10 porções', validade: validadeFutura() });
    return res.body.id;
  }

  // Dado que existe uma doação disponível
  // Quando uma ONG a aceita
  // Então ela passa a constar como aceita por aquela ONG
  it('marca a doação como aceita pela ONG', async () => {
    const id = await publicarDoacao();

    const res = await request(app)
      .post(`/api/doacoes/${id}/aceitar`)
      .send({ ong: 'ONG Esperança' });

    expect(res.status).toBe(200);
    expect(res.body.status).toBe('aceita');
    expect(res.body.ong).toBe('ONG Esperança');
  });

  // Dado que uma doação foi aceita
  // Quando outra ONG consulta as disponíveis
  // Então ela não aparece mais na lista
  it('remove a doação da lista de disponíveis depois de aceita', async () => {
    const id = await publicarDoacao();
    await request(app).post(`/api/doacoes/${id}/aceitar`).send({ ong: 'ONG Esperança' });

    const lista = await request(app).get('/api/doacoes');
    expect(lista.body).toHaveLength(0);
  });

  // Dado que uma doação já foi aceita por uma ONG
  // Quando outra ONG tenta aceitar a mesma doação
  // Então a API recusa
  it('recusa aceitar uma doação que já foi aceita por outra ONG', async () => {
    const id = await publicarDoacao();
    await request(app).post(`/api/doacoes/${id}/aceitar`).send({ ong: 'ONG Esperança' });

    const res = await request(app)
      .post(`/api/doacoes/${id}/aceitar`)
      .send({ ong: 'ONG Solidária' });

    expect(res.status).toBe(400);
    expect(res.body.erro).toBeDefined();
  });
});