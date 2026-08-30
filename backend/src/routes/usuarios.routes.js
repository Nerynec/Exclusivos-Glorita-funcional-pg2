const express = require('express');
const ctrl = require('../controllers/usuarios.controller');
const { requireAuth, requireRole } = require('../middleware/auth');

const router = express.Router();

router.use(requireAuth, requireRole('Administrador'));

router.get('/', ctrl.listar);
router.get('/roles', ctrl.listarRoles);
router.post('/', ctrl.crear);
router.put('/:id', ctrl.actualizar);
router.put('/:id/reset-password', ctrl.resetPassword);

module.exports = router;
