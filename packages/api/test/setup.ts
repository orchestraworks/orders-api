import { afterAll, beforeEach } from "vitest";
import { app, pool, resetDatabase } from "./helpers";

beforeEach(async () => {
  await resetDatabase();
});

afterAll(async () => {
  await app.close();
  await pool.end();
});
