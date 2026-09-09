// Regras de negócio das doações
// TODO (grupo): implementar conforme as histórias e os critérios de aceite da Unidade 1
import * as repo from "./repositorio.js";

// História zero — "um doador publica uma doação"
// Critério: tipo, quantidade e validade são obrigatórios

// Critério: validade já vencida é rejeitada.
export async function criarDoacao({ tipo, quantidade, validade }) {
  // criterio de aceite: "Campos obrigatórios não preenchidos")
  if (!tipo || !quantidade || !validade) {
    throw new Error("tipo, quantidade e validade são obrigatórios");
  }

  // critério de aceite: "Tentativa de publicar doação vencida"
  // Comparamos só a data (sem hora) pra não rejeitar uma validade == hoje
  const hoje = new Date();
  hoje.setHours(0, 0, 0, 0);

  const dataValidade = new Date(validade);
  if (isNaN(dataValidade.getTime())) {
    throw new Error("validade inválida");
  }

  if (dataValidade < hoje) {
    throw new Error("validade já vencida");
  }

  // Passou nas validações -> delega a persistência pro repositório
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
    throw new Error("doação não encontrada ou já aceita por outra ONG");
  }

  return doacaoAtualizada;
}
