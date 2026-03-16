const pool = require('../config/database');

// Listar todas as OS
const listarOS = async (req, res) => {
  try {
    const resultado = await pool.query(`
      SELECT
        os.id,
        os.numero,
        os.cliente_nome,
        os.status,
        os.km_atual,
        os.criado_em,
        os.atualizado_em,
        v.placa,
        v.modelo,
        v.ano,
        COALESCE(SUM(s.valor), 0) + COALESCE(SUM(p.quantidade * p.valor_unit), 0) AS valor_total
      FROM ordens_servico os
      LEFT JOIN veiculos v ON v.id = os.veiculo_id
      LEFT JOIN itens_servico s ON s.os_id = os.id
      LEFT JOIN itens_pecas p ON p.os_id = os.id
      GROUP BY os.id, v.placa, v.modelo, v.ano
      ORDER BY os.criado_em DESC
    `);

    res.json(resultado.rows);
  } catch (err) {
    res.status(500).json({ erro: 'Erro ao listar OS' });
  }
};

// Buscar OS por ID
const buscarOS = async (req, res) => {
  const { id } = req.params;

  try {
    const os = await pool.query(
      `SELECT os.*, v.placa, v.modelo, v.ano, v.cor, v.chassi, v.motor
       FROM ordens_servico os
       LEFT JOIN veiculos v ON v.id = os.veiculo_id
       WHERE os.id = $1`,
      [id]
    );

    if (os.rows.length === 0) {
      return res.status(404).json({ erro: 'OS não encontrada' });
    }

    const servicos = await pool.query(
      'SELECT * FROM itens_servico WHERE os_id = $1',
      [id]
    );

    const pecas = await pool.query(
      'SELECT * FROM itens_pecas WHERE os_id = $1',
      [id]
    );

    res.json({
      ...os.rows[0],
      servicos: servicos.rows,
      pecas: pecas.rows
    });

  } catch (err) {
    res.status(500).json({ erro: 'Erro ao buscar OS' });
  }
};

// Criar OS
const criarOS = async (req, res) => {
  const {
    cliente_id, cliente_nome, veiculo, queixa, obs_tecnica, servicos, pecas
  } = req.body;

  const client = await pool.connect();

  try {
    await client.query('BEGIN');

    // Criar ou atualizar veículo
    let veiculo_id;
    if (veiculo.placa) {
      const veiculoExistente = await client.query(
        'SELECT id FROM veiculos WHERE placa = $1',
        [veiculo.placa]
      );

      if (veiculoExistente.rows.length > 0) {
        veiculo_id = veiculoExistente.rows[0].id;
      } else {
        const novoVeiculo = await client.query(
          `INSERT INTO veiculos (placa, modelo, ano, cor, chassi, motor, cliente_id, cliente_nome)
           VALUES ($1, $2, $3, $4, $5, $6, $7, $8) RETURNING id`,
          [veiculo.placa, veiculo.modelo, veiculo.ano, veiculo.cor,
           veiculo.chassi, veiculo.motor, cliente_id, cliente_nome]
        );
        veiculo_id = novoVeiculo.rows[0].id;
      }
    }

    // Gerar número da OS
    const count = await client.query('SELECT COUNT(*) FROM ordens_servico');
    const numero = `ORC-${String(parseInt(count.rows[0].count) + 1).padStart(4, '0')}`;

    // Criar OS
    const novaOS = await client.query(
      `INSERT INTO ordens_servico
       (numero, cliente_id, cliente_nome, veiculo_id, queixa, obs_tecnica, status)
       VALUES ($1, $2, $3, $4, $5, $6, 'orcamento')
       RETURNING *`,
      [numero, cliente_id, cliente_nome, veiculo_id, queixa, obs_tecnica]
    );

    const os_id = novaOS.rows[0].id;

    // Inserir serviços
    if (servicos && servicos.length > 0) {
      for (const s of servicos) {
        await client.query(
          `INSERT INTO itens_servico (os_id, bling_produto_id, descricao, valor, quantidade, mecanico_id)
           VALUES ($1, $2, $3, $4, $5, $6)`,
          [os_id, s.bling_produto_id, s.descricao, s.valor, s.quantidade || 1, s.mecanico_id]
        );
      }
    }

    // Inserir peças
    if (pecas && pecas.length > 0) {
      for (const p of pecas) {
        await client.query(
          `INSERT INTO itens_pecas (os_id, bling_produto_id, descricao, quantidade, valor_unit)
           VALUES ($1, $2, $3, $4, $5)`,
          [os_id, p.bling_produto_id, p.descricao, p.quantidade, p.valor_unit]
        );
      }
    }

    // Registrar histórico
    await client.query(
      `INSERT INTO historico (usuario_id, usuario_nome, tabela, registro_id, acao, dados_novos)
       VALUES ($1, $2, $3, $4, $5, $6)`,
      [req.usuario.id, req.usuario.nome, 'ordens_servico', os_id, 'CRIOU', JSON.stringify(novaOS.rows[0])]
    );

    await client.query('COMMIT');
    res.status(201).json(novaOS.rows[0]);

  } catch (err) {
    await client.query('ROLLBACK');
    res.status(500).json({ erro: 'Erro ao criar OS' });
  } finally {
    client.release();
  }
};

