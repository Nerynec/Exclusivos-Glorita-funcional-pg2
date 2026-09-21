/* ============================================================
   EXCLUSIVOS GLORITA - Migración: invalidación de sesión (logout real)
   Agrega una columna que guarda desde cuándo deben rechazarse los
   tokens JWT ya emitidos para ese usuario. Al cerrar sesión, se guarda
   la fecha/hora actual; cualquier token firmado ANTES de esa fecha
   queda inválido de inmediato, aunque todavía no haya expirado.

   Ejecutar UNA VEZ sobre la base de datos de Supabase/PostgreSQL ya
   existente (SQL Editor de Supabase, o psql).
   ============================================================ */

ALTER TABLE "Usuarios"
  ADD COLUMN IF NOT EXISTS "TokenInvalidoDesde" TIMESTAMPTZ NULL;

COMMENT ON COLUMN "Usuarios"."TokenInvalidoDesde" IS
  'Fecha/hora del último "cerrar sesión". Cualquier token JWT firmado antes de esta marca se rechaza, aunque no haya expirado todavía.';
