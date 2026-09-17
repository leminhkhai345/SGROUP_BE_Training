import {Pool} from "pg";
import { config } from "./env.config.js";

const pool = new Pool({
  host: config.db.host,
  port: config.db.port,
  user: config.db.user,
  password: config.db.password,
  database: config.db.database,
});

export const connectDB = async () => {
  try {
    const client = await pool.connect();
    console.log("Connected to PostgreSQL database successfully!");
    client.release();
  } catch (error) {
    console.error(" Failed to connect to PostgreSQL database:", error.message);
    process.exit(1);
  }
};

export const query = (text, params) => pool.query(text, params);
export default pool;