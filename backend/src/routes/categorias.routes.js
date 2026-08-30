const express = require('express');
const ctrl = require('../controllers/categorias.controller');
const { requireAuth, requireRole } = require('../middleware/auth');

const router = express.Router();

router.use(requireAuth);

router.get('/', ctrl.listar);
router.post('/', requireRole('Administrador'), ctrl.crear);
router.put('/:id', requireRole('Administrador'), ctrl.actualizar);
router.delete('/:id', requireRole('Administrador'), ctrl.eliminar);

module.exports = router;
