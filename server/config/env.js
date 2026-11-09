import 'dotenv/config';

/**
 * Проверяет обязательные параметры окружения и возвращает конфигурацию приложения.
 * @returns {object} Конфигурация, необходимая серверу для безопасного запуска.
 */
export function getConfig() {
  const requiredKeys = ['MOODLE_LOGIN', 'MOODLE_FULL_NAME', 'API_TOKEN', 'DATABASE_URL'];
  const absentKeys = requiredKeys.filter((key) => !process.env[key]?.trim());

  if (absentKeys.length > 0) {
    throw new Error(`Не заданы переменные окружения: ${absentKeys.join(', ')}`);
  }

  return Object.freeze({
    apiToken: process.env.API_TOKEN,
    corsOrigins: (process.env.CORS_ORIGIN || 'http://localhost:5173').split(',').map((origin) => origin.trim()).filter(Boolean),
    databaseUrl: process.env.DATABASE_URL,
    fullName: process.env.MOODLE_FULL_NAME,
    login: process.env.MOODLE_LOGIN,
    nodeEnv: process.env.NODE_ENV || 'development',
    port: Number(process.env.PORT || 3000),
  });
}
