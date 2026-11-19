// Regras de negócio das doações
// TODO (grupo): implementar conforme as histórias e os critérios de aceite da Unidade 1
import * as repo from "./repositorio.js";
import { STATUS } from "./status.js";

// ---------------------------------------------------------------------------
// Validações da publicação. Cada uma cuida de UMA regra e lança erro se falhar.
// A ordem de chamada em criarDoacao faz parte do comportamento (é a ordem
// em que o usuário recebe as mensagens) — está travada em tests/regras.test.js.
// ---------------------------------------------------------------------------

// Critério de aceite: "Campos obrigatórios não preenchidos".
function exigirCamposObrigatorios({ tipo, quantidade, validade }) {
  if (!tipo || !quantidade || !validade) {
    throw new Error("tipo, quantidade e validade são obrigatórios");
  }
}

// Só rejeita quando a quantidade COMEÇA com número e ele é ≤ 0 ("0", "-5 kg").
// Texto livre ("dez porções") passa: parseFloat dá NaN, que não é finito.
function exigirQuantidadePositiva(quantidade) {
  const quantidadeNumerica = Number.parseFloat(quantidade);
  if (Number.isFinite(quantidadeNumerica) && quantidadeNumerica <= 0) {
    throw new Error("quantidade deve ser maior que zero");
  }
}

// Critério de aceite: "Tentativa de publicar doação vencida".
// Comparamos só a data (sem hora) pra não rejeitar uma validade == hoje.
function exigirValidadeNaoVencida(validade) {
  const hoje = new Date();
  hoje.setHours(0, 0, 0, 0);

  const dataValidade = new Date(validade);
  if (isNaN(dataValidade.getTime())) {
    throw new Error("validade inválida");
  }
  if (dataValidade < hoje) {
    throw new Error("validade já vencida");
  }
}

// História zero — "um doador publica uma doação".
export async function criarDoacao({ tipo, quantidade, validade }) {
  exigirCamposObrigatorios({ tipo, quantidade, validade });
  exigirQuantidadePositiva(quantidade);
  exigirValidadeNaoVencida(validade);

  return repo.inserir({ tipo, quantidade, validade });
}

// História zero — "uma ONG vê as doações disponíveis"
export async function listarDisponiveis() {
  return repo.listarDisponiveis();
}

// História zero — "uma ONG aceita uma doação"
// Regra do caso: uma doação aceita não fica disponível para outra ONG
export async function aceitar(id, ong) {
  if (!ong) {
    throw new Error("ong é obrigatória");
  }

  // repo.aceitar só atualiza a linha se ela ainda estiver 'disponivel'
  // (a trava contra corrida entre duas ONGs vive no SQL, não aqui).
  // Se não veio linha de volta, é porque a doação não existe ou já foi aceita.
  const doacaoAtualizada = await repo.aceitar(id, ong);
  if (!doacaoAtualizada) {
    throw new Error("doação não encontrada ou não está mais disponível");
  }

  return doacaoAtualizada;
}

export async function cancelar(id) {
  const identificador = Number(id);
  if (!Number.isSafeInteger(identificador) || identificador <= 0) {
    throw new Error("identificador de doação inválido");
  }

  const doacaoCancelada = await repo.cancelar(identificador);
  if (doacaoCancelada) return doacaoCancelada;

  const existente = await repo.buscarPorId(identificador);
  if (!existente) {
    throw new Error("doação não encontrada");
  }
  if (existente.status === STATUS.ACEITA) {
    throw new Error("doação já aceita. Entre em contato com a coordenação para solicitar o cancelamento");
  }
  throw new Error("doação não está mais disponível para cancelamento");
}

export async function listarAceitas() {
  return repo.listarAceitas();
}
