// Testes de caracterização das regras de negócio (src/doacoes.js).
// Escritos ANTES da Refatoração 2 para travar a ORDEM das validações e o
// TEXTO exato de cada mensagem de erro — os testes antigos só checavam o 400.
import { describe, it, expect, beforeEach, afterAll } from 'vitest';
import { migrar, limparBanco, encerrar } from '../src/db.js';
import * as doacoes from '../src/doacoes.js';

function validadeFutura() {
  const data = new Date();
  data.setDate(data.getDate() + 30);
  return data.toISOString().slice(0, 10);
}

beforeEach(async () => { await migrar(); await limparBanco(); });
afterAll(async () => { await encerrar(); });

describe('criarDoacao — mensagens de erro', () => {
  it.each([
    [{ quantidade: '1', validade: '2099-01-01' }, 'tipo, quantidade e validade são obrigatórios'],
    [{ tipo: 'Sopa', validade: '2099-01-01' }, 'tipo, quantidade e validade são obrigatórios'],
    [{ tipo: 'Sopa', quantidade: '1' }, 'tipo, quantidade e validade são obrigatórios'],
    [{ tipo: 'Sopa', quantidade: '0', validade: '2099-01-01' }, 'quantidade deve ser maior que zero'],
    [{ tipo: 'Sopa', quantidade: '-5', validade: '2099-01-01' }, 'quantidade deve ser maior que zero'],
    [{ tipo: 'Sopa', quantidade: '1', validade: 'amanhã' }, 'validade inválida'],
    [{ tipo: 'Sopa', quantidade: '1', validade: '2020-01-01' }, 'validade já vencida'],
  ])('%o → "%s"', async (entrada, mensagem) => {
    await expect(doacoes.criarDoacao(entrada)).rejects.toThrow(mensagem);
  });

  // Ordem das validações: quantidade é checada antes da validade.
  it('com quantidade zero E validade vencida, reclama da quantidade primeiro', async () => {
    await expect(
      doacoes.criarDoacao({ tipo: 'Sopa', quantidade: '0', validade: '2020-01-01' })
    ).rejects.toThrow('quantidade deve ser maior que zero');
  });
});

describe('criarDoacao — o que hoje é aceito', () => {
  // Comportamento atual (caracterização): quantidade em texto livre passa,
  // porque parseFloat('dez porções') é NaN e NaN não é finito.
  it('aceita quantidade em texto livre ("dez porções")', async () => {
    const criada = await doacoes.criarDoacao({
      tipo: 'Sopa', quantidade: 'dez porções', validade: validadeFutura(),
    });
    expect(criada).toMatchObject({ quantidade: 'dez porções', status: 'disponivel' });
  });

  it('aceita quantidade com unidade ("10 porções") e grava o texto original', async () => {
    const criada = await doacoes.criarDoacao({
      tipo: 'Sopa', quantidade: '10 porções', validade: validadeFutura(),
    });
    expect(criada.quantidade).toBe('10 porções');
  });
});

describe('aceitar — regra da ONG obrigatória', () => {
  it('recusa ONG vazia na camada de regras', async () => {
    const d = await doacoes.criarDoacao({ tipo: 'Sopa', quantidade: '1', validade: validadeFutura() });
    await expect(doacoes.aceitar(d.id, '')).rejects.toThrow('ong é obrigatória');
  });
});
