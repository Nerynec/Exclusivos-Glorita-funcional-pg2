/* ============================================================
   EXCLUSIVOS GLORITA - Migración: agregar campo Talla
   Ejecutar UNA VEZ sobre la base de datos GloritaDB ya existente.
   No borra ni afecta los productos que ya tenés cargados.
   ============================================================ */
USE GloritaDB;
GO

IF NOT EXISTS (
    SELECT 1 FROM sys.columns
    WHERE object_id = OBJECT_ID('dbo.Productos') AND name = 'Talla'
)
BEGIN
    ALTER TABLE dbo.Productos ADD Talla NVARCHAR(20) NULL;
    PRINT 'Columna Talla agregada correctamente.';
END
ELSE
BEGIN
    PRINT 'La columna Talla ya existía, no se hizo ningún cambio.';
END
GO

/* ---------- Categorías nuevas para las líneas de producto que mencionaste ----------
   (se agregan solo si no existen ya, para no duplicar)
------------------------------------------------------------ */
INSERT INTO dbo.Categorias (Nombre, Descripcion)
SELECT v.Nombre, v.Descripcion
FROM (VALUES
    ('Camisas', 'Camisas de cuero y mixtas'),
    ('Zapatos', 'Calzado de cuero'),
    ('Botas', 'Botas de cuero'),
    ('Pantalones', 'Pantalones de cuero')
) AS v(Nombre, Descripcion)
WHERE NOT EXISTS (SELECT 1 FROM dbo.Categorias c WHERE c.Nombre = v.Nombre);
GO

PRINT 'Migración completada.';
GO

/* ---------- Productos de ejemplo con talla (opcional) ----------
   Solo se insertan si no existe ya un producto con ese código.
------------------------------------------------------------ */
INSERT INTO dbo.Productos (Codigo, Nombre, Descripcion, CategoriaId, Marca, Talla, PrecioCosto, PrecioVenta, StockActual, StockMinimo, Activo)
SELECT v.Codigo, v.Nombre, v.Descripcion,
       (SELECT CategoriaId FROM dbo.Categorias WHERE Nombre = v.CategoriaNombre),
       v.Marca, v.Talla, v.PrecioCosto, v.PrecioVenta, v.StockActual, v.StockMinimo, 1
FROM (VALUES
    ('CAM-001', 'Camisa de Cuero Clásica', 'Camisa de cuero genuino, corte recto', 'Camisas', 'Exclusivos Glorita', 'M', 220.00, 380.00, 6, 3),
    ('CAM-002', 'Camisa de Cuero Clásica', 'Camisa de cuero genuino, corte recto', 'Camisas', 'Exclusivos Glorita', 'L', 220.00, 380.00, 5, 3),
    ('ZAP-001', 'Zapato Formal de Cuero', 'Zapato formal para caballero', 'Zapatos', 'Exclusivos Glorita', '40', 180.00, 320.00, 4, 3),
    ('ZAP-002', 'Zapato Formal de Cuero', 'Zapato formal para caballero', 'Zapatos', 'Exclusivos Glorita', '42', 180.00, 320.00, 4, 3),
    ('BOT-001', 'Bota Artesanal Tolimán', 'Bota de cuero trabajada a mano', 'Botas', 'Exclusivos Glorita', '39', 260.00, 450.00, 3, 2),
    ('BOT-002', 'Bota Artesanal Tolimán', 'Bota de cuero trabajada a mano', 'Botas', 'Exclusivos Glorita', '41', 260.00, 450.00, 3, 2),
    ('PAN-001', 'Pantalón de Cuero Recto', 'Pantalón de cuero genuino', 'Pantalones', 'Exclusivos Glorita', '32', 240.00, 400.00, 3, 2),
    ('PAN-002', 'Pantalón de Cuero Recto', 'Pantalón de cuero genuino', 'Pantalones', 'Exclusivos Glorita', '34', 240.00, 400.00, 3, 2)
) AS v(Codigo, Nombre, Descripcion, CategoriaNombre, Marca, Talla, PrecioCosto, PrecioVenta, StockActual, StockMinimo)
WHERE NOT EXISTS (SELECT 1 FROM dbo.Productos p WHERE p.Codigo = v.Codigo);
GO

PRINT 'Productos de ejemplo con talla agregados (si no existían).';
