const pool = require('./database');
const bcrypt = require('bcryptjs');

const seed = async () => {
  try {
    const senhaHash = await bcrypt.hash('admin123', 10);

    await pool.query(`
      INSERT INTO usuarios (nome, email, senha, perfil)
      VALUES ($1, $2, $3, $4)
      ON CONFLICT (email) DO NOTHING
    `, ['Administrador', 'admin@hidrauldiesel.com', senhaHash, 'admin']);

    console.log('✅ Usuário admin criado com sucesso!');
    console.log('📧 Email: admin@hidrauldiesel.com');
    console.log('🔑 Senha: admin123');
    process.exit(0);
  } catch (err) {
    console.error('❌ Erro:', err.message);
    process.exit(1);
  }
};

seed();
