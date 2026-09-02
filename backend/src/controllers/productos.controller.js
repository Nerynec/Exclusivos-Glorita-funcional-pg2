const { getPool } = require('../config/db');
const { ahoraGuatemala } = require('../utils/fechaGuatemala');

// GET /api/productos?buscar=&categoria=&marca=&talla=  (REQ7 - Búsqueda de productos)
async function listar(req, res, next) {
  try {
    const { buscar, categoria, marca, talla } = req.query;
    const pool = await getPool();

    const valores = [];
    let where = 'WHERE p."Activo" = true';

    if (buscar) {
      valores.push(`%${buscar}%`);
      const idx = valores.length;
      // ILIKE = LIKE insensible a mayúsculas (equivalente al comportamiento
      // por defecto de SQL Server con LIKE).
      where += ` AND (p."Nombre" ILIKE $${idx} OR p."Codigo" ILIKE $${idx} OR p."Marca" ILIKE $${idx} OR p."Talla" ILIKE $${idx})`;
    }
    if (categoria) {
      valores.push(parseInt(categoria, 10));
      where += ` AND p."CategoriaId" = $${valores.length}`;
    }
    if (marca) {
      valores.push(`%${marca}%`);
      where += ` AND p."Marca" ILIKE $${valores.length}`;
    }
    if (talla) {
      valores.push(talla);
      where += ` AND p."Talla" = $${valores.length}`;
    }

    const result = await pool.query(`
      SELECT p."ProductoId", p."Codigo", p."Nombre", p."Descripcion", p."Marca", p."Talla",
             p."PrecioCosto", p."PrecioVenta", p."StockActual", p."StockMinimo",
             p."ImagenUrl", p."CategoriaId", c."Nombre" AS "CategoriaNombre",
             CASE WHEN p."StockActual" <= p."StockMinimo" THEN true ELSE false END AS "StockBajo"
      FROM "Productos" p
      LEFT JOIN "Categorias" c ON c."CategoriaId" = p."CategoriaId"
      ${where}
      ORDER BY p."Nombre"
    `, valores);

    return res.json(result.rows);
  } catch (err) {
    return next(err);
  }
}

async function obtener(req, res, next) {
  try {
    const pool = await getPool();
    const result = await pool.query(`
      SELECT p.*, c."Nombre" AS "CategoriaNombre"
      FROM "Productos" p
      LEFT JOIN "Categorias" c ON c."CategoriaId" = p."CategoriaId"
      WHERE p."ProductoId" = $1
    `, [req.params.id]);

    if (!result.rows[0]) {
      return res.status(404).json({ mensaje: 'Producto no encontrado.' });
    }
    return res.json(result.rows[0]);
  } catch (err) {
    return next(err);
  }
}

// POST /api/productos  (REQ1 - crear)
async function crear(req, res, next) {
  try {
    const {
      codigo, nombre, descripcion, categoriaId, marca, talla,
      precioCosto, precioVenta, stockActual, stockMinimo, imagenUrl,
    } = req.body;

    if (!codigo || !nombre) {
      return res.status(400).json({ mensaje: 'Código y nombre son obligatorios.' });
    }
    if ((precioCosto && precioCosto < 0) || (precioVenta && precioVenta < 0) || (stockActual && stockActual < 0) || (stockMinimo && stockMinimo < 0)) {
      return res.status(400).json({ mensaje: 'Los precios y las cantidades no pueden ser negativos.' });
    }

    const pool = await getPool();

    const existente = await pool.query('SELECT "ProductoId" FROM "Productos" WHERE "Codigo" = $1', [codigo]);
    if (existente.rows[0]) {
      return res.status(409).json({ mensaje: 'Ya existe un producto con ese código.' });
    }

    const fecha = ahoraGuatemala();
    const result = await pool.query(`
      INSERT INTO "Productos"
        ("Codigo", "Nombre", "Descripcion", "CategoriaId", "Marca", "Talla", "PrecioCosto", "PrecioVenta", "StockActual", "StockMinimo", "ImagenUrl", "FechaCreacion", "FechaActualizacion")
      VALUES
        ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $12)
      RETURNING "ProductoId"
    `, [
      codigo, nombre, descripcion || null, categoriaId || null, marca || null, talla || null,
      precioCosto || 0, precioVenta || 0, stockActual || 0, stockMinimo || 5, imagenUrl || null, fecha,
    ]);

    return res.status(201).json({ productoId: result.rows[0].ProductoId, mensaje: 'Producto creado correctamente.' });
  } catch (err) {
    return next(err);
  }
}

// PUT /api/productos/:id  (REQ1 - editar)
async function actualizar(req, res, next) {
  try {
    const {
      nombre, descripcion, categoriaId, marca, talla,
      precioCosto, precioVenta, stockMinimo, imagenUrl, activo,
    } = req.body;

    if ((precioCosto && precioCosto < 0) || (precioVenta && precioVenta < 0) || (stockMinimo && stockMinimo < 0)) {
      return res.status(400).json({ mensaje: 'Los precios y las cantidades no pueden ser negativos.' });
    }

    const pool = await getPool();
    const result = await pool.query(`
      UPDATE "Productos" SET
        "Nombre" = $1,
        "Descripcion" = $2,
        "CategoriaId" = $3,
        "Marca" = $4,
        "Talla" = $5,
        "PrecioCosto" = $6,
        "PrecioVenta" = $7,
        "StockMinimo" = $8,
        "ImagenUrl" = $9,
        "Activo" = $10,
        "FechaActualizacion" = $11
      WHERE "ProductoId" = $12
    `, [
      nombre, descripcion || null, categoriaId || null, marca || null, talla || null,
      precioCosto || 0, precioVenta || 0, stockMinimo || 5, imagenUrl || null,
      activo === undefined ? true : activo, ahoraGuatemala(), req.params.id,
    ]);

    if (result.rowCount === 0) {
      return res.status(404).json({ mensaje: 'Producto no encontrado.' });
    }
    return res.json({ mensaje: 'Producto actualizado correctamente.' });
  } catch (err) {
    return next(err);
  }
}

// DELETE /api/productos/:id  (REQ1 - eliminar, con protección si tiene movimientos)
async function eliminar(req, res, next) {
  try {
    const pool = await getPool();
    const id = req.params.id;

    const movimientos = await pool.query('SELECT COUNT(*) AS total FROM "MovimientosInventario" WHERE "ProductoId" = $1', [id]);
    const ventas = await pool.query('SELECT COUNT(*) AS total FROM "DetalleVentas" WHERE "ProductoId" = $1', [id]);

    if (parseInt(movimientos.rows[0].total, 10) > 0 || parseInt(ventas.rows[0].total, 10) > 0) {
      // Si el producto ya tiene historial, se desactiva en vez de borrarlo (soft delete)
      await pool.query('UPDATE "Productos" SET "Activo" = false WHERE "ProductoId" = $1', [id]);
      return res.json({ mensaje: 'El producto tiene movimientos asociados; se desactivó en lugar de eliminarse.' });
    }

    const result = await pool.query('DELETE FROM "Productos" WHERE "ProductoId" = $1', [id]);

    if (result.rowCount === 0) {
      return res.status(404).json({ mensaje: 'Producto no encontrado.' });
    }
    return res.json({ mensaje: 'Producto eliminado correctamente.' });
  } catch (err) {
    return next(err);
  }
}

module.exports = { listar, obtener, crear, actualizar, eliminar };
