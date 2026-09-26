/* ============================================================
   EXCLUSIVOS GLORITA - Migración: doble factor de autenticación (2FA) por correo
   Agrega la tabla "CodigosVerificacion", donde se guardan los códigos de
   6 dígitos enviados por correo electrónico al iniciar sesión (siempre
   hasheados con bcrypt, nunca en texto plano). El código se envía al
   correo que cada usuario ya tiene registrado, así que no hace falta
   ninguna columna nueva en "Usuarios".

   Ejecutar UNA VEZ sobre la base de datos de Supabase/PostgreSQL ya
   existente (SQL Editor de Supabase, o psql).
   ============================================================ */

CREATE TABLE IF NOT EXISTS "CodigosVerificacion" (
    "CodigoId"      SERIAL PRIMARY KEY,
    "UsuarioId"     INTEGER NOT NULL REFERENCES "Usuarios"("UsuarioId") ON DELETE CASCADE,
    "CodigoHash"    VARCHAR(255) NOT NULL,
    "Intentos"      INTEGER NOT NULL DEFAULT 0,
    "Usado"         BOOLEAN NOT NULL DEFAULT false,
    "ExpiraEn"      TIMESTAMPTZ NOT NULL,
    "FechaCreacion" TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS "IX_CodigosVerificacion_UsuarioId" ON "CodigosVerificacion" ("UsuarioId");

-- Si en algún momento llegaste a correr una versión anterior de esta
-- migración que agregaba una columna "Telefono" a "Usuarios" (para 2FA por
-- SMS), podés borrarla — ya no se usa:
-- ALTER TABLE "Usuarios" DROP COLUMN IF EXISTS "Telefono";
