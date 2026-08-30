const { getPool } = require('../config/db');
const { ahoraGuatemala } = require('../utils/fechaGuatemala');

// GET /api/ventas?desde=&hasta=
async function listar(req, res, next) {
  try {
    const { desde, hasta } = req.query;
    const pool = await getPool();

    const valores = [];
    let where = 'WHERE 1=1';
    if (desde) {
      valores.push(new Date(desde));
      where += ` AND v."FechaVenta" >= $${valores.length}`;
    }
    if (hasta) {
      valores.push(new Date(`${hasta}T23:59:59Z`));
      where += ` AND v."FechaVenta" <= $${valores.length}`;
    }

    const result = await pool.query(`
      SELECT v."VentaId", v."NumeroVenta", v."ClienteNombre", v."Subtotal", v."Total", v."Estado", v."FechaVenta",
             u."NombreCompleto" AS "VendedorNombre"
      FROM "Ventas" v
      INNER JOIN "Usuarios" u ON u."UsuarioId" = v."UsuarioId"
      ${where}
      ORDER BY v."FechaVenta" DESC
    `, valores);
    return res.json(result.rows);
  } catch (err) {
    return next(err);
  }
}

async function obtener(req, res, next) {
  try {
    const pool = await getPool();
    const venta = await pool.query(`
      SELECT v.*, u."NombreCompleto" AS "VendedorNombre"
      FROM "Ventas" v
      INNER JOIN "Usuarios" u ON u."UsuarioId" = v."UsuarioId"
      WHERE v."VentaId" = $1
    `, [req.params.id]);
    if (!venta.rows[0]) return res.status(404).json({ mensaje: 'Venta no encontrada.' });

    const detalle = await pool.query(`
      SELECT d.*, p."Nombre" AS "ProductoNombre", p."Codigo" AS "ProductoCodigo", p."Talla" AS "ProductoTalla"
      FROM "DetalleVentas" d
      INNER JOIN "Productos" p ON p."ProductoId" = d."ProductoId"
      WHERE d."VentaId" = $1
    `, [req.params.id]);

    return res.json({ ...venta.rows[0], detalle: detalle.rows });
  } catch (err) {
    return next(err);
  }
}

// POST /api/ventas  (REQ4 - registrar venta; body: { clienteNombre, items: [{productoId, cantidad}] })
async function crear(req, res, next) {
  const pool = await getPool();
  const client = await pool.connect();
  try {
    const { clienteNombre, items } = req.body;

    if (!Array.isArray(items) || items.length === 0) {
      client.release();
      return res.status(400).json({ mensaje: 'La venta debe incluir al menos un producto.' });
    }

    await client.query('BEGIN');
    const ahora = ahoraGuatemala();

    let subtotal = 0;
    const detalleCalculado = [];

    for (const item of items) {
      const prodResult = await client.query(
        'SELECT "ProductoId", "Nombre", "PrecioVenta", "StockActual" FROM "Productos" WHERE "ProductoId" = $1 AND "Activo" = true',
        [item.productoId],
      );
      const producto = prodResult.rows[0];
      if (!producto) {
        await client.query('ROLLBACK');
        return res.status(404).json({ mensaje: `Producto con id ${item.productoId} no encontrado.` });
      }
      if (item.cantidad <= 0 || item.cantidad > producto.StockActual) {
        await client.query('ROLLBACK');
        return res.status(400).json({ mensaje: `Stock insuficiente para "${producto.Nombre}".` });
      }

      const lineaSubtotal = producto.PrecioVenta * item.cantidad;
      subtotal += lineaSubtotal;
      detalleCalculado.push({
        productoId: producto.ProductoId,
        cantidad: item.cantidad,
        precioUnitario: producto.PrecioVenta,
        subtotal: lineaSubtotal,
        stockActual: producto.StockActual,
      });
    }

    const total = subtotal;
    const numeroVenta = `V-${Date.now()}`;

    const ventaResult = await client.query(`
      INSERT INTO "Ventas" ("NumeroVenta", "ClienteNombre", "UsuarioId", "Subtotal", "Total", "FechaVenta")
      VALUES ($1, $2, $3, $4, $5, $6)
      RETURNING "VentaId"
    `, [numeroVenta, clienteNombre || 'Consumidor final', req.usuario.id, subtotal, total, ahora]);
    const ventaId = ventaResult.rows[0].VentaId;

    for (const linea of detalleCalculado) {
      await client.query(`
        INSERT INTO "DetalleVentas" ("VentaId", "ProductoId", "Cantidad", "PrecioUnitario", "Subtotal")
        VALUES ($1, $2, $3, $4, $5)
      `, [ventaId, linea.productoId, linea.cantidad, linea.precioUnitario, linea.subtotal]);

      const stockNuevo = linea.stockActual - linea.cantidad;
      await client.query(
        'UPDATE "Productos" SET "StockActual" = $1, "FechaActualizacion" = $2 WHERE "ProductoId" = $3',
        [stockNuevo, ahora, linea.productoId],
      );

      await client.query(`
        INSERT INTO "MovimientosInventario"
          ("ProductoId", "TipoMovimiento", "Cantidad", "StockAnterior", "StockNuevo", "Motivo", "UsuarioId", "FechaMovimiento")
        VALUES ($1, 'SALIDA', $2, $3, $4, $5, $6, $7)
      `, [linea.productoId, linea.cantidad, linea.stockActual, stockNuevo, `Venta ${numeroVenta}`, req.usuario.id, ahora]);
    }

    await client.query('COMMIT');
    return res.status(201).json({ ventaId, numeroVenta, total, mensaje: 'Venta registrada correctamente.' });
  } catch (err) {
    await client.query('ROLLBACK');
    return next(err);
  } finally {
    client.release();
  }
}

