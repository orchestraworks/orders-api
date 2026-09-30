import Fastify, { type FastifyError } from "fastify";
import type pg from "pg";
import { ZodError } from "zod";
import { HttpError } from "./errors";
import { customerRoutes } from "./routes/customers";
import { orderRoutes } from "./routes/orders";
import { productRoutes } from "./routes/products";

export function buildApp({ pool, logger = false }: { pool: pg.Pool; logger?: boolean }) {
  const app = Fastify({ logger });

  app.setErrorHandler<FastifyError>((error, request, reply) => {
    if (error instanceof ZodError) {
      return reply.code(400).send({ error: "Invalid request", issues: error.issues });
    }
    if (error instanceof HttpError) {
      return reply.code(error.statusCode).send({ error: error.message });
    }
    if (error.statusCode && error.statusCode < 500) {
      return reply.code(error.statusCode).send({ error: error.message });
    }
    request.log.error(error);
    return reply.code(500).send({ error: "Internal server error" });
  });

  app.get("/health", async () => {
    await pool.query("select 1");
    return { ok: true };
  });

  customerRoutes(app, pool);
  productRoutes(app, pool);
  orderRoutes(app, pool);

  return app;
}
