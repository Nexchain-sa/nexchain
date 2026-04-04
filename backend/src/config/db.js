const { Pool } = require('pg');
require('dotenv').config();

const poolConfig = process.env.DATABASE_URL
  ? {
      connectionString: process.env.DATABASE_URL,
      ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false,
    }
  : {
      host:     process.env.DB_HOST     || 'localhost',
      port:     process.env.DB_PORT     || 5432,
      database: process.env.DB_NAME     || 'nexchain_db',
      user:     process.env.DB_USER     || 'nexchain_user',
      password: process.env.DB_PASSWORD || '',
    };

const pool = new Pool({
  ...poolConfig,
  max: 20,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 2000,
});

pool.on('connect', () => console.log('✅ DB connected'));
pool.on('error',   (err) => console.error('❌ DB error:', err));

module.exports = pool;
