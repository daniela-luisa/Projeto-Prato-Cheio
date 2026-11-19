// Estados possíveis de uma doação (coluna `status` da tabela doacoes).
// Ver o diagrama em docs/estados.md.
//
// Centralizado aqui para não espalhar strings soltas ('disponivel', 'aceita'…)
// pelo código: um erro de digitação em STATUS.ACEITAA vira `undefined` e quebra
// o teste na hora, enquanto 'aceitaa' passaria calado e só falharia em produção.
// Object.freeze impede que alguém altere os valores em tempo de execução.
export const STATUS = Object.freeze({
  DISPONIVEL: 'disponivel',
  ACEITA: 'aceita',
  CANCELADA: 'cancelada',
});
