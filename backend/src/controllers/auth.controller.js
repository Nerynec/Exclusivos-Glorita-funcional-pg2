const bcrypt = require('bcryptjs');
const { getPool } = require('../config/db');
const { firmarToken, firmarPreAuthToken } = require('../utils/jwt');
const { generarCodigo, hashCodigo, compararCodigo } = require('../utils/codigoVerificacion');
const { enviarCorreo } = require('../utils/email');

const DURACION_CODIGO_MINUTOS = 10;
const MAX_INTENTOS_CODIGO = 5;

// Oculta la mayor parte del usuario del correo, para mostrarlo en pantalla
// sin exponerlo completo (ej. "ad***@glorita.com").
function ocultarCorreo(correo) {
  const [usuario, dominio] = correo.split('@');
  const visible = usuario.slice(0, Math.min(2, usuario.length));
  return `${visible}***@${dominio}`;
}

// Genera un código de 6 dígitos, invalida cualquier código anterior sin
// usar de ese usuario, guarda el nuevo (hasheado) y lo envía por correo.
async function generarYEnviarCodigo(pool, usuario) {
  const codigo = generarCodigo();
  const hash = await hashCodigo(codigo);
  const expiraEn = new Date(Date.now() + DURACION_CODIGO_MINUTOS * 60 * 1000);

  await pool.query(
    'UPDATE "CodigosVerificacion" SET "Usado" = true WHERE "UsuarioId" = $1 AND "Usado" = false',
    [usuario.UsuarioId],
  );
  await pool.query(
    'INSERT INTO "CodigosVerificacion" ("UsuarioId", "CodigoHash", "ExpiraEn") VALUES ($1, $2, $3)',
    [usuario.UsuarioId, hash, expiraEn],
  );

  await enviarCorreo(
    usuario.Correo,
    'Tu código de verificación — Exclusivos Glorita',
    `Tu código de verificación es: ${codigo}\n\nVence en ${DURACION_CODIGO_MINUTOS} minutos. Si no intentaste iniciar sesión, ignorá este mensaje.`,
  );
}

// POST /api/auth/login
// Primer paso: valida correo y contraseña como antes, pero ya NO entrega
// la sesión completa de una vez. El doble factor de autenticación es
// obligatorio para todos los usuarios: acá se manda el código de
// verificación al correo del usuario, y la sesión real se entrega recién
// en /verificar-codigo.
async function login(req, res, next) {
  try {
    const { correo, contrasena } = req.body;
    if (!correo || !contrasena) {
      return res.status(400).json({ mensaje: 'Correo y contraseña son obligatorios.' });
    }

    const pool = await getPool();
    const result = await pool.query(
      `SELECT u."UsuarioId", u."NombreCompleto", u."Correo", u."ContrasenaHash", u."Activo", u."FotoUrl", r."NombreRol"
       FROM "Usuarios" u
       INNER JOIN "Roles" r ON r."RoleId" = u."RoleId"
       WHERE u."Correo" = $1`,
      [correo],
    );

    const usuario = result.rows[0];
    if (!usuario || !usuario.Activo) {
      return res.status(401).json({ mensaje: 'Credenciales incorrectas.' });
    }

    const passwordOk = await bcrypt.compare(contrasena, usuario.ContrasenaHash);
    if (!passwordOk) {
      return res.status(401).json({ mensaje: 'Credenciales incorrectas.' });
    }

    const preAuthToken = firmarPreAuthToken(usuario.UsuarioId);
    await generarYEnviarCodigo(pool, usuario);

    return res.json({
      requiereCodigo: true,
      preAuthToken,
      correoOculto: ocultarCorreo(usuario.Correo),
    });
  } catch (err) {
    return next(err);
  }
}

// POST /api/auth/reenviar-codigo
async function reenviarCodigo(req, res, next) {
  try {
    const pool = await getPool();
    const result = await pool.query('SELECT "UsuarioId", "Correo" FROM "Usuarios" WHERE "UsuarioId" = $1', [req.preAuth.id]);
    const usuario = result.rows[0];
    if (!usuario) {
      return res.status(404).json({ mensaje: 'Usuario no encontrado.' });
    }

    await generarYEnviarCodigo(pool, usuario);
    return res.json({ mensaje: 'Código reenviado.', correoOculto: ocultarCorreo(usuario.Correo) });
  } catch (err) {
    return next(err);
  }
}

