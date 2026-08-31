# ¿Qué script uso?

- **`supabase_schema.sql`** → Este es el que necesitás ahora. Contiene todo
  (tablas, roles, usuario admin, categorías y productos de ejemplo) listo
  para pegar en el SQL Editor de Supabase (PostgreSQL).

- `01_schema.sql`, `02_seed.sql`, `03_migracion_tallas.sql`,
  `04_migracion_foto_usuario.sql`, `05_migracion_imagen_producto.sql` →
  Son los scripts **antiguos para SQL Server**. Se quedan en el proyecto
  solo como referencia histórica / por si en algún momento volvés a correr
  el sistema con SQL Server en vez de Supabase. **No los uses junto con
  Supabase**, son para motores distintos.
  