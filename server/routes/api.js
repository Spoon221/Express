import { Router } from 'express';
import { HttpError } from '../utils/http-error.js';
import { parseCreateTask, parseRunId, parseTaskId, parseUpdateTask } from '../utils/validation.js';

/**
 * Создаёт защищённые RESTful-маршруты для автора и дел.
 * @param {object} dependencies Зависимости API.
 * @param {{login: string, fullName: string}} dependencies.author Автор из конфигурации.
 * @param {object} dependencies.tasksService Бизнес-операции над делами.
 * @returns {Router} Настроенный Express Router.
 */
export function createApiRouter({ author, tasksService }) {
  const router = Router({ strict: true });

  router.get('/author/', (request, response) => response.json(author));

  router.post('/tasks/', async (request, response, next) => {
    try {
      response.status(201).json(await tasksService.create(parseCreateTask(request.body)));
    } catch (error) {
      next(error);
    }
  });

  router.get('/tasks/', async (request, response, next) => {
    try {
      if (Object.keys(request.query).length !== 1 || !Object.hasOwn(request.query, 'runId')) {
        throw new HttpError(400, 'Нужен только параметр runId');
      }
      response.json(await tasksService.list(parseRunId(request.query.runId)));
    } catch (error) {
      next(error);
    }
  });

  router.get('/tasks/:id/', async (request, response, next) => {
    try {
      response.json(await tasksService.get(parseTaskId(request.params.id)));
    } catch (error) {
      next(error);
    }
  });

  router.patch('/tasks/:id/', async (request, response, next) => {
    try {
      response.json(await tasksService.update(parseTaskId(request.params.id), parseUpdateTask(request.body)));
    } catch (error) {
      next(error);
    }
  });

  router.delete('/tasks/:id/', async (request, response, next) => {
    try {
      await tasksService.delete(parseTaskId(request.params.id));
      response.status(204).end();
    } catch (error) {
      next(error);
    }
  });

  return router;
}
