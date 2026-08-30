const { getPool } = require('../config/db');

// GET /api/reportes/ventas?desde=&hasta=
async function reporteVentas(req, res, next) {
  try {
    const { desde, hasta } = req.query;
    const pool = await getPool();

    const valores = [];
    let where = "WHERE v.\"Estado\" = 'COMPLETADA'";
    if (desde) {
      valores.push(new Date(desde));
      where += ` AND v."FechaVenta" >= $${valores.length}`;
    }
    if (hasta) {
      valores.push(new Date(`${hasta}T23:59:59Z`));
      where += ` AND v."FechaVenta" <= $${valores.length}`;
    }

    const resumen = await pool.query(`
      SELECT COUNT(*) AS "TotalVentas", COALESCE(SUM(v."Total"), 0) AS "MontoTotal",
             COALESCE(AVG(v."Total"), 0) AS "TicketPromedio"
      FROM "Ventas" v
      ${where}
    `, valores);

    const porDia = await pool.query(`
      SELECT CAST(v."FechaVenta" AS DATE) AS "Fecha", COUNT(*) AS "CantidadVentas", SUM(v."Total") AS "MontoDia"
      FROM "Ventas" v
      ${where}
      GROUP BY CAST(v."FechaVenta" AS DATE)
      ORDER BY "Fecha"
    `, valores);

    return res.json({ resumen: resumen.rows[0], porDia: porDia.rows });
  } catch (err) {
    return next(err);
  }
}

// GET /api/reportes/inventario
async function reporteInventario(req, res, next) {
  try {
    const pool = await getPool();
    const result = await pool.query(`
      SELECT p."Codigo", p."Nombre", c."Nombre" AS "Categoria", p."Talla", p."StockActual", p."StockMinimo",
             p."PrecioCosto", p."PrecioVenta", (p."StockActual" * p."PrecioCosto") AS "ValorInventarioCosto"
      FROM "Productos" p
      LEFT JOIN "Categorias" c ON c."CategoriaId" = p."CategoriaId"
      WHERE p."Activo" = true
      ORDER BY p."Nombre"
    `);
    const valorTotal = result.rows.reduce((acc, r) => acc + Number(r.ValorInventarioCosto), 0);
    return res.json({ productos: result.rows, valorTotalInventario: valorTotal });
  } catch (err) {
    return next(err);
  }
}

// GET /api/reportes/productos-mas-vendidos?limite=10
async function productosMasVendidos(req, res, next) {
  try {
    const limite = parseInt(req.query.limite || '10', 10);
    const pool = await getPool();
    const result = await pool.query(`
      SELECT p."ProductoId", p."Codigo", p."Nombre",
             SUM(d."Cantidad") AS "UnidadesVendidas", SUM(d."Subtotal") AS "TotalVendido"
      FROM "DetalleVentas" d
      INNER JOIN "Productos" p ON p."ProductoId" = d."ProductoId"
      INNER JOIN "Ventas" v ON v."VentaId" = d."VentaId" AND v."Estado" = 'COMPLETADA'
      GROUP BY p."ProductoId", p."Codigo", p."Nombre"
      ORDER BY "UnidadesVendidas" DESC
      LIMIT $1
    `, [limite]);
    return res.json(result.rows);
  } catch (err) {
    return next(err);
  }
}

module.exports = { reporteVentas, reporteInventario, productosMasVendidos };
