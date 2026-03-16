const express = require('express');
const router = express.Router();
const auth = require('../middlewares/auth');
const {
  listarMecanicos, buscarMecanico, criarMecanico, atualizarMecanico
} = require('../controllers/mecanicoController');

router.get('/', auth, listarMecanicos);
router.get('/:id', auth, buscarMecanico);
router.post('/', auth, criarMecanico);
router.patch('/:id', auth, atualizarMecanico);

module.exports = router;
