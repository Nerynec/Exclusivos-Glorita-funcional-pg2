const { Pool } = require('pg');

// Supabase entrega una única cadena de conexión (DATABASE_URL). Si no viene
// definida, se arma con variables sueltas (útil para Postgres local).
const connectionString = process.env.DATABASE_URL;

const pool = connectionString
  ? new Pool({
    connectionString,
    ssl: process.env.DB_SSL === 'false' ? false : { rejectUnauthorized: false },
  })
  : new Pool({
    host: process.env.DB_HOST || 'localhost',
    port: parseInt(process.env.DB_PORT || '5432', 10),
    database: process.env.DB_NAME || 'postgres',
    user: process.env.DB_USER || 'postgres',
    password: process.env.DB_PASSWORD,
    ssl: process.env.DB_SSL === 'true' ? { rejectUnauthorized: false } : false,
  });

pool.on('error', (err) => {
  console.error('❌ Error inesperado en el pool de PostgreSQL:', err.message);
});

async function getPool() {
  // Se mantiene esta función (y su nombre) por compatibilidad con el resto
  // del código, que ya está escrito esperando "await getPool()".
  return pool;
}

async function probarConexion() {
  try {
    const cliente = await pool.connect();
    const resultado = await cliente.query('SELECT NOW()');
    cliente.release();
    console.log('✅ Conectado a PostgreSQL/Supabase:', resultado.rows[0].now);
  } catch (err) {
    console.error('❌ Error al conectar con PostgreSQL/Supabase:', err.message);
  }
}

module.exports = { pool, getPool, probarConexion };
