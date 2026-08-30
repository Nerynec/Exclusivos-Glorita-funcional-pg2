# Exclusivos Glorita — Sistema Web de Gestión

Aplicación web full-stack: administración de productos, gestión de inventario,
registro de ventas, control de stock, búsqueda, reportes, dashboard, usuarios
por rol y carrito de compras.

## Arquitectura

```
glorita-web/
├── database/         Script SQL para PostgreSQL / Supabase
├── backend/          API REST — Node.js + Express + PostgreSQL (pg)
└── frontend/         Interfaz web — React + Vite
```

**Stack técnico:**
- **Frontend:** React 18 + Vite, React Router, Recharts, jsPDF, ExcelJS
- **Backend:** Node.js + Express, autenticación JWT, control de acceso por rol
- **Base de datos:** PostgreSQL, alojada en **Supabase** (plan gratuito)
- **Seguridad:** contraseñas con hash `bcrypt`, roles (Administrador / Empleado)

---

## 1. Desarrollo local

### 1.1 Base de datos (Supabase)

1. Creá una cuenta gratis en [supabase.com](https://supabase.com) y un proyecto nuevo (elegí una contraseña de base de datos y guardala, la vas a necesitar).
2. En el panel de tu proyecto, andá a **SQL Editor** → **New query**.
3. Pegá todo el contenido de `database/supabase_schema.sql` y dale **Run**. Esto crea las 7 tablas, los roles, un usuario administrador y algunos productos de ejemplo.
4. Anotá tu cadena de conexión: **Project Settings** → **Database** → **Connection string** → pestaña **URI**. Se ve así:
   ```
   postgresql://postgres:TU_PASSWORD@db.xxxxxxxxxxxx.supabase.co:5432/postgres
   ```

Usuario de prueba creado por el script: `admin@glorita.com` / `Glorita2026*` (cambiala después de tu primer login).

### 1.2 Backend

```bash
cd backend
cp .env.example .env
```

Editá `.env` y pegá tu `DATABASE_URL` de Supabase. Después:

```bash
npm install
npm run dev
```

Verificá en el navegador: `http://localhost:4000/api/health` → debería responder `{"estado":"ok",...}`.

### 1.3 Frontend

```bash
cd frontend
cp .env.example .env
npm install
npm run dev
```

Abrí `http://localhost:5173` e iniciá sesión.

---

## 2. Subir el proyecto a GitHub

Si todavía no tenés un repositorio:

```bash
cd glorita-web
git init
git add .
git commit -m "Sistema Exclusivos Glorita"
```

Luego en [github.com](https://github.com) → **New repository** (no marques "Add a README", ya tenés uno). Copiá la URL que te da GitHub y:

```bash
git remote add origin https://github.com/TU_USUARIO/TU_REPO.git
git branch -M main
git push -u origin main
```

⚠️ Los archivos `.env` **no se suben** (ya están en `.gitignore`) — es intencional, ahí van tus contraseñas reales.

---

## 3. Desplegar el backend gratis (Render)

1. Creá una cuenta en [render.com](https://render.com) (podés entrar con tu cuenta de GitHub).
2. **New** → **Web Service** → conectá tu repositorio de GitHub.
3. Configurá:
   - **Root Directory:** `backend`
   - **Runtime:** Node
   - **Build Command:** `npm install`
   - **Start Command:** `npm start`
   - **Instance Type:** Free
4. En la sección **Environment Variables**, agregá las mismas que tenés en tu `.env` local:
   - `DATABASE_URL` → tu cadena de conexión de Supabase
   - `DB_SSL` → `true`
   - `JWT_SECRET` → una cadena larga y aleatoria (puede ser distinta a la de tu compu)
   - `JWT_EXPIRES_IN` → `8h`
   - `CORS_ORIGIN` → (lo completás en el paso 4, después de tener la URL del frontend)
5. Dale **Create Web Service**. Al terminar, Render te da una URL pública como `https://glorita-backend.onrender.com`.

⚠️ En el plan gratuito de Render, el servidor "se duerme" tras 15 minutos sin uso y tarda unos 30-50 segundos en despertar con la primera visita — es normal, no es un error.

---

## 4. Desplegar el frontend gratis (Netlify)

1. Antes de desplegar, editá `frontend/.env` (o configuralo directo en Netlify) con:
   ```
   VITE_API_URL=https://glorita-backend.onrender.com/api
   ```
   (usando la URL real que te dio Render en el paso anterior)
2. Creá una cuenta en [netlify.com](https://netlify.com) (con GitHub).
3. **Add new site** → **Import an existing project** → elegí tu repositorio.
4. Configurá:
   - **Base directory:** `frontend`
   - **Build command:** `npm run build`
   - **Publish directory:** `frontend/dist`
5. En **Environment variables**, agregá `VITE_API_URL` con la URL de tu backend en Render (igual que arriba).
6. Dale **Deploy site**. Netlify te da una URL como `https://glorita-exclusivos.netlify.app`.

### Último paso: conectar las dos URLs entre sí

Volvé a Render → tu servicio de backend → **Environment** → editá `CORS_ORIGIN` con la URL que te dio Netlify (ej. `https://glorita-exclusivos.netlify.app`). Guardá — Render va a reiniciar el servicio solo.

---

## 5. Usuarios y roles

- **Administrador:** acceso completo.
- **Empleado (Vendedor):** Panel general, Productos, Ventas — sin acceso a Inventario, Reportes ni Usuarios (reforzado también del lado del servidor, no solo visual).

---

## 6. Notas técnicas para la sustentación de tesis

- La migración de SQL Server a PostgreSQL/Supabase se hizo controlador por controlador, preservando exactamente los mismos nombres de campos (`ProductoId`, `NombreCompleto`, etc.) entre comillas dobles, para que el frontend no necesitara ningún cambio.
- Las transacciones de ventas e inventario usan el patrón `BEGIN` / `COMMIT` / `ROLLBACK` de PostgreSQL con un cliente dedicado del pool de conexiones, garantizando que el stock nunca quede inconsistente.
- Todas las fechas se calculan explícitamente en hora de Guatemala (UTC-6) desde el código del backend, sin depender de la zona horaria configurada en el servidor donde corra la aplicación — importante porque los servidores en la nube normalmente usan UTC por defecto.
