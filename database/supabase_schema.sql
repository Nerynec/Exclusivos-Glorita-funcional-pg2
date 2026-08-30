-- ============================================================
-- EXCLUSIVOS GLORITA - Esquema para PostgreSQL / Supabase
-- Ejecutar en el "SQL Editor" de tu proyecto de Supabase.
-- Los nombres de columnas van entre comillas dobles para mantener
-- las mayúsculas exactas (Postgres las vuelve minúsculas si no).
-- ============================================================

-- ---------- 1. ROLES ----------
CREATE TABLE "Roles" (
    "RoleId"    SERIAL PRIMARY KEY,
    "NombreRol" VARCHAR(50) NOT NULL UNIQUE
);

-- ---------- 2. USUARIOS ----------
CREATE TABLE "Usuarios" (
    "UsuarioId"      SERIAL PRIMARY KEY,
    "NombreCompleto" VARCHAR(120) NOT NULL,
    "Correo"         VARCHAR(150) NOT NULL UNIQUE,
    "ContrasenaHash" VARCHAR(255) NOT NULL,
    "RoleId"         INTEGER NOT NULL REFERENCES "Roles"("RoleId"),
    "Activo"         BOOLEAN NOT NULL DEFAULT true,
    "FotoUrl"        TEXT NULL,
    "FechaCreacion"  TIMESTAMP NOT NULL DEFAULT NOW()
);

-- ---------- 3. CATEGORIAS ----------
CREATE TABLE "Categorias" (
    "CategoriaId" SERIAL PRIMARY KEY,
    "Nombre"      VARCHAR(80) NOT NULL UNIQUE,
    "Descripcion" VARCHAR(255) NULL
);

-- ---------- 4. PRODUCTOS ----------
CREATE TABLE "Productos" (
    "ProductoId"         SERIAL PRIMARY KEY,
    "Codigo"             VARCHAR(30) NOT NULL UNIQUE,
    "Nombre"             VARCHAR(150) NOT NULL,
    "Descripcion"        VARCHAR(500) NULL,
    "CategoriaId"        INTEGER NULL REFERENCES "Categorias"("CategoriaId"),
    "Marca"              VARCHAR(80) NULL,
    "Talla"              VARCHAR(20) NULL,
    "PrecioCosto"        DECIMAL(10,2) NOT NULL DEFAULT 0,
    "PrecioVenta"        DECIMAL(10,2) NOT NULL DEFAULT 0,
    "StockActual"        INTEGER NOT NULL DEFAULT 0,
    "StockMinimo"        INTEGER NOT NULL DEFAULT 5,
    "ImagenUrl"          TEXT NULL,
    "Activo"             BOOLEAN NOT NULL DEFAULT true,
    "FechaCreacion"      TIMESTAMP NOT NULL DEFAULT NOW(),
    "FechaActualizacion" TIMESTAMP NOT NULL DEFAULT NOW()
);
CREATE INDEX "IX_Productos_Nombre" ON "Productos"("Nombre");
CREATE INDEX "IX_Productos_Marca" ON "Productos"("Marca");
CREATE INDEX "IX_Productos_Categoria" ON "Productos"("CategoriaId");

-- ---------- 5. MOVIMIENTOS DE INVENTARIO ----------
CREATE TABLE "MovimientosInventario" (
    "MovimientoId"    SERIAL PRIMARY KEY,
    "ProductoId"      INTEGER NOT NULL REFERENCES "Productos"("ProductoId"),
    "TipoMovimiento"  VARCHAR(10) NOT NULL CHECK ("TipoMovimiento" IN ('ENTRADA','SALIDA')),
    "Cantidad"        INTEGER NOT NULL CHECK ("Cantidad" > 0),
    "StockAnterior"   INTEGER NOT NULL,
    "StockNuevo"      INTEGER NOT NULL,
    "Motivo"          VARCHAR(255) NULL,
    "UsuarioId"       INTEGER NOT NULL REFERENCES "Usuarios"("UsuarioId"),
    "FechaMovimiento" TIMESTAMP NOT NULL DEFAULT NOW()
);
CREATE INDEX "IX_Movimientos_Producto" ON "MovimientosInventario"("ProductoId");
CREATE INDEX "IX_Movimientos_Fecha" ON "MovimientosInventario"("FechaMovimiento");

