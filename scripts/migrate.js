import { readFile, readdir } from "node:fs/promises";
import pool from "../src/config/db.config.js";

// These migrations are idempotent; never run schema.sql automatically on an existing database.
pool.options.connectionTimeoutMillis = 5000;
const directory = new URL("../database/migrations/", import.meta.url);
try {
  const files = (await readdir(directory)).filter((name) => /^\d+_[a-z0-9_]+\.sql$/.test(name)).sort();
  const client = await pool.connect();
  try {
    for (const name of files) {
      await client.query(await readFile(new URL(name, directory), "utf8"));
      console.log(`Applied ${name}`);
    }
  } catch (error) {
    await client.query("ROLLBACK").catch(() => {});
    throw error;
  } finally {
    client.release();
  }
} catch (error) {
  console.error(`Migration failed (${error.code ?? "UNKNOWN_ERROR"}). Check PostgreSQL availability and database configuration.`);
  process.exitCode = 1;
} finally {
  await pool.end();
}
