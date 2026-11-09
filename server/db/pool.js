import pg from 'pg';

const { Pool } = pg;

/**
 * Создаёт пул соединений PostgreSQL для повторного использования подключений.
 * @param {string} connectionString Строка подключения к учебной базе данных.
 * @returns {pg.Pool} Настроенный пул PostgreSQL.
 */
export function createPool(connectionString) {
  return new Pool({ connectionString });
}
