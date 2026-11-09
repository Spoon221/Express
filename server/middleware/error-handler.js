import { HttpError } from '../utils/http-error.js';

/**
 * Преобразует синтаксические ошибки JSON в формат контракта API.
 * @param {Error} error Ошибка парсера Express.
 * @param {object} request HTTP-запрос.
 * @param {object} response HTTP-ответ.
 * @param {Function} next Переход к следующему обработчику ошибок.
 * @returns {void} Отправляет 400 либо передаёт ошибку дальше.
 */
export function invalidJsonHandler(error, request, response, next) {
  if (error instanceof SyntaxError && 'body' in error) {
    response.status(400).json({ error: 'Некорректный JSON' });
    return;
  }
  next(error);
}

/**
 * Формирует единообразные безопасные ошибки API, не раскрывая детали PostgreSQL.
 * @param {Error} error Ошибка маршрута или базы данных.
 * @param {object} request HTTP-запрос.
 * @param {object} response HTTP-ответ.
 * @param {Function} next Переход к стандартному обработчику Express.
 * @returns {void} Завершает HTTP-ответ.
 */
export function apiErrorHandler(error, request, response, next) {
  if (response.headersSent) {
    next(error);
    return;
  }
  if (error instanceof HttpError) {
    response.status(error.status).json({ error: error.message });
    return;
  }
  console.error(error);
  response.status(503).json({ error: 'Сервис базы данных временно недоступен' });
}
