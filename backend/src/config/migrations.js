const pool = require('./database');

const createTables = async () => {
  try {

    // Usuários
    await pool.query(`
      CREATE TABLE IF NOT EXISTS usuarios (
        id SERIAL PRIMARY KEY,
        nome VARCHAR(200) NOT NULL,
        email VARCHAR(200) UNIQUE NOT NULL,
        senha VARCHAR(255) NOT NULL,
        perfil VARCHAR(20) NOT NULL DEFAULT 'mecanico',
        ativo BOOLEAN DEFAULT true,
        criado_em TIMESTAMP DEFAULT NOW()
      );
    `);

    // Mecânicos
    await pool.query(`
      CREATE TABLE IF NOT EXISTS mecanicos (
        id SERIAL PRIMARY KEY,
        usuario_id INTEGER REFERENCES usuarios(id),
        nome VARCHAR(200) NOT NULL,
        telefone VARCHAR(20),
        percentual_comissao DECIMAL(5,2) DEFAULT 0,
        ativo BOOLEAN DEFAULT true,
        criado_em TIMESTAMP DEFAULT NOW()
      );
    `);

    // Veículos
    await pool.query(`
      CREATE TABLE IF NOT EXISTS veiculos (
        id SERIAL PRIMARY KEY,
        placa VARCHAR(10) UNIQUE NOT NULL,
        modelo VARCHAR(200),
        ano VARCHAR(10),
        cor VARCHAR(50),
        chassi VARCHAR(50),
        motor VARCHAR(100),
        cliente_id INTEGER,
        cliente_nome VARCHAR(200),
        criado_em TIMESTAMP DEFAULT NOW()
      );
    `);

    // Ordens de Serviço
    await pool.query(`
      CREATE TABLE IF NOT EXISTS ordens_servico (
        id SERIAL PRIMARY KEY,
        numero VARCHAR(20) UNIQUE NOT NULL,
        cliente_id INTEGER,
        cliente_nome VARCHAR(200),
        veiculo_id INTEGER REFERENCES veiculos(id),
        status VARCHAR(30) NOT NULL DEFAULT 'orcamento',
        queixa TEXT,
        obs_tecnica TEXT,
        km_atual VARCHAR(20),
        bling_pedido_id INTEGER,
        criado_em TIMESTAMP DEFAULT NOW(),
        atualizado_em TIMESTAMP DEFAULT NOW()
      );
    `);

    // Itens de Serviço
    await pool.query(`
      CREATE TABLE IF NOT EXISTS itens_servico (
        id SERIAL PRIMARY KEY,
        os_id INTEGER REFERENCES ordens_servico(id) ON DELETE CASCADE,
        bling_produto_id INTEGER,
        descricao VARCHAR(200) NOT NULL,
        valor DECIMAL(10,2) NOT NULL,
        mecanico_id INTEGER REFERENCES mecanicos(id),
        criado_em TIMESTAMP DEFAULT NOW()
      );
    `);

    // Itens de Peças
    await pool.query(`
      CREATE TABLE IF NOT EXISTS itens_pecas (
        id SERIAL PRIMARY KEY,
        os_id INTEGER REFERENCES ordens_servico(id) ON DELETE CASCADE,
        bling_produto_id INTEGER,
        descricao VARCHAR(200) NOT NULL,
        quantidade DECIMAL(10,3) NOT NULL,
        valor_unit DECIMAL(10,2) NOT NULL,
        criado_em TIMESTAMP DEFAULT NOW()
      );
    `);

    // Comissões
    await pool.query(`
      CREATE TABLE IF NOT EXISTS comissoes (
        id SERIAL PRIMARY KEY,
        mecanico_id INTEGER REFERENCES mecanicos(id),
        os_id INTEGER REFERENCES ordens_servico(id),
        item_servico_id INTEGER REFERENCES itens_servico(id),
        valor_servico DECIMAL(10,2) NOT NULL,
        percentual DECIMAL(5,2) NOT NULL,
        valor_comissao DECIMAL(10,2) NOT NULL,
        criado_em TIMESTAMP DEFAULT NOW()
      );
    `);

    // Histórico de alterações
    await pool.query(`
      CREATE TABLE IF NOT EXISTS historico (
        id SERIAL PRIMARY KEY,
        usuario_id INTEGER REFERENCES usuarios(id),
        usuario_nome VARCHAR(200),
        tabela VARCHAR(50) NOT NULL,
        registro_id INTEGER NOT NULL,
        acao VARCHAR(20) NOT NULL,
        dados_anteriores JSONB,
        dados_novos JSONB,
        criado_em TIMESTAMP DEFAULT NOW()
      );
    `);

    // Adiciona quantidade em itens_servico (idempotente)
    await pool.query(`
      ALTER TABLE itens_servico
      ADD COLUMN IF NOT EXISTS quantidade DECIMAL(10,3) NOT NULL DEFAULT 1;
    `);

    console.log('✅ Tabelas criadas com sucesso!');
  } catch (err) {
    console.error('❌ Erro ao criar tabelas:', err.message);
  }
};

createTables();
