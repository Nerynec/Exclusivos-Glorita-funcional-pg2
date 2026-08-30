const express = require('express');
const ctrl = require('../controllers/ventas.controller');
const { requireAuth, requireRole } = require('../middleware/auth');

const router = express.Router();

router.use(requireAuth);

router.get('/', ctrl.listar);
router.get('/:id', ctrl.obtener);
router.post('/', ctrl.crear);
router.post('/:id/anular', requireRole('Administrador'), ctrl.anular);

module.exports = router;
