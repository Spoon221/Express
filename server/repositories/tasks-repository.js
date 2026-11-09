/**
 * Преобразует строку базы данных к публичному формату из HTTP-контракта.
 * @param {object} row Строка результата PostgreSQL в camelCase-алиасах.
 * @returns {object} Дело с датой в UTC ISO 8601.
 */
function toTask(row) {
  return { ...row, createdAt: new Date(row.createdAt).toISOString() };
}

/**
 * Создаёт доступ к таблице tasks и изолирует SQL от HTTP-слоя.
 * @param {import('pg').Pool} pool Пул соединений PostgreSQL.
 * @returns {object} Набор операций над делами.
 */
export function createTasksRepository(pool) {
  const fields = 'id::text AS "id", owner_login AS "ownerLogin", title, done, run_id AS "runId", created_at AS "createdAt"';

  return {
    /**
     * Добавляет новое дело конкретного автора.
     * @param {{ownerLogin: string, title: string, runId: string}} task Данные нового дела.
     * @returns {Promise<object>} Созданное дело.
     */
    async create(task) {
      const result = await pool.query(
        `INSERT INTO tasks (owner_login, title, run_id) VALUES ($1, $2, $3) RETURNING ${fields}`,
        [task.ownerLogin, task.title, task.runId],
      );
      return toTask(result.rows[0]);
    },
    /**
     * Удаляет дело только в области видимости его автора.
     * @param {string} id UUID дела.
     * @param {string} ownerLogin Логин владельца дела.
     * @returns {Promise<boolean>} Признак успешного удаления.
     */
    async deleteById(id, ownerLogin) {
      const result = await pool.query('DELETE FROM tasks WHERE id = $1 AND owner_login = $2', [id, ownerLogin]);
      return result.rowCount === 1;
    },
    /**
     * Ищет одно дело, не раскрывая чужие данные.
     * @param {string} id UUID дела.
     * @param {string} ownerLogin Логин автора.
     * @returns {Promise<object | null>} Найденное дело или null.
     */
    async findById(id, ownerLogin) {
      const result = await pool.query(`SELECT ${fields} FROM tasks WHERE id = $1 AND owner_login = $2`, [id, ownerLogin]);
      return result.rows[0] ? toTask(result.rows[0]) : null;
    },
    /**
     * Возвращает дела автора для заданного запуска в порядке создания.
     * @param {string} ownerLogin Логин автора.
     * @param {string} runId Идентификатор запуска.
     * @returns {Promise<object[]>} Массив дел.
     */
    async findByRunId(ownerLogin, runId) {
      const result = await pool.query(`SELECT ${fields} FROM tasks WHERE owner_login = $1 AND run_id = $2 ORDER BY created_at DESC`, [ownerLogin, runId]);
      return result.rows.map(toTask);
    },
    /**
     * Изменяет разрешённые поля существующего дела автора.
     * @param {string} id UUID дела.
     * @param {string} ownerLogin Логин автора.
     * @param {{title?: string, done?: boolean}} changes Проверенные обновления.
     * @returns {Promise<object | null>} Обновлённое дело или null.
     */
    async update(id, ownerLogin, changes) {
      const columns = [];
      const values = [];
      if (Object.hasOwn(changes, 'title')) {
        values.push(changes.title);
        columns.push(`title = $${values.length}`);
      }
      if (Object.hasOwn(changes, 'done')) {
        values.push(changes.done);
        columns.push(`done = $${values.length}`);
      }
      values.push(id, ownerLogin);
      const result = await pool.query(
        `UPDATE tasks SET ${columns.join(', ')} WHERE id = $${values.length - 1} AND owner_login = $${values.length} RETURNING ${fields}`,
        values,
      );
      return result.rows[0] ? toTask(result.rows[0]) : null;
    },
  };
}
