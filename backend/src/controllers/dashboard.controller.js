const { getPool } = require('../config/db');
const { ahoraGuatemala } = require('../utils/fechaGuatemala');

// GET /api/dashboard/resumen
async function resumen(req, res, next) {
  try {
    const pool = await getPool();
    const ahora = ahoraGuatemala();

    const totales = await pool.query(`
      SELECT
        (SELECT COUNT(*) FROM "Productos" WHERE "Activo" = true) AS "TotalProductos",
        (SELECT COALESCE(SUM("StockActual"),0) FROM "Productos" WHERE "Activo" = true) AS "TotalUnidadesStock",
        (SELECT COUNT(*) FROM "Productos" WHERE "Activo" = true AND "StockActual" <= "StockMinimo") AS "ProductosStockBajo",
        (SELECT COUNT(*) FROM "Ventas" WHERE "Estado" = 'COMPLETADA' AND CAST("FechaVenta" AS DATE) = CAST($1 AS DATE)) AS "VentasHoy",
        (SELECT COALESCE(SUM("Total"),0) FROM "Ventas" WHERE "Estado" = 'COMPLETADA' AND CAST("FechaVenta" AS DATE) = CAST($1 AS DATE)) AS "MontoVentasHoy",
        (SELECT COALESCE(SUM("Total"),0) FROM "Ventas" WHERE "Estado" = 'COMPLETADA' AND EXTRACT(MONTH FROM "FechaVenta") = EXTRACT(MONTH FROM $1::timestamp) AND EXTRACT(YEAR FROM "FechaVenta") = EXTRACT(YEAR FROM $1::timestamp)) AS "MontoVentasMes"
    `, [ahora]);

    const ventasUltimos7Dias = await pool.query(`
      SELECT CAST("FechaVenta" AS DATE) AS "Fecha", COALESCE(SUM("Total"),0) AS "Monto"
      FROM "Ventas"
      WHERE "Estado" = 'COMPLETADA' AND "FechaVenta" >= (CAST($1 AS DATE) - INTERVAL '6 days')
      GROUP BY CAST("FechaVenta" AS DATE)
      ORDER BY "Fecha"
    `, [ahora]);

    const topProductos = await pool.query(`
      SELECT p."Nombre", SUM(d."Cantidad") AS "UnidadesVendidas"
      FROM "DetalleVentas" d
      INNER JOIN "Productos" p ON p."ProductoId" = d."ProductoId"
      INNER JOIN "Ventas" v ON v."VentaId" = d."VentaId" AND v."Estado" = 'COMPLETADA'
      GROUP BY p."Nombre"
      ORDER BY "UnidadesVendidas" DESC
      LIMIT 5
    `);

    const stockBajo = await pool.query(`
      SELECT "Nombre", "StockActual", "StockMinimo"
      FROM "Productos"
      WHERE "Activo" = true AND "StockActual" <= "StockMinimo"
      ORDER BY ("StockActual" - "StockMinimo") ASC
      LIMIT 5
    `);

    return res.json({
      ...totales.rows[0],
      ventasUltimos7Dias: ventasUltimos7Dias.rows,
      topProductos: topProductos.rows,
      stockBajo: stockBajo.rows,
    });
  } catch (err) {
    return next(err);
  }
}

module.exports = { resumen };
