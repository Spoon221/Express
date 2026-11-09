-- Выполняется администратором БД после инициализации базы.
-- Роль имеет права только на учебную таблицу tasks.
CREATE ROLE todo_reviewer LOGIN PASSWORD 'replace_with_unique_password';
GRANT CONNECT ON DATABASE todo_students TO todo_reviewer;
GRANT USAGE ON SCHEMA public TO todo_reviewer;
GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE tasks TO todo_reviewer;
