CREATE TABLE IF NOT EXISTS test (
  id SERIAL PRIMARY KEY,
  name TEXT NOT NULL
);
INSERT INTO test (name) VALUES ('Docker Compose is up and working!');