const express = require('express');
const { login, perfil, cambiarPassword, actualizarFoto } = require('../controllers/auth.controller');
const { requireAuth } = require('../middleware/auth');

const router = express.Router();

router.post('/login', login);
router.get('/perfil', requireAuth, perfil);
router.put('/password', requireAuth, cambiarPassword);
router.put('/foto', requireAuth, actualizarFoto);

module.exports = router;
