import { readdir, readFile } from "node:fs/promises";
import { join } from "node:path";
import { fileURLToPath } from "node:url";
import { createPool, withTransaction } from "../src/db";

const migrationsDir = fileURLToPath(new URL("../migrations/", import.meta.url));
const pool = createPool();

try {
  await pool.query(
    "create table if not exists schema_migrations (name text primary key, applied_at timestamptz not null default now())",
  );
  const { rows } = await pool.query<{ name: string }>("select name from schema_migrations");
  const applied = new Set(rows.map((row) => row.name));

  const files = (await readdir(migrationsDir)).filter((file) => file.endsWith(".sql")).sort();
  for (const file of files) {
    if (applied.has(file)) continue;
    const sql = await readFile(join(migrationsDir, file), "utf8");
    await withTransaction(pool, async (client) => {
      await client.query(sql);
      await client.query("insert into schema_migrations (name) values ($1)", [file]);
    });
    console.log(`applied ${file}`);
  }
  console.log("database is up to date");
} finally {
  await pool.end();
}
