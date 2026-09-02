const bcrypt = require('bcryptjs');
const { getPool } = require('../config/db');
const { ahoraGuatemala } = require('../utils/fechaGuatemala');

// GET /api/usuarios
async function listar(req, res, next) {
  try {
    const pool = await getPool();
    const result = await pool.query(`
      SELECT u."UsuarioId", u."NombreCompleto", u."Correo", u."Activo", u."FotoUrl", u."FechaCreacion",
             r."RoleId", r."NombreRol"
      FROM "Usuarios" u
      INNER JOIN "Roles" r ON r."RoleId" = u."RoleId"
      ORDER BY u."NombreCompleto"
    `);
    return res.json(result.rows);
  } catch (err) {
    return next(err);
  }
}

// GET /api/usuarios/roles
async function listarRoles(req, res, next) {
  try {
    const pool = await getPool();
    const result = await pool.query('SELECT "RoleId", "NombreRol" FROM "Roles" ORDER BY "RoleId"');
    return res.json(result.rows);
  } catch (err) {
    return next(err);
  }
}

// POST /api/usuarios
async function crear(req, res, next) {
  try {
    const { nombreCompleto, correo, contrasena, roleId } = req.body;
    if (!nombreCompleto || !correo || !contrasena || !roleId) {
      return res.status(400).json({ mensaje: 'Todos los campos son obligatorios.' });
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(correo)) {
      return res.status(400).json({ mensaje: 'El correo electrónico no tiene un formato válido.' });
    }
    if (contrasena.length < 6) {
      return res.status(400).json({ mensaje: 'La contraseña debe tener al menos 6 caracteres.' });
    }

    const pool = await getPool();
    const existente = await pool.query('SELECT "UsuarioId" FROM "Usuarios" WHERE "Correo" = $1', [correo]);
    if (existente.rows[0]) {
      return res.status(409).json({ mensaje: 'Ya existe un usuario con ese correo.' });
    }

    const hash = await bcrypt.hash(contrasena, 10);
    const result = await pool.query(`
      INSERT INTO "Usuarios" ("NombreCompleto", "Correo", "ContrasenaHash", "RoleId", "FechaCreacion")
      VALUES ($1, $2, $3, $4, $5)
      RETURNING "UsuarioId"
    `, [nombreCompleto, correo, hash, roleId, ahoraGuatemala()]);

    return res.status(201).json({ usuarioId: result.rows[0].UsuarioId, mensaje: 'Usuario creado correctamente.' });
  } catch (err) {
    return next(err);
  }
}

// PUT /api/usuarios/:id
async function actualizar(req, res, next) {
  try {
    const { nombreCompleto, roleId, activo } = req.body;
    const pool = await getPool();

    if (parseInt(req.params.id, 10) === req.usuario.id && activo === false) {
      return res.status(400).json({ mensaje: 'No podés desactivar tu propio usuario.' });
    }

    const result = await pool.query(
      'UPDATE "Usuarios" SET "NombreCompleto" = $1, "RoleId" = $2, "Activo" = $3 WHERE "UsuarioId" = $4',
      [nombreCompleto, roleId, activo === undefined ? true : activo, req.params.id],
    );

    if (result.rowCount === 0) {
      return res.status(404).json({ mensaje: 'Usuario no encontrado.' });
    }
    return res.json({ mensaje: 'Usuario actualizado correctamente.' });
  } catch (err) {
    return next(err);
  }
}

// PUT /api/usuarios/:id/reset-password
async function resetPassword(req, res, next) {
  try {
    const { contrasenaNueva } = req.body;
    if (!contrasenaNueva || contrasenaNueva.length < 6) {
      return res.status(400).json({ mensaje: 'La contraseña debe tener al menos 6 caracteres.' });
    }
    const hash = await bcrypt.hash(contrasenaNueva, 10);
    const pool = await getPool();
    const result = await pool.query('UPDATE "Usuarios" SET "ContrasenaHash" = $1 WHERE "UsuarioId" = $2', [hash, req.params.id]);

    if (result.rowCount === 0) {
      return res.status(404).json({ mensaje: 'Usuario no encontrado.' });
    }
    return res.json({ mensaje: 'Contraseña restablecida correctamente.' });
  } catch (err) {
    return next(err);
  }
}

module.exports = { listar, listarRoles, crear, actualizar, resetPassword };
