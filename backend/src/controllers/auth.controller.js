const bcrypt = require('bcryptjs');
const { getPool } = require('../config/db');
const { firmarToken } = require('../utils/jwt');

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

module.exports = { login, perfil, cambiarPassword, actualizarFoto };
