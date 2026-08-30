const { getPool } = require('../config/db');

async function listar(req, res, next) {
  try {
    const pool = await getPool();
    const result = await pool.query('SELECT * FROM "Categorias" ORDER BY "Nombre"');
    return res.json(result.rows);
  } catch (err) {
    return next(err);
  }
}

async function crear(req, res, next) {
  try {
    const { nombre, descripcion } = req.body;
    if (!nombre) return res.status(400).json({ mensaje: 'El nombre es obligatorio.' });

    const pool = await getPool();
    const result = await pool.query(
      'INSERT INTO "Categorias" ("Nombre", "Descripcion") VALUES ($1, $2) RETURNING "CategoriaId"',
      [nombre, descripcion || null],
    );
    return res.status(201).json({ categoriaId: result.rows[0].CategoriaId });
  } catch (err) {
    return next(err);
  }
}

// PUT /api/categorias/:id
async function actualizar(req, res, next) {
  try {
    const { nombre, descripcion } = req.body;
    if (!nombre) return res.status(400).json({ mensaje: 'El nombre es obligatorio.' });

    const pool = await getPool();
    const result = await pool.query(
      'UPDATE "Categorias" SET "Nombre" = $1, "Descripcion" = $2 WHERE "CategoriaId" = $3',
      [nombre, descripcion || null, req.params.id],
    );

    if (result.rowCount === 0) {
      return res.status(404).json({ mensaje: 'Categoría no encontrada.' });
    }
    return res.json({ mensaje: 'Categoría actualizada correctamente.' });
  } catch (err) {
    return next(err);
  }
}

// DELETE /api/categorias/:id
async function eliminar(req, res, next) {
  try {
    const pool = await getPool();
    const enUso = await pool.query('SELECT COUNT(*) AS total FROM "Productos" WHERE "CategoriaId" = $1', [req.params.id]);

    if (parseInt(enUso.rows[0].total, 10) > 0) {
      return res.status(409).json({ mensaje: 'No se puede eliminar: hay productos asignados a esta categoría.' });
    }

    const result = await pool.query('DELETE FROM "Categorias" WHERE "CategoriaId" = $1', [req.params.id]);

    if (result.rowCount === 0) {
      return res.status(404).json({ mensaje: 'Categoría no encontrada.' });
    }
    return res.json({ mensaje: 'Categoría eliminada correctamente.' });
  } catch (err) {
    return next(err);
  }
}

module.exports = { listar, crear, actualizar, eliminar };
