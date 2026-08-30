require('dotenv').config();
const express = require('express');
const cors = require('cors');

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

app.use(cors({ origin: process.env.CORS_ORIGIN || '*' }));
app.use(express.json({ limit: '5mb' })); // las fotos de perfil viajan como base64

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
