/* ============================================================
   EXCLUSIVOS GLORITA - Migración: renumerar ventas existentes
   El número de venta se generaba como "V-" + Date.now() (milisegundos),
   lo que daba identificadores larguísimos e ilegibles como
   "V-1789858115570". A partir de ahora las ventas nuevas usan
   "V-" + VentaId con ceros a la izquierda (ej. "V-000001").

   Este script pone las ventas YA EXISTENTES en ese mismo formato, para
   que todo el historial quede consistente. Es solo un identificador
   visual: no toca montos, fechas, productos ni ninguna otra columna,
   así que no afecta reportes ni el stock.

   Ejecutar UNA VEZ sobre la base de datos de Supabase/PostgreSQL ya
   existente (SQL Editor de Supabase, o psql). Es seguro volver a
   correrlo por accidente: si ya están renumeradas, deja los mismos
   valores.
   ============================================================ */

UPDATE "Ventas"
SET "NumeroVenta" = 'V-' || LPAD("VentaId"::text, 6, '0');
