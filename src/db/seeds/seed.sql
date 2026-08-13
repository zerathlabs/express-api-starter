INSERT INTO "user" (id, name, email)
VALUES ('usr_sample_1', 'John Doe', 'john@example.com')
ON CONFLICT (id) DO NOTHING;

INSERT INTO task (id, title, description, status, user_id)
VALUES
  ('task_1', 'Setup project', 'Initialize the SaaS starter kit', 'done', 'usr_sample_1'),
  ('task_2', 'Add authentication', 'Implement JWT auth module', 'in_progress', 'usr_sample_1'),
  ('task_3', 'Write API docs', NULL, 'todo', 'usr_sample_1')
ON CONFLICT (id) DO NOTHING;
