// Testes de caracterização das rotas (src/app.js).
// Escritos ANTES da Refatoração 1 para travar o comportamento atual:
// toda exceção vira HTTP 400 com { erro: mensagem }, e cada rota devolve
// o status de sucesso esperado. Se a refatoração mudar isso, estes testes quebram.
import { describe, it, expect, beforeEach, afterAll } from 'vitest';
import request from 'supertest';
import { criarApp } from '../src/app.js';
import { query, migrar, limparBanco, encerrar } from '../src/db.js';

const app = criarApp();

function validadeFutura() {
  const data = new Date();
  data.setDate(data.getDate() + 30);
  return data.toISOString().slice(0, 10);
}

beforeEach(async () => { await migrar(); await limparBanco(); });
afterAll(async () => { await encerrar(); });

describe('rotas — caminho de sucesso', () => {
  it('POST /api/doacoes responde 201 com a doação criada', async () => {
    const res = await request(app)
      .post('/api/doacoes')
      .send({ tipo: 'Sopa', quantidade: '10 porções', validade: validadeFutura() });
    expect(res.status).toBe(201);
    expect(res.body).toMatchObject({ tipo: 'Sopa', status: 'disponivel', ong: null });
  });

  it('POST /api/doacoes/:id/aceitar sem corpo usa a ONG padrão "ONG"', async () => {
    const criada = await request(app)
      .post('/api/doacoes')
      .send({ tipo: 'Sopa', quantidade: '10 porções', validade: validadeFutura() });

    const res = await request(app).post(`/api/doacoes/${criada.body.id}/aceitar`);

    expect(res.status).toBe(200);
    expect(res.body.ong).toBe('ONG');
  });

  it('GET /api/entregas/disponiveis responde 200 e lista vazia sem aceitas', async () => {
    const res = await request(app).get('/api/entregas/disponiveis');
    expect(res.status).toBe(200);
    expect(res.body).toEqual([]);
  });
});

// Força uma falha real de banco (tabela inexistente) para provar que
// QUALQUER exceção — não só as de validação — vira 400 { erro }.
describe('rotas — qualquer exceção vira 400 { erro }', () => {
  beforeEach(async () => { await query('DROP TABLE doacoes'); });

  it.each([
    ['get', '/api/doacoes'],
    ['post', '/api/doacoes'],
    ['post', '/api/doacoes/1/aceitar'],
    ['post', '/api/doacoes/1/cancelar'],
    ['get', '/api/entregas/disponiveis'],
  ])('%s %s', async (metodo, url) => {
    const corpo = { tipo: 'Sopa', quantidade: '1', validade: validadeFutura(), ong: 'X' };
    const res = await request(app)[metodo](url).send(corpo);

    expect(res.status).toBe(400);
    expect(res.body).toEqual({ erro: expect.any(String) });
  });
});