-- ---------- 6. VENTAS ----------
CREATE TABLE "Ventas" (
    "VentaId"       SERIAL PRIMARY KEY,
    "NumeroVenta"   VARCHAR(20) NOT NULL UNIQUE,
    "ClienteNombre" VARCHAR(150) NULL DEFAULT 'Consumidor final',
    "UsuarioId"     INTEGER NOT NULL REFERENCES "Usuarios"("UsuarioId"),
    "Subtotal"      DECIMAL(10,2) NOT NULL DEFAULT 0,
    "Total"         DECIMAL(10,2) NOT NULL DEFAULT 0,
    "Estado"        VARCHAR(20) NOT NULL DEFAULT 'COMPLETADA' CHECK ("Estado" IN ('COMPLETADA','ANULADA')),
    "FechaVenta"    TIMESTAMP NOT NULL DEFAULT NOW()
);
CREATE INDEX "IX_Ventas_Fecha" ON "Ventas"("FechaVenta");

-- ---------- 7. DETALLE DE VENTAS ----------
CREATE TABLE "DetalleVentas" (
    "DetalleVentaId" SERIAL PRIMARY KEY,
    "VentaId"        INTEGER NOT NULL REFERENCES "Ventas"("VentaId"),
    "ProductoId"     INTEGER NOT NULL REFERENCES "Productos"("ProductoId"),
    "Cantidad"       INTEGER NOT NULL CHECK ("Cantidad" > 0),
    "PrecioUnitario" DECIMAL(10,2) NOT NULL,
    "Subtotal"       DECIMAL(10,2) NOT NULL
);
CREATE INDEX "IX_DetalleVentas_Venta" ON "DetalleVentas"("VentaId");
CREATE INDEX "IX_DetalleVentas_Producto" ON "DetalleVentas"("ProductoId");

-- ============================================================
-- DATOS INICIALES
-- ============================================================
INSERT INTO "Roles" ("NombreRol") VALUES ('Administrador'), ('Empleado');

-- Usuario administrador: admin@glorita.com / Glorita2026*
INSERT INTO "Usuarios" ("NombreCompleto", "Correo", "ContrasenaHash", "RoleId", "Activo")
VALUES (
    'Administrador Glorita',
    'admin@glorita.com',
    '$2b$10$8tcKuIWOFgygQvjz6lLX9uJq7ziDHOYvbDVT9jVQXRYksQgwUq.Xq',
    (SELECT "RoleId" FROM "Roles" WHERE "NombreRol" = 'Administrador'),
    true
);

INSERT INTO "Categorias" ("Nombre", "Descripcion") VALUES
('Bolsos', 'Bolsos y carteras de cuero para dama'),
('Billeteras', 'Billeteras y monederos de cuero'),
('Cinturones', 'Cinturones de cuero para caballero y dama'),
('Mochilas', 'Mochilas y morrales de cuero'),
('Accesorios', 'Llaveros, cintos para reloj y otros accesorios de cuero'),
('Camisas', 'Camisas de cuero y mixtas'),
('Zapatos', 'Calzado de cuero'),
('Botas', 'Botas de cuero'),
('Pantalones', 'Pantalones de cuero');

INSERT INTO "Productos" ("Codigo", "Nombre", "Descripcion", "CategoriaId", "Marca", "PrecioCosto", "PrecioVenta", "StockActual", "StockMinimo", "Activo")
VALUES
('BOL-001', 'Bolso Artesanal San Lucas', 'Bolso de cuero genuino trabajado a mano, tono café oscuro', 1, 'Exclusivos Glorita', 180.00, 320.00, 12, 5, true),
('BIL-001', 'Billetera Ejecutiva Caballero', 'Billetera de cuero con compartimentos para tarjetas', 2, 'Exclusivos Glorita', 45.00, 95.00, 25, 8, true),
('CIN-001', 'Cinturón Clásico Caballero', 'Cinturón de cuero liso, hebilla metálica', 3, 'Exclusivos Glorita', 35.00, 75.00, 18, 6, true);

SELECT 'Base de datos GloritaDB (PostgreSQL/Supabase) creada correctamente.' AS resultado;
