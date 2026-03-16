const express = require('express');
const router = express.Router();
const { login, criarUsuario } = require('../controllers/authController');
const authMiddleware = require('../middlewares/auth');

router.post('/login', login);
router.post('/usuarios', authMiddleware, criarUsuario);

module.exports = router;
