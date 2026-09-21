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
        -- "Stock bajo" = por debajo del mínimo pero todavía queda algo que vender.
        -- "Agotados" (StockActual = 0) se cuenta aparte porque es una urgencia
        -- distinta: ya no hay nada que ofrecer de ese producto.
        (SELECT COUNT(*) FROM "Productos" WHERE "Activo" = true AND "StockActual" > 0 AND "StockActual" <= "StockMinimo") AS "ProductosStockBajo",
        (SELECT COUNT(*) FROM "Productos" WHERE "Activo" = true AND "StockActual" = 0) AS "ProductosAgotados",
        (SELECT COUNT(*) FROM "Ventas" WHERE "Estado" = 'COMPLETADA' AND CAST("FechaVenta" AS DATE) = CAST($1 AS DATE)) AS "VentasHoy",
        (SELECT COALESCE(SUM("Total"),0) FROM "Ventas" WHERE "Estado" = 'COMPLETADA' AND CAST("FechaVenta" AS DATE) = CAST($1 AS DATE)) AS "MontoVentasHoy",
        (SELECT COALESCE(SUM("Total"),0) FROM "Ventas" WHERE "Estado" = 'COMPLETADA' AND EXTRACT(MONTH FROM "FechaVenta") = EXTRACT(MONTH FROM $1::timestamp) AND EXTRACT(YEAR FROM "FechaVenta") = EXTRACT(YEAR FROM $1::timestamp)) AS "MontoVentasMes",
        (SELECT COALESCE(SUM("Total"),0) FROM "Ventas" WHERE "Estado" = 'COMPLETADA' AND "FechaVenta" >= (date_trunc('month', $1::timestamp) - INTERVAL '1 month') AND "FechaVenta" < date_trunc('month', $1::timestamp)) AS "MontoVentasMesAnterior",
        (SELECT COALESCE(AVG("Total"),0) FROM "Ventas" WHERE "Estado" = 'COMPLETADA' AND EXTRACT(MONTH FROM "FechaVenta") = EXTRACT(MONTH FROM $1::timestamp) AND EXTRACT(YEAR FROM "FechaVenta") = EXTRACT(YEAR FROM $1::timestamp)) AS "TicketPromedioMes"
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

    // Alertas de inventario: unifica "stock bajo" y "agotado" en una sola
    // lista (antes eran dos consultas separadas) para que la tarjeta de
    // alertas muestre ambos casos y se distingan con un badge. Se ordena
    // primero por los agotados (StockActual = 0) y luego por qué tan lejos
    // están del mínimo.
    const alertasInventario = await pool.query(`
      SELECT
        "Nombre", "StockActual", "StockMinimo",
        CASE WHEN "StockActual" = 0 THEN 'Agotado' ELSE 'Bajo' END AS "TipoAlerta"
      FROM "Productos"
      WHERE "Activo" = true AND "StockActual" <= "StockMinimo"
      ORDER BY "StockActual" ASC, ("StockMinimo" - "StockActual") DESC
      LIMIT 8
    `);

    // Últimas ventas: una fila por venta, con un resumen de los productos
    // que incluyó (en vez de una fila por producto), para que la tabla se
    // pueda leer de un vistazo. El resumen y la cantidad total salen de
    // agregar sus líneas de DetalleVentas.
    const ultimasVentas = await pool.query(`
      SELECT
        v."VentaId",
        v."NumeroVenta",
        v."FechaVenta",
        v."Total",
        COALESCE(dv."CantidadTotal", 0) AS "CantidadTotal",
        COALESCE(dv."ResumenProductos", 'Sin detalle') AS "ResumenProductos"
      FROM "Ventas" v
      LEFT JOIN (
        SELECT
          d."VentaId",
          SUM(d."Cantidad") AS "CantidadTotal",
          STRING_AGG(p."Nombre", ', ' ORDER BY p."Nombre") AS "ResumenProductos"
        FROM "DetalleVentas" d
        INNER JOIN "Productos" p ON p."ProductoId" = d."ProductoId"
        GROUP BY d."VentaId"
      ) dv ON dv."VentaId" = v."VentaId"
      WHERE v."Estado" = 'COMPLETADA'
      ORDER BY v."FechaVenta" DESC
      LIMIT 8
    `);

    return res.json({
      ...totales.rows[0],
      ventasUltimos7Dias: ventasUltimos7Dias.rows,
      topProductos: topProductos.rows,
      alertasInventario: alertasInventario.rows,
      ultimasVentas: ultimasVentas.rows,
    });
  } catch (err) {
    return next(err);
  }
}

module.exports = { resumen };
