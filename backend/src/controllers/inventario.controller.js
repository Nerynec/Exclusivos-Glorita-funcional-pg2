const { getPool } = require('../config/db');
const { ahoraGuatemala } = require('../utils/fechaGuatemala');

// GET /api/inventario/movimientos?productoId=
async function listarMovimientos(req, res, next) {
  try {
    const { productoId } = req.query;
    const pool = await getPool();

    const valores = [];
    let where = '';
    if (productoId) {
      valores.push(productoId);
      where = 'WHERE m."ProductoId" = $1';
    }

    const result = await pool.query(`
      SELECT m."MovimientoId", m."TipoMovimiento", m."Cantidad", m."StockAnterior", m."StockNuevo",
             m."Motivo", m."FechaMovimiento", p."Nombre" AS "ProductoNombre", p."Codigo" AS "ProductoCodigo",
             u."NombreCompleto" AS "UsuarioNombre"
      FROM "MovimientosInventario" m
      INNER JOIN "Productos" p ON p."ProductoId" = m."ProductoId"
      INNER JOIN "Usuarios" u ON u."UsuarioId" = m."UsuarioId"
      ${where}
      ORDER BY m."FechaMovimiento" DESC
    `, valores);
    return res.json(result.rows);
  } catch (err) {
    return next(err);
  }
}

// POST /api/inventario/movimientos  (REQ3 - registrar entrada o salida)
async function registrarMovimiento(req, res, next) {
  const pool = await getPool();
  const client = await pool.connect();
  try {
    const { productoId, tipoMovimiento, cantidad, motivo } = req.body;

    if (!productoId || !['ENTRADA', 'SALIDA'].includes(tipoMovimiento) || !cantidad || cantidad <= 0) {
      client.release();
      return res.status(400).json({ mensaje: 'Datos de movimiento inválidos.' });
    }

    await client.query('BEGIN');

    const productoResult = await client.query('SELECT "StockActual" FROM "Productos" WHERE "ProductoId" = $1', [productoId]);
    const producto = productoResult.rows[0];
    if (!producto) {
      await client.query('ROLLBACK');
      client.release();
      return res.status(404).json({ mensaje: 'Producto no encontrado.' });
    }

    const stockAnterior = producto.StockActual;
    let stockNuevo;
    if (tipoMovimiento === 'ENTRADA') {
      stockNuevo = stockAnterior + cantidad;
    } else {
      if (cantidad > stockAnterior) {
        await client.query('ROLLBACK');
        client.release();
        return res.status(400).json({ mensaje: 'No hay suficiente stock disponible para esta salida.' });
      }
      stockNuevo = stockAnterior - cantidad;
    }

    const fecha = ahoraGuatemala();

    await client.query(`
      INSERT INTO "MovimientosInventario"
        ("ProductoId", "TipoMovimiento", "Cantidad", "StockAnterior", "StockNuevo", "Motivo", "UsuarioId", "FechaMovimiento")
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
    `, [productoId, tipoMovimiento, cantidad, stockAnterior, stockNuevo, motivo || null, req.usuario.id, fecha]);

    await client.query(
      'UPDATE "Productos" SET "StockActual" = $1, "FechaActualizacion" = $2 WHERE "ProductoId" = $3',
      [stockNuevo, fecha, productoId],
    );

    await client.query('COMMIT');
    return res.status(201).json({ mensaje: 'Movimiento registrado correctamente.', stockNuevo });
  } catch (err) {
    await client.query('ROLLBACK');
    return next(err);
  } finally {
    client.release();
  }
}

// GET /api/inventario/stock-bajo  (REQ6 - alertas de stock mínimo)
async function stockBajo(req, res, next) {
  try {
    const pool = await getPool();
    const result = await pool.query(`
      SELECT p."ProductoId", p."Codigo", p."Nombre", p."StockActual", p."StockMinimo", c."Nombre" AS "CategoriaNombre"
      FROM "Productos" p
      LEFT JOIN "Categorias" c ON c."CategoriaId" = p."CategoriaId"
      WHERE p."Activo" = true AND p."StockActual" <= p."StockMinimo"
      ORDER BY (p."StockActual" - p."StockMinimo") ASC
    `);
    return res.json(result.rows);
  } catch (err) {
    return next(err);
  }
}

module.exports = { listarMovimientos, registrarMovimiento, stockBajo };
