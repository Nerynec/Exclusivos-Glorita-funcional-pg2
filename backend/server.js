require('dotenv').config();
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');

const errorHandler = require('./src/middleware/errorHandler');
const authRoutes = require('./src/routes/auth.routes');
const productosRoutes = require('./src/routes/productos.routes');
const categoriasRoutes = require('./src/routes/categorias.routes');
const inventarioRoutes = require('./src/routes/inventario.routes');
const ventasRoutes = require('./src/routes/ventas.routes');
const reportesRoutes = require('./src/routes/reportes.routes');
const dashboardRoutes = require('./src/routes/dashboard.routes');
const usuariosRoutes = require('./src/routes/usuarios.routes');

const app = express();

// Cabeceras de seguridad HTTP estándar (protege contra clickjacking,
// sniffing de tipo MIME, y otras cosas que el navegador revisa solo).
app.use(helmet());

app.use(cors({ origin: process.env.CORS_ORIGIN || '*' }));
app.use(express.json({ limit: '5mb' })); // las fotos de perfil viajan como base64

if (!process.env.CORS_ORIGIN) {
  console.warn('⚠️  CORS_ORIGIN no está configurado — la API acepta peticiones de cualquier origen. Configuralo antes de producción.');
}

// Límite de intentos de inicio de sesión: máximo 10 intentos cada 15
// minutos por IP. Evita que alguien pruebe miles de contraseñas seguidas
// contra una misma cuenta (ataque de fuerza bruta).
const limitadorLogin = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10,
  message: { mensaje: 'Demasiados intentos de inicio de sesión. Esperá unos minutos e intentá de nuevo.' },
  standardHeaders: true,
  legacyHeaders: false,
});
app.use('/api/auth/login', limitadorLogin);

app.get('/api/health', (req, res) => {
  res.json({ estado: 'ok', servicio: 'Glorita API', fecha: new Date().toISOString() });
});

app.use('/api/auth', authRoutes);
app.use('/api/productos', productosRoutes);
app.use('/api/categorias', categoriasRoutes);
app.use('/api/inventario', inventarioRoutes);
app.use('/api/ventas', ventasRoutes);
app.use('/api/reportes', reportesRoutes);
app.use('/api/dashboard', dashboardRoutes);
app.use('/api/usuarios', usuariosRoutes);

app.use((req, res) => {
  res.status(404).json({ mensaje: 'Ruta no encontrada.' });
});

app.use(errorHandler);

const PORT = process.env.PORT || 4000;
app.listen(PORT, () => {
  console.log(`🚀 Glorita API escuchando en http://localhost:${PORT}`);
});
