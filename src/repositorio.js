// Camada de dados do Prato Cheio — acesso ao banco.
// A conexão e o schema estão em src/db.js.
//
// Marcador de parâmetro é `?` (SQL parametrizado evita injeção):
//   const { rows } = await query('SELECT * FROM doacoes WHERE id = ?', [id]);
import { query } from './db.js';
import { STATUS } from './status.js';

// Insere a doação e devolve a linha criada.
export async function inserir({ tipo, quantidade, validade }) {
  const { rows } = await query(
    `INSERT INTO doacoes (tipo, quantidade, validade)
     VALUES (?, ?, ?)
     RETURNING *`,
    [tipo, quantidade, validade]);
  return rows[0];
}

// Devolve apenas as doações ainda disponíveis, mais antigas primeiro.
export async function listarDisponiveis() {
  const { rows } = await query(
    'SELECT * FROM doacoes WHERE status = ? ORDER BY criada_em, id',
    [STATUS.DISPONIVEL]
  );
  return rows;
}

// Busca uma doação pelo id. Devolve undefined se não existir.
export async function buscarPorId(id) {
  const { rows } = await query(
    'SELECT * FROM doacoes WHERE id = ?',
    [id]
  );
  return rows[0];
}

// Transição de estado atômica: muda o status de `de` para `para` (e, se vier,
// grava a ONG) e devolve a linha atualizada.
//
// A condição `AND status = ?` no próprio UPDATE é a trava contra corrida:
// se duas requisições disputam a mesma doação, só a primeira encontra a linha
// no estado esperado; a segunda não atualiza nada e recebe undefined
// (o mesmo acontece se o id não existir).
//
// `COALESCE(?, ong)` mantém a ONG atual quando nenhuma é informada.
async function transicionar(id, { de, para, ong = null }) {
  const { rows } = await query(
    `UPDATE doacoes
     SET status = ?, ong = COALESCE(?, ong)
     WHERE id = ? AND status = ?
     RETURNING *`,
    [para, ong, id, de]
  );
  return rows[0];
}

// ONG aceita: disponivel → aceita, gravando quem aceitou.
export async function aceitar(id, ong) {
  return transicionar(id, { de: STATUS.DISPONIVEL, para: STATUS.ACEITA, ong });
}

// Doador cancela: disponivel → cancelada (a ONG continua como estava: null).
export async function cancelar(id) {
  return transicionar(id, { de: STATUS.DISPONIVEL, para: STATUS.CANCELADA });
}

export async function listarAceitas() {
  const { rows } = await query(
    'SELECT * FROM doacoes WHERE status = ? ORDER BY validade, id',
    [STATUS.ACEITA]
  );
  return rows;
}
