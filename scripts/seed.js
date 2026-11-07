import { readFile } from "node:fs/promises";
import pool from "../src/config/db.config.js";

pool.options.connectionTimeoutMillis = 5000;

try {
  const seedSql = await readFile(new URL("../database/seed-rbac.sql", import.meta.url), "utf8");
  const client = await pool.connect();
  try {
    await client.query(seedSql);
    console.log("Successfully seeded RBAC data from seed-rbac.sql!");
  } finally {
    client.release();
  }
} catch (error) {
  console.error("Seeding failed:", error.message);
  process.exitCode = 1;
} finally {
  await pool.end();
}
