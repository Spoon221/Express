CREATE EXTENSION IF NOT EXISTS pgcrypto;

CREATE TABLE IF NOT EXISTS tasks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_login VARCHAR(128) NOT NULL,
  title VARCHAR(200) NOT NULL CHECK (char_length(btrim(title)) BETWEEN 1 AND 200),
  done BOOLEAN NOT NULL DEFAULT FALSE,
  run_id VARCHAR(64) NOT NULL CHECK (run_id ~ '^[A-Za-z0-9_-]{1,64}$'),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS tasks_owner_run_id_idx ON tasks (owner_login, run_id, created_at DESC);

-- Создайте эту роль только после замены пароля и передайте её преподавателю личным сообщением.
-- CREATE ROLE todo_reviewer LOGIN PASSWORD 'replace_with_unique_password';
-- GRANT CONNECT ON DATABASE todo_students TO todo_reviewer;
-- GRANT USAGE ON SCHEMA public TO todo_reviewer;
-- GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE tasks TO todo_reviewer;
