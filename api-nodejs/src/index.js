const express = require("express");
const { Pool } = require("pg");

const app = express();
const PORT = process.env.PORT || 3000;
const DEFAULTS = {
  PGHOST: 'db',
  PGUSER: 'user',
  PGPASSWORD: 'pass',
  PGDATABASE: 'appdb',
  PGPORT: '5432',
};
const pgConfig = {
  host: process.env.PGHOST || DEFAULTS.PGHOST,
  user: process.env.PGUSER  || DEFAULTS.PGUSER,
  password: process.env.PGPASSWORD || DEFAULTS.PGPASSWORD,
  database: process.env.PGDATABASE || DEFAULTS.PGDATABASE,
  port: process.env.PGPORT ? parseInt(process.env.PGPORT, 10) : parseInt(DEFAULTS.PGPORT, 10),
};

app.get("/", (req, res) => {
  res.json({ message: "Node.js API is running!" });
});

const pool = new Pool(pgConfig);

async function waitForDb({ retries = 10, delay = 2000 } = {}) {
  let attempt = 0;
  while (attempt < retries) {
    try {
      attempt++;
      const client = await pool.connect();
      await client.query('SELECT 1');
      client.release();
      console.log(`Connected to Postgres on attempt ${attempt}`);
      return;
    } catch (err) {
      console.warn(`Postgres not ready (attempt ${attempt}/${retries}): ${err.message}`);
      await new Promise(r => setTimeout(r, delay));
      delay = Math.min(delay * 1.5, 10000);
    }
  }
  throw new Error(`Could not connect to Postgres after ${retries} attempts`);
}

(async () => {
  try {
    await waitForDb({ retries: 20, delay: 2000 });
    startServer();
  } catch (err) {
    console.error('Fatal: DB did not become ready:', err);
  }
})();

pool.on('error', (err, client) => {
  console.error('Unexpected error on idle client', err);
});

app.get("/db", async (req, res) => {
  try {
    const result = await pool.query("SELECT * FROM test");
    res.json(result.rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Error querying database!" });
  }
});

app.get("/db/add/:name", async (req, res) => {
  const name = req.params.name;
  try {
    await pool.query("INSERT INTO test (name) VALUES ($1)", [name]);
    res.json({ message: `Successfully inserted: ${name}` });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Error inserting!" });
  }
});

//const server = app.listen(PORT, '0.0.0.0', () => console.log(`Node.js API running on port ${PORT}`));
let server;

function startServer() {
  server = app.listen(PORT, '0.0.0.0', () => console.log(`Node.js API running on port ${PORT}`));
}

function gracefulShutdown(signal) {
  console.log(`\nReceived ${signal} - starting graceful shutdown...`);

  server.close(err => {
    if (err) {
      console.error("Error closing server:", err);
      process.exit(1);
    }
    console.log("HTTP server closed!");
    process.exit(0);
  });

  setTimeout(() => {
    console.error("Timeout of graceful shutdown - forcing exit(1)");
    process.exit(1);
  }, 30_000); // 30s
}

process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
process.on('SIGINT', () => gracefulShutdown('SIGINT'));

process.on('uncaughtException', (err) => {
  console.error('uncaughtException', err);
  process.exit(1);
});
process.on('unhandledRejection', (reason) => {
  console.error('unhandledRejection', reason);
});
