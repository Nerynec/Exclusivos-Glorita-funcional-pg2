const express = require('express');
const ctrl = require('../controllers/inventario.controller');
const { requireAuth, requireRole } = require('../middleware/auth');

const router = express.Router();

router.use(requireAuth, requireRole('Administrador'));

router.get('/movimientos', ctrl.listarMovimientos);
router.post('/movimientos', ctrl.registrarMovimiento);
router.get('/stock-bajo', ctrl.stockBajo);

module.exports = router;
