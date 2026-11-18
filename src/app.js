import express from 'express';
import * as doacoes from './doacoes.js';

// Envolve um handler async: o que ele devolver vira o corpo JSON da resposta
// (com o status de sucesso informado) e QUALQUER exceção vira 400 { erro }.
// Antes, cada rota repetia o mesmo try/catch.
function responder(acao, statusSucesso = 200) {
  return async (req, res) => {
    try {
      res.status(statusSucesso).json(await acao(req));
    } catch (erro) {
      res.status(400).json({ erro: erro.message });
    }
  };
}

export function criarApp() {
  const app = express();
  app.use(express.json());
  app.use(express.static('public'));

  // Verificação de saúde: usada pelo CI para provar que a aplicação sobe.
  app.get('/api/saude', (req, res) => res.json({ ok: true }));

  app.get('/api/doacoes', responder(() => doacoes.listarDisponiveis()));

  app.post('/api/doacoes', responder(req => doacoes.criarDoacao(req.body), 201));

  app.post('/api/doacoes/:id/aceitar',
    responder(req => doacoes.aceitar(req.params.id, req.body?.ong ?? 'ONG')));

  app.post('/api/doacoes/:id/cancelar', responder(req => doacoes.cancelar(req.params.id)));

  app.get('/api/entregas/disponiveis', responder(() => doacoes.listarAceitas()));

  return app;
}
