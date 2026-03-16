const pool = require('../config/database');

const getDashboard = async (req, res) => {
  try {
    // OS por status
    const osPorStatus = await pool.query(`
      SELECT status, COUNT(*) as total
      FROM ordens_servico
      GROUP BY status
    `);

    // Faturamento do mês atual
    const faturamentoMes = await pool.query(`
      SELECT COALESCE(SUM(
        (SELECT COALESCE(SUM(valor * quantidade), 0) FROM itens_servico WHERE os_id = os.id) +
        (SELECT COALESCE(SUM(quantidade * valor_unit), 0) FROM itens_pecas WHERE os_id = os.id)
      ), 0) as total
      FROM ordens_servico os
      WHERE status = 'faturada'
      AND DATE_TRUNC('month', atualizado_em) = DATE_TRUNC('month', NOW())
    `);

    // OS criadas hoje
    const osCriadasHoje = await pool.query(`
      SELECT COUNT(*) as total
      FROM ordens_servico
      WHERE DATE(criado_em) = CURRENT_DATE
    `);

    // OS concluídas hoje
    const osConcluidasHoje = await pool.query(`
      SELECT COUNT(*) as total
      FROM ordens_servico
      WHERE status = 'servico_finalizado'
      AND DATE(atualizado_em) = CURRENT_DATE
    `);

    // Últimas 5 OS
    const ultimasOS = await pool.query(`
      SELECT
        os.id, os.numero, os.cliente_nome, os.status,
        v.modelo, v.placa
      FROM ordens_servico os
      LEFT JOIN veiculos v ON v.id = os.veiculo_id
      ORDER BY os.criado_em DESC
      LIMIT 5
    `);

    // Top mecânicos por comissão
    const topMecanicos = await pool.query(`
      SELECT
        m.nome,
        COUNT(DISTINCT c.os_id) as total_os,
        COALESCE(SUM(c.valor_comissao), 0) as total_comissao
      FROM mecanicos m
      LEFT JOIN comissoes c ON c.mecanico_id = m.id
      WHERE m.ativo = true
      GROUP BY m.id, m.nome
      ORDER BY total_comissao DESC
      LIMIT 5
    `);

    res.json({
      osPorStatus: osPorStatus.rows,
      faturamentoMes: faturamentoMes.rows[0].total,
      osCriadasHoje: osCriadasHoje.rows[0].total,
      osConcluidasHoje: osConcluidasHoje.rows[0].total,
      ultimasOS: ultimasOS.rows,
      topMecanicos: topMecanicos.rows,
    });

  } catch (err) {
    console.error(err);
    res.status(500).json({ erro: 'Erro ao carregar dashboard' });
  }
};

module.exports = { getDashboard };
