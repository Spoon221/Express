import { createApi } from './services/api.js';
import './styles.css';

const root = document.querySelector('#root');
const state = { api: null, author: null, runId: 'manual', tasks: [] };

/**
 * Экранирует текст API перед вставкой в HTML, чтобы названия дел не исполнялись как разметка.
 * @param {string} value Текст, полученный от пользователя или API.
 * @returns {string} Безопасное HTML-представление текста.
 */
function escapeHtml(value) {
  return String(value).replace(/[&<>'"]/g, (symbol) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', "'": '&#039;', '"': '&quot;' })[symbol]);
}

/**
 * Возвращает заголовок пространства в корректном для профиля владельца падеже.
 * @param {string} fullName ФИО автора, полученное из защищённого API.
 * @returns {string} Подготовленный заголовок личного пространства.
 */
function getWorkspaceTitle(fullName) {
  return fullName === 'Симаков Евгений Сергеевич'
    ? 'Симакова Евгения Сергеевича'
    : `${fullName}`;
}

/**
 * Показывает текст ошибки в предусмотренном для него месте интерфейса.
 * @param {string} message Сообщение, понятное пользователю.
 * @returns {void} Изменяет текст текущего блока ошибки.
 */
function showError(message) {
  const element = document.querySelector('[data-error]');
  if (element) element.textContent = message;
}

/**
 * Рендерит экран ввода токена, не сохраняя секрет в браузерном хранилище.
 * @returns {void} Обновляет корневой элемент страницы.
 */
function renderLogin() {
  root.innerHTML = `
    <main class="shell shell--login">
      <p class="eyebrow">todo / 2026</p>
      <h1>Ничего лишнего.<br><em>Только дела.</em></h1>
      <p class="lead">Введите токен доступа. Он используется только в текущей вкладке и не сохраняется.</p>
      <form class="login-form" data-login-form>
        <label for="token">Bearer-токен</label>
        <input id="token" name="token" type="password" required autocomplete="off">
        <p class="error" data-error role="alert"></p>
        <button class="button" type="submit">Открыть список <span>↗</span></button>
      </form>
      <p class="note">Токен выдаёт владелец приложения. Исходный код его не содержит.</p>
    </main>`;
  document.querySelector('[data-login-form]').addEventListener('submit', login);
}

/**
 * Рендерит список задач и привязывает события только после вставки DOM-элементов.
 * @returns {void} Обновляет рабочее пространство.
 */
function renderWorkspace() {
  const tasksMarkup = state.tasks.length
    ? `<ul class="tasks">${state.tasks.map((task) => taskMarkup(task)).join('')}</ul>`
    : '<p class="empty">Здесь будет первое дело.</p>';
  root.innerHTML = `
    <main class="shell">
      <header class="topbar">
        <div><p class="eyebrow">личное пространство</p><h1>${escapeHtml(getWorkspaceTitle(state.author.fullName))}</h1></div>
        <button class="logout" data-logout>Выйти</button>
      </header>
      <section class="workspace">
        <div class="workspace__head">
          <div><p class="eyebrow">список дел</p><h2>Сегодня<br><em>имеет значение.</em></h2></div>
          <div class="author-badge"><span>логин Moodle</span>${escapeHtml(state.author.login)}</div>
        </div>
        <form class="run-form" data-run-form>
          <label for="run-id">Run ID</label>
          <input id="run-id" name="runId" value="${escapeHtml(state.runId)}" pattern="[A-Za-z0-9_-]{1,64}" required>
          <button class="text-button" type="submit">Выбрать</button>
          <button class="text-button" type="button" data-refresh>Обновить</button>
        </form>
        <form class="add-form" data-add-form>
          <input name="title" maxlength="200" placeholder="Что нужно сделать?" aria-label="Новое дело" required>
          <button class="button" type="submit">Добавить <span>+</span></button>
        </form>
        <p class="error" data-error role="alert"></p>
        <div data-task-list>${tasksMarkup}</div>
      </section>
    </main>`;
  bindWorkspaceEvents();
}

/**
 * Формирует карточку дела с данными в data-атрибутах для обработчиков.
 * @param {object} task Дело в формате API.
 * @returns {string} HTML-разметка строки дела.
 */
function taskMarkup(task) {
  const statusClass = task.done ? 'task--done' : '';
  const checked = task.done ? '✓' : '';
  return `<li class="task ${statusClass}" data-task-id="${task.id}">
    <div class="task__meta">
      <button class="check" data-toggle aria-label="${task.done ? 'Вернуть в работу' : 'Отметить выполненным'}">${checked}</button>
      <p class="task__date">${formatCreatedAt(task.createdAt)}</p>
      <button class="delete" data-delete aria-label="Удалить дело">×</button>
    </div>
    <button class="task__title" data-edit>${escapeHtml(task.title)}</button>
  </li>`;
}

