/* ============================================================
   EXCLUSIVOS GLORITA - Migración: foto de perfil de usuario
   Ejecutar UNA VEZ sobre la base de datos GloritaDB ya existente.
   ============================================================ */
USE GloritaDB;
GO

IF NOT EXISTS (
    SELECT 1 FROM sys.columns
    WHERE object_id = OBJECT_ID('dbo.Usuarios') AND name = 'FotoUrl'
)
BEGIN
    -- NVARCHAR(MAX) porque la foto se guarda como imagen codificada (base64),
    -- no como un link externo; no hay servidor de archivos en este proyecto.
    ALTER TABLE dbo.Usuarios ADD FotoUrl NVARCHAR(MAX) NULL;
    PRINT 'Columna FotoUrl agregada correctamente a Usuarios.';
END
ELSE
BEGIN
    PRINT 'La columna FotoUrl ya existía, no se hizo ningún cambio.';
END
GO
