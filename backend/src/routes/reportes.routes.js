const express = require('express');
const ctrl = require('../controllers/reportes.controller');
const { requireAuth, requireRole } = require('../middleware/auth');

const router = express.Router();

router.use(requireAuth, requireRole('Administrador'));

router.get('/ventas', ctrl.reporteVentas);
router.get('/inventario', ctrl.reporteInventario);
router.get('/productos-mas-vendidos', ctrl.productosMasVendidos);

module.exports = router;
