import { resolve } from 'node:path';
import cors from 'cors';
import express from 'express';
import { createAuthMiddleware } from './middleware/auth.js';
import { apiErrorHandler, invalidJsonHandler } from './middleware/error-handler.js';
import { createApiRouter } from './routes/api.js';

/**
 * Собирает Express-приложение с публичным логином, защищённым API и статическим клиентом.
 * @param {object} dependencies Зависимости приложения.
 * @param {object} dependencies.config Конфигурация окружения.
 * @param {object} dependencies.tasksService Бизнес-операции дел.
 * @returns {import('express').Express} Готовое к запуску приложение Express.
 */
export function createApp({ config, tasksService }) {
  const app = express();
  app.set('strict routing', true);
  app.disable('x-powered-by');
  app.use(cors({ origin: config.corsOrigins }));
  app.use(express.json({ limit: '16kb' }));
  app.use(invalidJsonHandler);

  app.get('/login/', (request, response) => {
    response.type('text/plain').send(config.login);
  });

  app.use('/api/', createAuthMiddleware(config.apiToken), createApiRouter({
    author: { login: config.login, fullName: config.fullName },
    tasksService,
  }));
  app.use('/api/', apiErrorHandler);

  const distPath = resolve(process.cwd(), 'dist');
  app.use(express.static(distPath));
  app.get('/{*path}', (request, response) => response.sendFile(resolve(distPath, 'index.html')));
  return app;
}
