import { getConfig } from './config/env.js';
import { createPool } from './db/pool.js';
import { createApp } from './app.js';
import { createTasksRepository } from './repositories/tasks-repository.js';
import { createTasksService } from './services/tasks-service.js';

const config = getConfig();
const pool = createPool(config.databaseUrl);
const tasksService = createTasksService({
  repository: createTasksRepository(pool),
  ownerLogin: config.login,
});
const app = createApp({ config, tasksService });
const server = app.listen(config.port, () => {
  console.log(`Сервер запущен: http://localhost:${config.port}`);
});

/**
 * Корректно останавливает HTTP-сервер и пул PostgreSQL при завершении процесса.
 * @returns {Promise<void>} Завершённая очистка ресурсов.
 */
async function shutdown() {
  server.close();
  await pool.end();
}

process.once('SIGINT', shutdown);
process.once('SIGTERM', shutdown);