// POST /api/ventas/:id/anular  (revierte el stock y marca la venta como ANULADA)
async function anular(req, res, next) {
  const pool = await getPool();
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    const ahora = ahoraGuatemala();

    const ventaResult = await client.query('SELECT "VentaId", "NumeroVenta", "Estado" FROM "Ventas" WHERE "VentaId" = $1', [req.params.id]);
    const venta = ventaResult.rows[0];
    if (!venta) {
      await client.query('ROLLBACK');
      return res.status(404).json({ mensaje: 'Venta no encontrada.' });
    }
    if (venta.Estado === 'ANULADA') {
      await client.query('ROLLBACK');
      return res.status(400).json({ mensaje: 'Esta venta ya estaba anulada.' });
    }

    const detalle = await client.query('SELECT "ProductoId", "Cantidad" FROM "DetalleVentas" WHERE "VentaId" = $1', [req.params.id]);

    for (const linea of detalle.rows) {
      const prodResult = await client.query('SELECT "StockActual" FROM "Productos" WHERE "ProductoId" = $1', [linea.ProductoId]);
      const stockAnterior = prodResult.rows[0].StockActual;
      const stockNuevo = stockAnterior + linea.Cantidad;

      await client.query(
        'UPDATE "Productos" SET "StockActual" = $1, "FechaActualizacion" = $2 WHERE "ProductoId" = $3',
        [stockNuevo, ahora, linea.ProductoId],
      );

      await client.query(`
        INSERT INTO "MovimientosInventario"
          ("ProductoId", "TipoMovimiento", "Cantidad", "StockAnterior", "StockNuevo", "Motivo", "UsuarioId", "FechaMovimiento")
        VALUES ($1, 'ENTRADA', $2, $3, $4, $5, $6, $7)
      `, [linea.ProductoId, linea.Cantidad, stockAnterior, stockNuevo, `Anulación de venta ${venta.NumeroVenta}`, req.usuario.id, ahora]);
    }

    await client.query("UPDATE \"Ventas\" SET \"Estado\" = 'ANULADA' WHERE \"VentaId\" = $1", [req.params.id]);

    await client.query('COMMIT');
    return res.json({ mensaje: 'Venta anulada y stock restituido correctamente.' });
  } catch (err) {
    await client.query('ROLLBACK');
    return next(err);
  } finally {
    client.release();
  }
}

module.exports = { listar, obtener, crear, anular };
