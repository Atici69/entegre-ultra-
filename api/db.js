import mysql from 'mysql2/promise';

let pool;

export function getPool() {
  if (!pool) {
    const required = ['MYSQL_HOST', 'MYSQL_DATABASE', 'MYSQL_USER', 'MYSQL_PASSWORD'];
    const missing = required.filter((key) => !process.env[key]);
    if (missing.length) {
      throw new Error(`Missing database configuration: ${missing.join(', ')}`);
    }

    pool = mysql.createPool({
      host: process.env.MYSQL_HOST,
      port: Number(process.env.MYSQL_PORT || 3306),
      database: process.env.MYSQL_DATABASE,
      user: process.env.MYSQL_USER,
      password: process.env.MYSQL_PASSWORD,
      waitForConnections: true,
      connectionLimit: Math.max(1, Number(process.env.MYSQL_CONNECTION_LIMIT || 5)),
      queueLimit: 0,
      enableKeepAlive: true,
      charset: 'utf8mb4'
    });
  }
  return pool;
}

export async function closePool() {
  if (pool) {
    const current = pool;
    pool = undefined;
    await current.end();
  }
}
