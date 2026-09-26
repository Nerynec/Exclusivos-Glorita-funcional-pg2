const crypto = require('crypto');
const jwt = require('jsonwebtoken');

function firmarToken(payload) {
  return jwt.sign(payload, process.env.JWT_SECRET, {
    // Sesión corta a propósito: cada token dura poco tiempo, así que si
    // alguien queda con la sesión abierta o el token se filtra, deja de
    // servir rápido.
    expiresIn: process.env.JWT_EXPIRES_IN || '2m',
    // "jti" (JWT ID) es un identificador aleatorio único por token. Sin
    // esto, dos inicios de sesión del mismo usuario en el mismo segundo
    // podían generar un token IDÉNTICO (mismo payload + mismo "iat"). Con
    // "jti" cada inicio de sesión siempre produce un token distinto.
    jwtid: crypto.randomUUID(),
  });
}

function verificarToken(token) {
  return jwt.verify(token, process.env.JWT_SECRET);
}

// Token de "pre-autenticación" para el segundo factor (2FA): certifica que
// el correo y la contraseña ya fueron validados, pero todavía falta el
// código de verificación. Dura poco (10 minutos) y solo sirve para los
// endpoints de 2FA (registrar teléfono, reenviar código, verificar
// código) — nunca para el resto de la API, gracias al claim "tipo".
function firmarPreAuthToken(usuarioId) {
  return jwt.sign({ id: usuarioId, tipo: 'pre2fa' }, process.env.JWT_SECRET, {
    expiresIn: '10m',
    jwtid: crypto.randomUUID(),
  });
}

module.exports = { firmarToken, verificarToken, firmarPreAuthToken };