/**
 * Форматирует UTC-время создания в короткую русскую дату для карточки дела.
 * @param {string} createdAt Строка ISO 8601, возвращённая API.
 * @returns {string} Дата вида «Сегодня · 9 нояб. 2026 г.».
 */
function formatCreatedAt(createdAt) {
  const date = new Date(createdAt);
  const month = ['янв.', 'февр.', 'мар.', 'апр.', 'мая', 'июн.', 'июл.', 'авг.', 'сент.', 'окт.', 'нояб.', 'дек.'][date.getUTCMonth()];
  const dateText = `${date.getUTCDate()} ${month} ${date.getUTCFullYear()} г.`;
  const now = new Date();
  const isToday = date.getUTCFullYear() === now.getUTCFullYear()
    && date.getUTCMonth() === now.getUTCMonth()
    && date.getUTCDate() === now.getUTCDate();
  return isToday ? `Сегодня · ${dateText}` : dateText;
}

/**
 * Назначает обработчики формы и списка после отрисовки рабочего пространства.
 * @returns {void} Подключает действия пользователя.
 */
function bindWorkspaceEvents() {
  document.querySelector('[data-logout]').addEventListener('click', logout);
  document.querySelector('[data-run-form]').addEventListener('submit', selectRun);
  document.querySelector('[data-refresh]').addEventListener('click', refreshTasks);
  document.querySelector('[data-add-form]').addEventListener('submit', addTask);
  document.querySelector('[data-task-list]').addEventListener('click', handleTaskAction);
}

/**
 * Проверяет токен запросом автора и открывает рабочее пространство.
 * @param {SubmitEvent} event Событие формы входа.
 * @returns {Promise<void>} Завершённая авторизация.
 */
async function login(event) {
  event.preventDefault();
  const token = new FormData(event.currentTarget).get('token');
  state.api = createApi(token);
  try {
    state.author = await state.api.author();
    await refreshTasks();
  } catch (error) {
    showError(error.message);
  }
}

/**
 * Загружает актуальные данные выбранного запуска и повторно рисует интерфейс.
 * @returns {Promise<void>} Завершённое чтение PostgreSQL через API.
 */
async function refreshTasks() {
  try {
    state.tasks = await state.api.listTasks(state.runId);
    renderWorkspace();
  } catch (error) {
    showError(error.message);
  }
}

/**
 * Выбирает новый runId и получает задачи этой группы.
 * @param {SubmitEvent} event Событие формы выбора запуска.
 * @returns {Promise<void>} Завершённая загрузка выбранной группы.
 */
async function selectRun(event) {
  event.preventDefault();
  const runId = new FormData(event.currentTarget).get('runId').trim();
  if (!/^[A-Za-z0-9_-]{1,64}$/.test(runId)) return showError('runId имеет недопустимый формат');
  state.runId = runId;
  await refreshTasks();
}

/**
 * Добавляет дело текущему запуску через POST API.
 * @param {SubmitEvent} event Событие формы нового дела.
 * @returns {Promise<void>} Завершённое создание.
 */
async function addTask(event) {
  event.preventDefault();
  const title = new FormData(event.currentTarget).get('title');
  try {
    await state.api.createTask({ title, runId: state.runId });
    await refreshTasks();
  } catch (error) {
    showError(error.message);
  }
}

/**
 * Обрабатывает переключение, редактирование и удаление выбранного дела.
 * @param {MouseEvent} event Нажатие на элемент строки дела.
 * @returns {Promise<void>} Завершённое действие пользователя.
 */
async function handleTaskAction(event) {
  const row = event.target.closest('[data-task-id]');
  if (!row) return;
  const task = state.tasks.find((item) => item.id === row.dataset.taskId);
  try {
    if (event.target.closest('[data-toggle]')) await state.api.updateTask(task.id, { done: !task.done });
    if (event.target.closest('[data-delete]')) await state.api.deleteTask(task.id);
    if (event.target.closest('[data-edit]')) {
      const title = window.prompt('Новое название дела', task.title);
      if (title !== null) await state.api.updateTask(task.id, { title });
    }
    await refreshTasks();
  } catch (error) {
    showError(error.message);
  }
}

/**
 * Очищает данные текущей вкладки и возвращает пользователя на экран входа.
 * @returns {void} Отрисовывает форму токена.
 */
function logout() {
  state.api = null;
  state.author = null;
  state.tasks = [];
  renderLogin();
}

renderLogin();
