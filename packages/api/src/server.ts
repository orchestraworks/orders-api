import "./env";
import { buildApp } from "./app";
import { createPool } from "./db";

const pool = createPool();
const app = buildApp({ pool, logger: true });

await app.listen({
  port: Number(process.env.PORT ?? 3000),
  host: process.env.HOST ?? "0.0.0.0",
});
