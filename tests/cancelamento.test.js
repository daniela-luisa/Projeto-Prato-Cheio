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

async function publicarDoacao(tipo = 'Sopa') {
  const res = await request(app)
    .post('/api/doacoes')
    .send({ tipo, quantidade: '10 porções', validade: validadeFutura() });

  expect(res.status).toBe(201);
  expect(res.body.status).toBe('disponivel');
  return res.body;
}

async function registroDaDoacao(id) {
  const { rows } = await query('SELECT * FROM doacoes WHERE id = ?', [id]);
  return rows[0];
}

describe('cancelar uma doação antes do aceite', () => {
  beforeEach(async () => { await migrar(); await limparBanco(); });
  afterAll(async () => { await encerrar(); });

  // Dado que há doações disponíveis, quando uma delas é cancelada,
  // então apenas ela sai da lista e seu registro continua no banco.
  it('cancela a disponível sem apagar dados nem afetar outras doações', async () => {
    const doacao = await publicarDoacao();
    const outraDoacao = await publicarDoacao('Arroz');

    const res = await request(app).post(`/api/doacoes/${doacao.id}/cancelar`);

    expect(res.status).toBe(200);
    expect(res.body).toEqual({ ...doacao, status: 'cancelada' });
    expect(res.body.ong).toBeNull();
    expect(await registroDaDoacao(doacao.id)).toEqual(res.body);
    expect(await registroDaDoacao(outraDoacao.id)).toEqual(outraDoacao);

    const lista = await request(app).get('/api/doacoes');
    expect(lista.status).toBe(200);
    expect(lista.body.map(item => item.id)).toEqual([outraDoacao.id]);
  });

  // Dado que uma ONG já aceitou, quando o doador tenta cancelar,
  // então a reserva é mantida e a mensagem orienta procurar a coordenação.
  it('recusa cancelamento após aceite e preserva a ONG responsável', async () => {
    const doacao = await publicarDoacao();
    const aceite = await request(app)
      .post(`/api/doacoes/${doacao.id}/aceitar`)
      .send({ ong: 'ONG Esperança' });
    expect(aceite.status).toBe(200);

    const res = await request(app).post(`/api/doacoes/${doacao.id}/cancelar`);

    expect(res.status).toBe(400);
    expect(res.body.erro).toMatch(/coordenação/i);
    expect(await registroDaDoacao(doacao.id)).toEqual(aceite.body);
  });

  it('recusa novo cancelamento de uma doação já cancelada', async () => {
    const doacao = await publicarDoacao();
    const primeiro = await request(app).post(`/api/doacoes/${doacao.id}/cancelar`);
    expect(primeiro.status).toBe(200);

    const segundo = await request(app).post(`/api/doacoes/${doacao.id}/cancelar`);

    expect(segundo.status).toBe(400);
    expect(segundo.body.erro).toEqual(expect.any(String));
    expect(await registroDaDoacao(doacao.id)).toEqual(primeiro.body);
  });

  it('informa erro ao cancelar uma doação inexistente', async () => {
    const doacao = await publicarDoacao();
    const idInexistente = doacao.id + 1;

    const res = await request(app).post(`/api/doacoes/${idInexistente}/cancelar`);

    expect(res.status).toBe(400);
    expect(res.body.erro).toMatch(/não encontrada|não existe|inexistente/i);
    expect(await registroDaDoacao(idInexistente)).toBeUndefined();
    expect(await registroDaDoacao(doacao.id)).toEqual(doacao);
  });

  it.each(['invalido', '-1'])('recusa o identificador inválido %s sem alterar dados', async id => {
    const doacao = await publicarDoacao();

    const res = await request(app).post(`/api/doacoes/${id}/cancelar`);

    expect(res.status).toBe(400);
    expect(res.body.erro).toEqual(expect.any(String));
    expect(await registroDaDoacao(doacao.id)).toEqual(doacao);
  });

  it('impede uma ONG de aceitar uma doação cancelada', async () => {
    const doacao = await publicarDoacao();
    const cancelamento = await request(app).post(`/api/doacoes/${doacao.id}/cancelar`);
    expect(cancelamento.status).toBe(200);

    const res = await request(app)
      .post(`/api/doacoes/${doacao.id}/aceitar`)
      .send({ ong: 'ONG Esperança' });

    expect(res.status).toBe(400);
    expect(res.body.erro).toMatch(/indisponível|não está mais disponível/i);
    expect(await registroDaDoacao(doacao.id)).toEqual(cancelamento.body);
  });

  // As requisições disputam a mesma doação. Independentemente de qual
  // chega primeiro, apenas uma pode efetivar sua mudança de estado.
  it('permite apenas uma transição quando aceite e cancelamento concorrem', async () => {
    const doacao = await publicarDoacao();

    const [aceite, cancelamento] = await Promise.all([
      request(app)
        .post(`/api/doacoes/${doacao.id}/aceitar`)
        .send({ ong: 'ONG Esperança' }),
      request(app).post(`/api/doacoes/${doacao.id}/cancelar`)
    ]);

    expect([aceite.status, cancelamento.status].sort()).toEqual([200, 400]);

    const sucesso = aceite.status === 200 ? aceite : cancelamento;
    const erro = aceite.status === 400 ? aceite : cancelamento;
    const registro = await registroDaDoacao(doacao.id);
    expect(registro).toEqual(sucesso.body);
    expect(registro).toEqual({
      ...doacao,
      status: aceite.status === 200 ? 'aceita' : 'cancelada',
      ong: aceite.status === 200 ? 'ONG Esperança' : null
    });
    expect(erro.body.erro).toEqual(expect.any(String));

    const lista = await request(app).get('/api/doacoes');
    expect(lista.status).toBe(200);
    expect(lista.body).toEqual([]);
  });
});