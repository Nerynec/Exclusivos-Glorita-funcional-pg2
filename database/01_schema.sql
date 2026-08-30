/* ============================================================
   EXCLUSIVOS GLORITA - Sistema Web de Gestión
   Script de creación de base de datos - SQL Server
   ============================================================
   Ejecutar en SQL Server Management Studio (SSMS) o Azure Data
   Studio conectado a tu instancia de SQL Server / SQL Server
   Express / Azure SQL.
   ============================================================ */

IF DB_ID('GloritaDB') IS NULL
BEGIN
    CREATE DATABASE GloritaDB;
END
GO

USE GloritaDB;
GO

/* ------------------------------------------------------------
   1. ROLES
   ------------------------------------------------------------ */
IF OBJECT_ID('dbo.Roles', 'U') IS NOT NULL DROP TABLE dbo.Roles;
GO
CREATE TABLE dbo.Roles (
    RoleId          INT IDENTITY(1,1) PRIMARY KEY,
    NombreRol       NVARCHAR(50) NOT NULL UNIQUE
);
GO

/* ------------------------------------------------------------
   2. USUARIOS  (autenticación por roles - Administrador / Empleado)
   ------------------------------------------------------------ */
IF OBJECT_ID('dbo.Usuarios', 'U') IS NOT NULL DROP TABLE dbo.Usuarios;
GO
CREATE TABLE dbo.Usuarios (
    UsuarioId       INT IDENTITY(1,1) PRIMARY KEY,
    NombreCompleto  NVARCHAR(120) NOT NULL,
    Correo          NVARCHAR(150) NOT NULL UNIQUE,
    ContrasenaHash  NVARCHAR(255) NOT NULL,       -- hash bcrypt, nunca texto plano
    RoleId          INT NOT NULL FOREIGN KEY REFERENCES dbo.Roles(RoleId),
    Activo          BIT NOT NULL DEFAULT 1,
    FechaCreacion   DATETIME2 NOT NULL DEFAULT SYSDATETIME()
);
GO

/* ------------------------------------------------------------
   3. CATEGORIAS DE PRODUCTO
   ------------------------------------------------------------ */
IF OBJECT_ID('dbo.Categorias', 'U') IS NOT NULL DROP TABLE dbo.Categorias;
GO
CREATE TABLE dbo.Categorias (
    CategoriaId     INT IDENTITY(1,1) PRIMARY KEY,
    Nombre          NVARCHAR(80) NOT NULL UNIQUE,
    Descripcion     NVARCHAR(255) NULL
);
GO

/* ------------------------------------------------------------
   4. PRODUCTOS  (REQ1 - Administración de productos)
   ------------------------------------------------------------ */
IF OBJECT_ID('dbo.Productos', 'U') IS NOT NULL DROP TABLE dbo.Productos;
GO
CREATE TABLE dbo.Productos (
    ProductoId      INT IDENTITY(1,1) PRIMARY KEY,
    Codigo          NVARCHAR(30) NOT NULL UNIQUE,      -- código único de producto
    Nombre          NVARCHAR(150) NOT NULL,
    Descripcion     NVARCHAR(500) NULL,
    CategoriaId     INT NULL FOREIGN KEY REFERENCES dbo.Categorias(CategoriaId),
    Marca           NVARCHAR(80) NULL,
    Talla           NVARCHAR(20) NULL,                 -- talla/medida (ej. "M", "32", "42") — libre porque varía según el tipo de producto
    PrecioCosto     DECIMAL(10,2) NOT NULL DEFAULT 0,
    PrecioVenta     DECIMAL(10,2) NOT NULL DEFAULT 0,
    StockActual     INT NOT NULL DEFAULT 0,
    StockMinimo     INT NOT NULL DEFAULT 5,            -- umbral para REQ6 (alertas)
    ImagenUrl       NVARCHAR(MAX) NULL,                -- puede ser un link o una foto subida (base64)
    Activo          BIT NOT NULL DEFAULT 1,
    FechaCreacion   DATETIME2 NOT NULL DEFAULT SYSDATETIME(),
    FechaActualizacion DATETIME2 NOT NULL DEFAULT SYSDATETIME()
);
GO

