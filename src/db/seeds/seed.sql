INSERT INTO users (id, name, email)
VALUES ('usr_sample_1', 'John Doe', 'john@example.com')
ON CONFLICT (id) DO NOTHING;
