const { verificarToken } = require('../utils/jwt');
const { getPool } = require('../config/db');

async function requireAuth(req, res, next) {
  const header = req.headers.authorization || '';
  const [tipo, token] = header.split(' ');

  if (tipo !== 'Bearer' || !token) {
    return res.status(401).json({ mensaje: 'No autenticado. Inicia sesión nuevamente.' });
  }

  try {
    const payload = verificarToken(token);

    // Un JWT normal no se puede "borrar" del lado del servidor: sigue
    // siendo válido hasta que expira, aunque el usuario haya cerrado
    // sesión. Para que cerrar sesión sí invalide el token de inmediato,
    // comparamos la fecha en que se firmó este token ("iat") contra la
    // marca de "cerrar sesión" guardada en la base de datos. Si el token
    // se firmó ANTES de esa marca, se rechaza aunque todavía no expire.
    const pool = await getPool();
    const result = await pool.query(
      'SELECT "TokenInvalidoDesde", "Activo" FROM "Usuarios" WHERE "UsuarioId" = $1',
      [payload.id],
    );
    const usuario = result.rows[0];

    if (!usuario || !usuario.Activo) {
      return res.status(401).json({ mensaje: 'Sesión inválida o expirada.' });
    }

    if (usuario.TokenInvalidoDesde) {
      const tokenEmitidoEn = payload.iat * 1000; // "iat" viene en segundos
      const invalidoDesde = new Date(usuario.TokenInvalidoDesde).getTime();
      if (tokenEmitidoEn < invalidoDesde) {
        return res.status(401).json({ mensaje: 'Sesión inválida o expirada.' });
      }
    }

    req.usuario = payload;
    return next();
  } catch (err) {
    return res.status(401).json({ mensaje: 'Sesión inválida o expirada.' });
  }
}

function requireRole(...rolesPermitidos) {
  return (req, res, next) => {
    if (!req.usuario || !rolesPermitidos.includes(req.usuario.rol)) {
      return res.status(403).json({ mensaje: 'No tienes permisos para esta acción.' });
    }
    return next();
  };
}

// Middleware para los pasos intermedios del login en dos pasos (2FA):
// registrar teléfono, reenviar código y verificar código. Estos pasos NO
// usan el token de sesión normal (todavía no se completó el login), sino
// un token "pre2fa" de vida corta que solo certifica que la contraseña ya
// fue validada. Nunca sirve para acceder al resto de la API.
function requierePreAuth(req, res, next) {
  const header = req.headers.authorization || '';
  const [tipo, token] = header.split(' ');

  if (tipo !== 'Bearer' || !token) {
    return res.status(401).json({ mensaje: 'Falta el token de verificación. Iniciá sesión de nuevo.' });
  }

  try {
    const payload = verificarToken(token);
    if (payload.tipo !== 'pre2fa') {
      return res.status(401).json({ mensaje: 'Token inválido para esta operación.' });
    }
    req.preAuth = payload;
    return next();
  } catch (err) {
    return res.status(401).json({ mensaje: 'Tu sesión de verificación expiró. Iniciá sesión de nuevo.' });
  }
}

module.exports = { requireAuth, requireRole, requierePreAuth };
