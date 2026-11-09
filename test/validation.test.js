import test from 'node:test';
import assert from 'node:assert/strict';
import { HttpError } from '../server/utils/http-error.js';
import { parseCreateTask, parseTaskId, parseUpdateTask } from '../server/utils/validation.js';

test('POST принимает title и runId и обрезает пробелы в title', () => {
  assert.deepEqual(parseCreateTask({ title: '  Позвонить  ', runId: 'manual_1' }), { title: 'Позвонить', runId: 'manual_1' });
});

test('POST отклоняет лишнее поле', () => {
  assert.throws(() => parseCreateTask({ title: 'Дело', runId: 'a', done: false }), HttpError);
});

test('PATCH требует хотя бы одно разрешённое поле', () => {
  assert.throws(() => parseUpdateTask({}), HttpError);
  assert.deepEqual(parseUpdateTask({ done: true }), { done: true });
});

test('некорректный UUID даёт ошибку валидации до запроса к БД', () => {
  assert.throws(() => parseTaskId('not-a-uuid'), HttpError);
});