// POST /api/auth/verificar-codigo
// Último paso: si el código de 6 dígitos coincide con el más reciente sin
// usar (y no expiró, y no se agotaron los intentos), recién ahí se firma
// el token de sesión completo, exactamente igual que el login() de antes.
async function verificarCodigo(req, res, next) {
  try {
    const { codigo } = req.body;
    if (!codigo) {
      return res.status(400).json({ mensaje: 'Ingresá el código de verificación.' });
    }

    const pool = await getPool();
    const result = await pool.query(
      `SELECT * FROM "CodigosVerificacion"
       WHERE "UsuarioId" = $1 AND "Usado" = false
       ORDER BY "FechaCreacion" DESC LIMIT 1`,
      [req.preAuth.id],
    );
    const registro = result.rows[0];

    if (!registro || new Date(registro.ExpiraEn) < new Date()) {
      return res.status(401).json({ mensaje: 'El código expiró. Solicitá uno nuevo.' });
    }

    if (registro.Intentos >= MAX_INTENTOS_CODIGO) {
      return res.status(429).json({ mensaje: 'Demasiados intentos fallidos. Solicitá un código nuevo.' });
    }

    const coincide = await compararCodigo(codigo, registro.CodigoHash);
    if (!coincide) {
      await pool.query('UPDATE "CodigosVerificacion" SET "Intentos" = "Intentos" + 1 WHERE "CodigoId" = $1', [registro.CodigoId]);
      return res.status(401).json({ mensaje: 'Código incorrecto.' });
    }

    await pool.query('UPDATE "CodigosVerificacion" SET "Usado" = true WHERE "CodigoId" = $1', [registro.CodigoId]);

    const usuarioResult = await pool.query(
      `SELECT u."UsuarioId", u."NombreCompleto", u."Correo", u."FotoUrl", r."NombreRol"
       FROM "Usuarios" u
       INNER JOIN "Roles" r ON r."RoleId" = u."RoleId"
       WHERE u."UsuarioId" = $1`,
      [req.preAuth.id],
    );
    const usuario = usuarioResult.rows[0];
    if (!usuario) {
      return res.status(404).json({ mensaje: 'Usuario no encontrado.' });
    }

    // El token JWT se mantiene liviano a propósito: nunca metemos la foto
    // (que puede pesar bastante en base64) dentro del token.
    const token = firmarToken({
      id: usuario.UsuarioId,
      nombre: usuario.NombreCompleto,
      correo: usuario.Correo,
      rol: usuario.NombreRol,
    });

    return res.json({
      token,
      usuario: {
        id: usuario.UsuarioId,
        nombre: usuario.NombreCompleto,
        correo: usuario.Correo,
        rol: usuario.NombreRol,
        fotoUrl: usuario.FotoUrl || null,
      },
    });
  } catch (err) {
    return next(err);
  }
}

// GET /api/auth/perfil
async function perfil(req, res, next) {
  try {
    const pool = await getPool();
    const result = await pool.query(
      `SELECT u."UsuarioId", u."NombreCompleto", u."Correo", u."FotoUrl", r."NombreRol"
       FROM "Usuarios" u
       INNER JOIN "Roles" r ON r."RoleId" = u."RoleId"
       WHERE u."UsuarioId" = $1`,
      [req.usuario.id],
    );
    const u = result.rows[0];
    if (!u) return res.status(404).json({ mensaje: 'Usuario no encontrado.' });

    return res.json({
      usuario: {
        id: u.UsuarioId, nombre: u.NombreCompleto, correo: u.Correo,
        rol: u.NombreRol, fotoUrl: u.FotoUrl || null,
      },
    });
  } catch (err) {
    return next(err);
  }
}

// PUT /api/auth/password
async function cambiarPassword(req, res, next) {
  try {
    const { actual, nueva } = req.body;
    if (!actual || !nueva) {
      return res.status(400).json({ mensaje: 'Debes indicar la contraseña actual y la nueva.' });
    }
    if (nueva.length < 6) {
      return res.status(400).json({ mensaje: 'La nueva contraseña debe tener al menos 6 caracteres.' });
    }

    const pool = await getPool();
    const result = await pool.query('SELECT "ContrasenaHash" FROM "Usuarios" WHERE "UsuarioId" = $1', [req.usuario.id]);
    const usuario = result.rows[0];
    if (!usuario) return res.status(404).json({ mensaje: 'Usuario no encontrado.' });

    const coincide = await bcrypt.compare(actual, usuario.ContrasenaHash);
    if (!coincide) {
      return res.status(401).json({ mensaje: 'La contraseña actual no es correcta.' });
    }

    const nuevoHash = await bcrypt.hash(nueva, 10);
    await pool.query('UPDATE "Usuarios" SET "ContrasenaHash" = $1 WHERE "UsuarioId" = $2', [nuevoHash, req.usuario.id]);

    return res.json({ mensaje: 'Contraseña actualizada correctamente.' });
  } catch (err) {
    return next(err);
  }
}

// POST /api/auth/logout
async function cerrarSesion(req, res, next) {
  try {
    const pool = await getPool();
    // Guardamos la fecha/hora actual como "punto de corte": el middleware
    // de autenticación va a rechazar cualquier token firmado ANTES de este
    // momento, aunque ese token todavía no haya expirado por su cuenta.
    // Así, el token que se estaba usando queda inválido de inmediato al
    // cerrar sesión, no solo cuando se borra del navegador.
    await pool.query('UPDATE "Usuarios" SET "TokenInvalidoDesde" = NOW() WHERE "UsuarioId" = $1', [req.usuario.id]);
    return res.json({ mensaje: 'Sesión cerrada correctamente.' });
  } catch (err) {
    return next(err);
  }
}

// PUT /api/auth/foto
async function actualizarFoto(req, res, next) {
  try {
    const { fotoBase64 } = req.body;
    if (!fotoBase64) {
      return res.status(400).json({ mensaje: 'No se recibió ninguna imagen.' });
    }
    if (!fotoBase64.startsWith('data:image/')) {
      return res.status(400).json({ mensaje: 'El archivo debe ser una imagen válida.' });
    }
    if (fotoBase64.length > 3.5 * 1024 * 1024) {
      return res.status(400).json({ mensaje: 'La imagen es demasiado grande. Probá con una foto más liviana.' });
    }

    const pool = await getPool();
    await pool.query('UPDATE "Usuarios" SET "FotoUrl" = $1 WHERE "UsuarioId" = $2', [fotoBase64, req.usuario.id]);

    return res.json({ mensaje: 'Foto de perfil actualizada correctamente.', fotoUrl: fotoBase64 });
  } catch (err) {
    return next(err);
  }
}

module.exports = {
  login, perfil, cambiarPassword, actualizarFoto, cerrarSesion,
  reenviarCodigo, verificarCodigo,
};
