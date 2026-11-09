import { HttpError } from './http-error.js';

const UUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
const RUN_ID_PATTERN = /^[A-Za-z0-9_-]{1,64}$/;

/**
 * Проверяет, что тело запроса является объектом без неизвестных полей.
 * @param {unknown} body Данные, разобранные Express из JSON-тела.
 * @param {string[]} allowedKeys Имена полей, разрешённые контрактом маршрута.
 * @returns {Record<string, unknown>} Проверенный объект запроса.
 */
export function assertAllowedObject(body, allowedKeys) {
  if (!body || Array.isArray(body) || typeof body !== 'object') {
    throw new HttpError(400, 'Ожидается JSON-объект');
  }
  if (Object.keys(body).some((key) => !allowedKeys.includes(key))) {
    throw new HttpError(400, 'Передано недопустимое поле');
  }
  return body;
}

/**
 * Нормализует и проверяет заголовок дела согласно контракту API.
 * @param {unknown} title Значение поля title из запроса.
 * @returns {string} Обрезанный и валидный заголовок дела.
 */
export function parseTitle(title) {
  if (typeof title !== 'string') {
    throw new HttpError(400, 'title должен быть строкой');
  }
  const normalizedTitle = title.trim();
  if (normalizedTitle.length < 1 || normalizedTitle.length > 200) {
    throw new HttpError(400, 'title должен содержать от 1 до 200 символов');
  }
  return normalizedTitle;
}

/**
 * Проверяет идентификатор запуска, используемый для группировки дел.
 * @param {unknown} runId Значение параметра runId.
 * @returns {string} Валидный идентификатор запуска.
 */
export function parseRunId(runId) {
  if (typeof runId !== 'string' || !RUN_ID_PATTERN.test(runId)) {
    throw new HttpError(400, 'runId имеет недопустимый формат');
  }
  return runId;
}

/**
 * Проверяет UUID до обращения к базе, чтобы неверный путь давал код 400.
 * @param {string} id Значение параметра маршрута :id.
 * @returns {string} Валидный UUID.
 */
export function parseTaskId(id) {
  if (!UUID_PATTERN.test(id)) {
    throw new HttpError(400, 'id должен быть UUID');
  }
  return id;
}

/**
 * Проверяет тело создания дела и возвращает только разрешённые данные.
 * @param {unknown} body JSON-тело запроса POST.
 * @returns {{title: string, runId: string}} Данные для создания дела.
 */
export function parseCreateTask(body) {
  const value = assertAllowedObject(body, ['title', 'runId']);
  if (!Object.hasOwn(value, 'title') || !Object.hasOwn(value, 'runId')) {
    throw new HttpError(400, 'Нужны поля title и runId');
  }
  return { title: parseTitle(value.title), runId: parseRunId(value.runId) };
}

/**
 * Проверяет тело изменения дела и не разрешает пустое обновление.
 * @param {unknown} body JSON-тело запроса PATCH.
 * @returns {{title?: string, done?: boolean}} Изменяемые поля дела.
 */
export function parseUpdateTask(body) {
  const value = assertAllowedObject(body, ['title', 'done']);
  const hasTitle = Object.hasOwn(value, 'title');
  const hasDone = Object.hasOwn(value, 'done');
  if (!hasTitle && !hasDone) {
    throw new HttpError(400, 'Передайте title и/или done');
  }
  if (hasDone && typeof value.done !== 'boolean') {
    throw new HttpError(400, 'done должен быть boolean');
  }
  return {
    ...(hasTitle ? { title: parseTitle(value.title) } : {}),
    ...(hasDone ? { done: value.done } : {}),
  };
}
