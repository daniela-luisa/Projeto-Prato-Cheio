import { describe, it, expect, beforeEach } from 'vitest';
import { migrar, limparBanco } from '../src/db.js';
import * as doacoes from '../src/doacoes.js';
import { criarApp } from '../src/app.js';

const amanha = new Date(Date.now() + 86400000).toISOString().slice(0, 10);
const depois = new Date(Date.now() + 3 * 86400000).toISOString().slice(0, 10);

beforeEach(async () => { await migrar(); await limparBanco(); });

describe('entregador vê remessas aceitas', () => {
  it('devolve lista vazia quando não há remessas aceitas', async () => {
    expect(await doacoes.listarAceitas()).toEqual([]);
  });

  it('lista só as aceitas, com a ONG', async () => {
    const a = await doacoes.criarDoacao({ tipo: 'Arroz', quantidade: '10kg', validade: amanha });
    await doacoes.criarDoacao({ tipo: 'Feijão', quantidade: '5kg', validade: amanha }); // fica disponivel
    const c = await doacoes.criarDoacao({ tipo: 'Pão', quantidade: '20un', validade: amanha });
    await doacoes.cancelar(c.id);
    await doacoes.aceitar(a.id, 'ONG Esperança');

    const lista = await doacoes.listarAceitas();
    expect(lista).toHaveLength(1);
    expect(lista[0]).toMatchObject({ tipo: 'Arroz', status: 'aceita', ong: 'ONG Esperança' });
  });

  it('ordena pela validade mais próxima', async () => {
    const longe = await doacoes.criarDoacao({ tipo: 'Macarrão', quantidade: '3kg', validade: depois });
    const perto = await doacoes.criarDoacao({ tipo: 'Leite', quantidade: '12L', validade: amanha });
    await doacoes.aceitar(longe.id, 'ONG A');
    await doacoes.aceitar(perto.id, 'ONG B');

    const lista = await doacoes.listarAceitas();
    expect(lista.map(d => d.tipo)).toEqual(['Leite', 'Macarrão']);
  });

  it('GET /api/entregas/disponiveis responde 200 com a lista', async () => {
    const d = await doacoes.criarDoacao({ tipo: 'Arroz', quantidade: '10kg', validade: amanha });
    await doacoes.aceitar(d.id, 'ONG Esperança');

    const servidor = criarApp().listen(0);
    try {
      const { port } = servidor.address();
      const res = await fetch(`http://localhost:${port}/api/entregas/disponiveis`);
      expect(res.status).toBe(200);
      expect(await res.json()).toHaveLength(1);
    } finally {
      servidor.close();
    }
  });
});