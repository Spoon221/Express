const apiBaseUrl = import.meta.env.VITE_API_BASE_URL || '/api';

/**
 * Выполняет RESTful-запрос и преобразует ожидаемый JSON-ответ в данные приложения.
 * @param {string} path Путь API с завершающим слешем.
 * @param {string} token Bearer-токен, введённый пользователем.
 * @param {RequestInit} options Параметры HTTP-метода и тела запроса.
 * @returns {Promise<unknown>} Распарсенный JSON или undefined для 204.
 */
async function request(path, token, options = {}) {
  const response = await fetch(`${apiBaseUrl}${path}`, {
    ...options,
    headers: {
      Authorization: `Bearer ${token}`,
      ...(options.body ? { 'Content-Type': 'application/json' } : {}),
      ...options.headers,
    },
  });
  if (response.status === 204) return undefined;
  const data = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(data.error || 'Не удалось выполнить запрос');
  return data;
}

/**
 * Создаёт клиент API, чтобы компоненты не повторяли HTTP-детали.
 * @param {string} token Bearer-токен текущей сессии.
 * @returns {object} Операции над автором и делами.
 */
export function createApi(token) {
  return {
    author: () => request('/author/', token),
    createTask: (task) => request('/tasks/', token, { method: 'POST', body: JSON.stringify(task) }),
    deleteTask: (id) => request(`/tasks/${id}/`, token, { method: 'DELETE' }),
    listTasks: (runId) => request(`/tasks/?runId=${encodeURIComponent(runId)}`, token),
    updateTask: (id, changes) => request(`/tasks/${id}/`, token, { method: 'PATCH', body: JSON.stringify(changes) }),
  };
}
