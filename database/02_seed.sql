/* ============================================================
   EXCLUSIVOS GLORITA - Datos iniciales (seed)
   Ejecutar DESPUÉS de 01_schema.sql
   ============================================================ */
USE GloritaDB;
GO

/* ---------- Roles ---------- */
INSERT INTO dbo.Roles (NombreRol) VALUES ('Administrador'), ('Empleado');
GO

/* ---------- Usuario administrador por defecto ----------
   Correo:     admin@glorita.com
   Contraseña: Glorita2026*
   (cámbiala apenas inicies sesión por primera vez)
------------------------------------------------------------ */
INSERT INTO dbo.Usuarios (NombreCompleto, Correo, ContrasenaHash, RoleId, Activo)
VALUES (
    'Administrador Glorita',
    'admin@glorita.com',
    '$2b$10$8tcKuIWOFgygQvjz6lLX9uJq7ziDHOYvbDVT9jVQXRYksQgwUq.Xq',
    (SELECT RoleId FROM dbo.Roles WHERE NombreRol = 'Administrador'),
    1
);
GO

/* ---------- Categorías ---------- */
INSERT INTO dbo.Categorias (Nombre, Descripcion) VALUES
('Bolsos', 'Bolsos y carteras de cuero para dama'),
('Billeteras', 'Billeteras y monederos de cuero'),
('Cinturones', 'Cinturones de cuero para caballero y dama'),
('Mochilas', 'Mochilas y morrales de cuero'),
('Accesorios', 'Llaveros, cintos para reloj y otros accesorios de cuero');
GO

/* ---------- Productos de ejemplo ---------- */
INSERT INTO dbo.Productos (Codigo, Nombre, Descripcion, CategoriaId, Marca, PrecioCosto, PrecioVenta, StockActual, StockMinimo, Activo)
VALUES
('BOL-001', 'Bolso Artesanal San Lucas', 'Bolso de cuero genuino trabajado a mano, tono café oscuro', 1, 'Exclusivos Glorita', 180.00, 320.00, 12, 5, 1),
('BOL-002', 'Bolso Tote Clásico',       'Bolso tipo tote grande, ideal para uso diario', 1, 'Exclusivos Glorita', 150.00, 275.00, 4, 5, 1),
('BIL-001', 'Billetera Ejecutiva Caballero', 'Billetera de cuero con compartimentos para tarjetas', 2, 'Exclusivos Glorita', 45.00, 95.00, 25, 8, 1),
('BIL-002', 'Billetera Dama Plegable', 'Billetera plegable con broche, varios colores', 2, 'Exclusivos Glorita', 40.00, 85.00, 3, 8, 1),
('CIN-001', 'Cinturón Clásico Caballero', 'Cinturón de cuero liso, hebilla metálica', 3, 'Exclusivos Glorita', 35.00, 75.00, 18, 6, 1),
('CIN-002', 'Cinturón Trenzado', 'Cinturón de cuero trenzado a mano', 3, 'Exclusivos Glorita', 38.00, 80.00, 9, 6, 1),
('MOC-001', 'Mochila Viajera Grande', 'Mochila de cuero con múltiples compartimentos', 4, 'Exclusivos Glorita', 220.00, 400.00, 6, 4, 1),
('MOC-002', 'Morral Tolimán', 'Morral pequeño de cuero, estilo artesanal', 4, 'Exclusivos Glorita', 95.00, 180.00, 2, 4, 1),
('ACC-001', 'Llavero de Cuero Grabado', 'Llavero artesanal con grabado personalizado', 5, 'Exclusivos Glorita', 8.00, 20.00, 40, 10, 1),
('ACC-002', 'Correa para Reloj de Cuero', 'Correa de cuero genuino, 20mm', 5, 'Exclusivos Glorita', 12.00, 30.00, 15, 10, 1);
GO

PRINT 'Datos iniciales insertados correctamente.';
