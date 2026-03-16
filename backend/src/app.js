const express = require('express');
const cors = require('cors');
require('dotenv').config();

const app = express();

// Conectar ao banco
require('./config/database');

// Criar tabelas
require('./config/migrations');

app.use(cors());
app.use(express.json());

// Rotas
app.use('/api/auth', require('./routes/auth'));
app.use('/api/os', require('./routes/os'));
app.use('/api/mecanicos', require('./routes/mecanicos'));
app.use('/api/dashboard', require('./routes/dashboard'));

// Rota de teste
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', message: 'Hidrauldiesel API rodando!' });
});

module.exports = app;
