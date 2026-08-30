/* ============================================================
   EXCLUSIVOS GLORITA - Migración: permitir fotos subidas en Productos
   El campo ImagenUrl ahora acepta tanto un link (URL) como una imagen
   subida directamente (guardada como base64), por eso necesita más espacio.
   Ejecutar UNA VEZ sobre la base de datos GloritaDB ya existente.
   ============================================================ */
USE GloritaDB;
GO

ALTER TABLE dbo.Productos ALTER COLUMN ImagenUrl NVARCHAR(MAX) NULL;
GO

PRINT 'Columna ImagenUrl ampliada correctamente en Productos.';
