import { readFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import { dirname, resolve } from 'node:path';
import { getConfig } from '../config/env.js';
import { createPool } from './pool.js';

const here = dirname(fileURLToPath(import.meta.url));
const config = getConfig();
const pool = createPool(config.databaseUrl);

try {
  const sql = await readFile(resolve(here, '../../db/init.sql'), 'utf8');
  await pool.query(sql);
  console.log('Учебная таблица tasks подготовлена.');
} finally {
  await pool.end();
}
