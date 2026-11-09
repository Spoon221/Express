/**
 * Описывает контролируемую HTTP-ошибку, чтобы маршруты не дублировали формат ответа.
 */
export class HttpError extends Error {
  /**
   * Создаёт ошибку с кодом ответа и безопасным сообщением для клиента.
   * @param {number} status Код HTTP-ответа.
   * @param {string} message Краткая причина ошибки для API-клиента.
   */
  constructor(status, message) {
    super(message);
    this.status = status;
  }
}
