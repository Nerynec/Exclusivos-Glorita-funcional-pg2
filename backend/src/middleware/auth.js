const { verificarToken } = require('../utils/jwt');

/**
 * Verifica que la petición traiga un token JWT válido en el header
 * Authorization: Bearer <token>. Si es válido, agrega req.usuario.
 */
function requireAuth(req, res, next) {
  const header = req.headers.authorization || '';
  const [tipo, token] = header.split(' ');

  if (tipo !== 'Bearer' || !token) {
    return res.status(401).json({ mensaje: 'No autenticado. Inicia sesión nuevamente.' });
  }

  try {
    req.usuario = verificarToken(token);
    return next();
  } catch (err) {
    return res.status(401).json({ mensaje: 'Sesión inválida o expirada.' });
  }
}

/**
 * Restringe el acceso a ciertos roles. Uso: requireRole('Administrador')
 */
function requireRole(...rolesPermitidos) {
  return (req, res, next) => {
    if (!req.usuario || !rolesPermitidos.includes(req.usuario.rol)) {
      return res.status(403).json({ mensaje: 'No tienes permisos para esta acción.' });
    }
    return next();
  };
}

module.exports = { requireAuth, requireRole };