-- Índices para búsqueda rápida (REQ7 - Búsqueda de productos)
CREATE INDEX IX_Productos_Nombre  ON dbo.Productos(Nombre);
CREATE INDEX IX_Productos_Marca   ON dbo.Productos(Marca);
CREATE INDEX IX_Productos_Categoria ON dbo.Productos(CategoriaId);
GO

/* ------------------------------------------------------------
   5. MOVIMIENTOS DE INVENTARIO  (REQ3 - Gestión de inventario)
   ------------------------------------------------------------ */
IF OBJECT_ID('dbo.MovimientosInventario', 'U') IS NOT NULL DROP TABLE dbo.MovimientosInventario;
GO
CREATE TABLE dbo.MovimientosInventario (
    MovimientoId    INT IDENTITY(1,1) PRIMARY KEY,
    ProductoId      INT NOT NULL FOREIGN KEY REFERENCES dbo.Productos(ProductoId),
    TipoMovimiento  NVARCHAR(10) NOT NULL CHECK (TipoMovimiento IN ('ENTRADA','SALIDA')),
    Cantidad        INT NOT NULL CHECK (Cantidad > 0),
    StockAnterior   INT NOT NULL,
    StockNuevo      INT NOT NULL,
    Motivo          NVARCHAR(255) NULL,
    UsuarioId       INT NOT NULL FOREIGN KEY REFERENCES dbo.Usuarios(UsuarioId),
    FechaMovimiento DATETIME2 NOT NULL DEFAULT SYSDATETIME()
);
GO
CREATE INDEX IX_Movimientos_Producto ON dbo.MovimientosInventario(ProductoId);
CREATE INDEX IX_Movimientos_Fecha ON dbo.MovimientosInventario(FechaMovimiento);
GO

/* ------------------------------------------------------------
   6. VENTAS  (REQ4 - Registro de ventas)
   ------------------------------------------------------------ */
IF OBJECT_ID('dbo.Ventas', 'U') IS NOT NULL DROP TABLE dbo.Ventas;
GO
CREATE TABLE dbo.Ventas (
    VentaId         INT IDENTITY(1,1) PRIMARY KEY,
    NumeroVenta     NVARCHAR(20) NOT NULL UNIQUE,
    ClienteNombre   NVARCHAR(150) NULL DEFAULT 'Consumidor final',
    UsuarioId       INT NOT NULL FOREIGN KEY REFERENCES dbo.Usuarios(UsuarioId),
    Subtotal        DECIMAL(10,2) NOT NULL DEFAULT 0,
    Total           DECIMAL(10,2) NOT NULL DEFAULT 0,
    Estado          NVARCHAR(20) NOT NULL DEFAULT 'COMPLETADA' CHECK (Estado IN ('COMPLETADA','ANULADA')),
    FechaVenta      DATETIME2 NOT NULL DEFAULT SYSDATETIME()
);
GO
CREATE INDEX IX_Ventas_Fecha ON dbo.Ventas(FechaVenta);
GO

/* ------------------------------------------------------------
   7. DETALLE DE VENTAS
   ------------------------------------------------------------ */
IF OBJECT_ID('dbo.DetalleVentas', 'U') IS NOT NULL DROP TABLE dbo.DetalleVentas;
GO
CREATE TABLE dbo.DetalleVentas (
    DetalleVentaId  INT IDENTITY(1,1) PRIMARY KEY,
    VentaId         INT NOT NULL FOREIGN KEY REFERENCES dbo.Ventas(VentaId),
    ProductoId      INT NOT NULL FOREIGN KEY REFERENCES dbo.Productos(ProductoId),
    Cantidad        INT NOT NULL CHECK (Cantidad > 0),
    PrecioUnitario  DECIMAL(10,2) NOT NULL,
    Subtotal        DECIMAL(10,2) NOT NULL
);
GO
CREATE INDEX IX_DetalleVentas_Venta ON dbo.DetalleVentas(VentaId);
CREATE INDEX IX_DetalleVentas_Producto ON dbo.DetalleVentas(ProductoId);
GO

PRINT 'Base de datos GloritaDB creada correctamente.';
