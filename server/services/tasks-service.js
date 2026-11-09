import { HttpError } from '../utils/http-error.js';

/**
 * Создаёт бизнес-слой дел, который связывает автора из конфигурации с хранилищем.
 * @param {object} dependencies Зависимости сервиса.
 * @param {object} dependencies.repository Репозиторий учебной таблицы tasks.
 * @param {string} dependencies.ownerLogin Логин Moodle единственного автора.
 * @returns {object} Операции предметной области списка дел.
 */
export function createTasksService({ repository, ownerLogin }) {
  /**
   * Прерывает запрос 404, когда дело не принадлежит автору или отсутствует.
   * @param {object | null} task Результат операции репозитория.
   * @returns {object} Найденное дело.
   */
  function requireTask(task) {
    if (!task) {
      throw new HttpError(404, 'Дело не найдено');
    }
    return task;
  }

  return {
    /**
     * Создаёт дело с владельцем, который не может быть передан клиентом.
     * @param {{title: string, runId: string}} input Проверенные данные формы.
     * @returns {Promise<object>} Новое дело.
     */
    create(input) {
      return repository.create({ ...input, ownerLogin });
    },
    /**
     * Удаляет доступное автору дело.
     * @param {string} id UUID дела.
     * @returns {Promise<void>} Пустой результат для ответа 204.
     */
    async delete(id) {
      if (!(await repository.deleteById(id, ownerLogin))) {
        throw new HttpError(404, 'Дело не найдено');
      }
    },
    /**
     * Находит одно дело автора.
     * @param {string} id UUID дела.
     * @returns {Promise<object>} Найденное дело.
     */
    async get(id) {
      return requireTask(await repository.findById(id, ownerLogin));
    },
    /**
     * Список дел одного запуска автора.
     * @param {string} runId Идентификатор запуска.
     * @returns {Promise<object[]>} Массив дел.
     */
    list(runId) {
      return repository.findByRunId(ownerLogin, runId);
    },
    /**
     * Обновляет заголовок и/или статус доступного автору дела.
     * @param {string} id UUID дела.
     * @param {{title?: string, done?: boolean}} changes Проверенные изменения.
     * @returns {Promise<object>} Обновлённое дело.
     */
    async update(id, changes) {
      return requireTask(await repository.update(id, ownerLogin, changes));
    },
  };
}
