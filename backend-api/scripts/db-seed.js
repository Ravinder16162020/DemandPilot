import { readFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

import dotenv from "dotenv";
import pg from "pg";

dotenv.config();

const { Pool } = pg;
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function main() {
  const sqlPath = path.resolve(__dirname, "../database/seed.sql");
  const sql = await readFile(sqlPath, "utf8");
  const pool = new Pool({ connectionString: process.env.DATABASE_URL });

  try {
    await pool.query(sql);
    console.log("Database seed completed");
  } finally {
    await pool.end();
  }
}

main().catch((error) => {
  console.error("Failed to seed database", error);
  process.exitCode = 1;
});
