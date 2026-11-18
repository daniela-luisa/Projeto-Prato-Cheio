// Testes de caracterização das transições de status no repositório.
// Escritos ANTES das Refatorações 3 e 4 para travar o contrato de
// aceitar/cancelar/listarAceitas direto na camada de dados (sem HTTP).
import { describe, it, expect, beforeEach, afterAll } from 'vitest';
import { query, migrar, limparBanco, encerrar } from '../src/db.js';
import * as repo from '../src/repositorio.js';

beforeEach(async () => { await migrar(); await limparBanco(); });
afterAll(async () => { await encerrar(); });

async function nova(status = 'disponivel', ong = null, validade = '2099-01-01') {
  const { rows } = await query(
    'INSERT INTO doacoes (tipo, quantidade, validade, status, ong) VALUES (?, ?, ?, ?, ?) RETURNING *',
    ['Sopa', '1', validade, status, ong]
  );
  return rows[0];
}

describe('repo.aceitar', () => {
  it('muda disponivel → aceita, grava a ONG e devolve a linha', async () => {
    const d = await nova();
    expect(await repo.aceitar(d.id, 'ONG A')).toEqual({ ...d, status: 'aceita', ong: 'ONG A' });
  });

  it.each(['aceita', 'cancelada'])('devolve undefined e não altera se o status é %s', async (status) => {
    const d = await nova(status, status === 'aceita' ? 'ONG X' : null);
    expect(await repo.aceitar(d.id, 'ONG B')).toBeUndefined();
    expect(await repo.buscarPorId(d.id)).toEqual(d);
  });

  it('devolve undefined para id inexistente', async () => {
    expect(await repo.aceitar(999, 'ONG A')).toBeUndefined();
  });
});

describe('repo.cancelar', () => {
  it('muda disponivel → cancelada sem mexer na ONG', async () => {
    const d = await nova();
    expect(await repo.cancelar(d.id)).toEqual({ ...d, status: 'cancelada', ong: null });
  });

  it.each(['aceita', 'cancelada'])('devolve undefined e não altera se o status é %s', async (status) => {
    const d = await nova(status, status === 'aceita' ? 'ONG X' : null);
    expect(await repo.cancelar(d.id)).toBeUndefined();
    expect(await repo.buscarPorId(d.id)).toEqual(d);
  });
});

describe('repo.listarAceitas', () => {
  it('traz só aceitas, ordenadas por validade e depois id', async () => {
    const b = await nova('aceita', 'ONG', '2099-02-01');
    const a1 = await nova('aceita', 'ONG', '2099-01-01');
    const a2 = await nova('aceita', 'ONG', '2099-01-01');
    await nova('disponivel');
    await nova('cancelada');
    expect((await repo.listarAceitas()).map(d => d.id)).toEqual([a1.id, a2.id, b.id]);
  });
});

describe('repo.listarDisponiveis', () => {
  it('desempata pela ordem de id quando criada_em é igual', async () => {
    const primeira = await nova();
    const segunda = await nova();
    expect((await repo.listarDisponiveis()).map(d => d.id)).toEqual([primeira.id, segunda.id]);
  });
});
