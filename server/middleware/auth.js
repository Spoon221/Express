import { timingSafeEqual } from 'node:crypto';
import { HttpError } from '../utils/http-error.js';

/**
 * Создаёт middleware проверки Bearer-токена без передачи секрета в клиентский код.
 * @param {string} expectedToken Токен, сохранённый только в переменной окружения сервера.
 * @returns {import('express').RequestHandler} Middleware авторизации API.
 */
export function createAuthMiddleware(expectedToken) {
  return (request, response, next) => {
    const match = /^Bearer (.+)$/.exec(request.get('authorization') || '');
    const receivedToken = match?.[1];
    const expected = Buffer.from(expectedToken);
    const received = Buffer.from(receivedToken || '');
    const isValid = received.length === expected.length && timingSafeEqual(received, expected);

    if (!isValid) {
      next(new HttpError(401, 'Требуется действительный Bearer-токен'));
      return;
    }
    next();
  };
}
