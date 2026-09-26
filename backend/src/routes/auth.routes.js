const express = require('express');
const {
  login, perfil, cambiarPassword, actualizarFoto, cerrarSesion,
  reenviarCodigo, verificarCodigo,
} = require('../controllers/auth.controller');
const { requireAuth, requierePreAuth } = require('../middleware/auth');

const router = express.Router();

router.post('/login', login);

// Pasos del segundo factor de autenticación (2FA): usan el token "pre2fa"
// que entrega /login, no el token de sesión normal.
router.post('/reenviar-codigo', requierePreAuth, reenviarCodigo);
router.post('/verificar-codigo', requierePreAuth, verificarCodigo);

router.post('/logout', requireAuth, cerrarSesion);
router.get('/perfil', requireAuth, perfil);
router.put('/password', requireAuth, cambiarPassword);
router.put('/foto', requireAuth, actualizarFoto);

module.exports = router;
