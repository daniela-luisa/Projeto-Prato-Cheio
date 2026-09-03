import { describe, it, expect, beforeEach, afterAll } from 'vitest';
import { query, migrar, limparBanco, encerrar } from '../src/db.js';
import { listarDisponiveis } from '../src/repositorio.js';

beforeEach(async () => { await migrar(); await limparBanco(); });
afterAll(async () => { await encerrar(); });

describe('repositorio.listarDisponiveis', () => {
  it('retorna apenas doações com status disponivel', async () => {
    await query("INSERT INTO doacoes (tipo,quantidade,validade,status) VALUES ('Sopa','10','2026-12-01','disponivel')");
    await query("INSERT INTO doacoes (tipo,quantidade,validade,status,ong) VALUES ('Arroz','5kg','2026-12-01','aceita','ONG X')");
    const lista = await listarDisponiveis();
    expect(lista).toHaveLength(1);
    expect(lista[0].tipo).toBe('Sopa');
  });

  it('devolve lista vazia quando não há disponíveis', async () => {
    expect(await listarDisponiveis()).toEqual([]);
  });

  it('ordena das mais antigas para as mais novas', async () => {
    await query("INSERT INTO doacoes (tipo,quantidade,validade,criada_em) VALUES ('Nova','1','2026-12-01','2026-07-02 10:00')");
    await query("INSERT INTO doacoes (tipo,quantidade,validade,criada_em) VALUES ('Antiga','1','2026-12-01','2026-07-01 10:00')");
    const lista = await listarDisponiveis();
    expect(lista.map(d => d.tipo)).toEqual(['Antiga', 'Nova']);
  });
});