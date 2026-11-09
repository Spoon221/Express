import test from 'node:test';
import assert from 'node:assert/strict';
import { once } from 'node:events';
import { createApp } from '../server/app.js';
import { createTasksService } from '../server/services/tasks-service.js';

/**
 * Запускает тестовое приложение на случайном локальном порту для проверки HTTP-контракта.
 * @returns {Promise<{baseUrl: string, close: () => Promise<void>}>} Адрес и функция остановки сервера.
 */
async function startTestApp() {
  const tasks = new Map();
  const repository = {
    async create(task) {
      const result = { id: '123e4567-e89b-42d3-a456-426614174000', done: false, createdAt: new Date().toISOString(), ...task };
      tasks.set(result.id, result);
      return result;
    },
    async deleteById(id) { return tasks.delete(id); },
    async findById(id) { return tasks.get(id) || null; },
    async findByRunId(ownerLogin, runId) { return [...tasks.values()].filter((task) => task.ownerLogin === ownerLogin && task.runId === runId); },
    async update(id, ownerLogin, changes) {
      const task = tasks.get(id);
      if (!task || task.ownerLogin !== ownerLogin) return null;
      const result = { ...task, ...changes };
      tasks.set(id, result);
      return result;
    },
  };
  const app = createApp({
    config: { apiToken: 'test-token', corsOrigin: 'http://localhost:5173', fullName: 'Тест Тестович', login: 'test-login' },
    tasksService: createTasksService({ repository, ownerLogin: 'test-login' }),
  });
  const server = app.listen(0, '127.0.0.1');
  await once(server, 'listening');
  const { port } = server.address();
  return {
    baseUrl: `http://127.0.0.1:${port}`,
    close: () => new Promise((resolve, reject) => server.close((error) => error ? reject(error) : resolve())),
  };
}

test('публичный login и защищённый REST CRUD соблюдают контракт', async (context) => {
  let app;
  try {
    app = await startTestApp();
  } catch (error) {
    if (error.code === 'EPERM') {
      context.skip('Среда не разрешает открыть localhost-порт; в CI и локально тест выполняется полностью');
      return;
    }
    throw error;
  }
  try {
    const login = await fetch(`${app.baseUrl}/login/`);
    assert.equal(login.status, 200);
    assert.equal(login.headers.get('content-type'), 'text/plain; charset=utf-8');
    assert.equal(await login.text(), 'test-login');

    const denied = await fetch(`${app.baseUrl}/api/author/`);
    assert.equal(denied.status, 401);

    const headers = { Authorization: 'Bearer test-token', 'Content-Type': 'application/json' };
    const created = await fetch(`${app.baseUrl}/api/tasks/`, { method: 'POST', headers, body: JSON.stringify({ title: '  Проверить API  ', runId: 'manual' }) });
    assert.equal(created.status, 201);
    const task = await created.json();
    assert.deepEqual(Object.keys(task).sort(), ['createdAt', 'done', 'id', 'ownerLogin', 'runId', 'title']);
    assert.equal(task.title, 'Проверить API');
    assert.equal(task.ownerLogin, 'test-login');
    assert.equal(task.done, false);

    const changed = await fetch(`${app.baseUrl}/api/tasks/${task.id}/`, { method: 'PATCH', headers, body: JSON.stringify({ done: true }) });
    assert.equal(changed.status, 200);
    assert.equal((await changed.json()).done, true);

    const deleted = await fetch(`${app.baseUrl}/api/tasks/${task.id}/`, { method: 'DELETE', headers });
    assert.equal(deleted.status, 204);
  } finally {
    await app.close();
  }
});
