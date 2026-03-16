const express = require('express');
const router = express.Router();
const auth = require('../middlewares/auth');
const { listarOS, buscarOS, criarOS, atualizarStatus } = require('../controllers/osController');

router.get('/', auth, listarOS);
router.get('/:id', auth, buscarOS);
router.post('/', auth, criarOS);
router.patch('/:id/status', auth, atualizarStatus);

module.exports = router;