// Atualizar status da OS
const atualizarStatus = async (req, res) => {
  const { id } = req.params;
  const { status } = req.body;

  const statusValidos = [
    'orcamento', 'aprovado', 'em_execucao',
    'servico_finalizado', 'faturada', 'encerrada'
  ];

  if (!statusValidos.includes(status)) {
    return res.status(400).json({ erro: 'Status inválido' });
  }

  const client = await pool.connect();

  try {
    await client.query('BEGIN');

    const osAtual = await client.query(
      'SELECT * FROM ordens_servico WHERE id = $1',
      [id]
    );

    if (osAtual.rows.length === 0) {
      return res.status(404).json({ erro: 'OS não encontrada' });
    }

    const atualizado = await client.query(
      `UPDATE ordens_servico
       SET status = $1, atualizado_em = NOW()
       WHERE id = $2 RETURNING *`,
      [status, id]
    );

    // Se chegou em serviço_finalizado, calcular comissões
    if (status === 'servico_finalizado') {
      const servicos = await client.query(
        `SELECT s.*, m.percentual_comissao
         FROM itens_servico s
         JOIN mecanicos m ON m.id = s.mecanico_id
         WHERE s.os_id = $1`,
        [id]
      );

      for (const s of servicos.rows) {
        const valor_comissao = (s.valor * s.quantidade * s.percentual_comissao) / 100;
        await client.query(
          `INSERT INTO comissoes
           (mecanico_id, os_id, item_servico_id, valor_servico, percentual, valor_comissao)
           VALUES ($1, $2, $3, $4, $5, $6)`,
          [s.mecanico_id, id, s.id, s.valor, s.percentual_comissao, valor_comissao]
        );
      }
    }

    // Registrar histórico
    await client.query(
      `INSERT INTO historico (usuario_id, usuario_nome, tabela, registro_id, acao, dados_anteriores, dados_novos)
       VALUES ($1, $2, $3, $4, $5, $6, $7)`,
      [
        req.usuario.id, req.usuario.nome, 'ordens_servico', id, 'ALTEROU_STATUS',
        JSON.stringify({ status: osAtual.rows[0].status }),
        JSON.stringify({ status })
      ]
    );

    await client.query('COMMIT');
    res.json(atualizado.rows[0]);

  } catch (err) {
    await client.query('ROLLBACK');
    res.status(500).json({ erro: 'Erro ao atualizar status' });
  } finally {
    client.release();
  }
};

module.exports = { listarOS, buscarOS, criarOS, atualizarStatus };
