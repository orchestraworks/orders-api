import { CreateCustomer, CustomerQuery, IdParam } from "@orders/core";
import type { FastifyInstance } from "fastify";
import type pg from "pg";
import { isUniqueViolation } from "../db";
import { HttpError, notFound } from "../errors";

type CustomerRow = {
  id: number;
  name: string;
  email: string;
  created_at: Date;
};

const toCustomer = (row: CustomerRow) => ({
  id: row.id,
  name: row.name,
  email: row.email,
  createdAt: row.created_at,
});

export function customerRoutes(app: FastifyInstance, pool: pg.Pool) {
  app.post("/customers", async (request, reply) => {
    const input = CreateCustomer.parse(request.body);
    try {
      const { rows } = await pool.query<CustomerRow>(
        "insert into customers (name, email) values ($1, $2) returning *",
        [input.name, input.email],
      );
      return reply.code(201).send(toCustomer(rows[0]));
    } catch (error) {
      if (isUniqueViolation(error)) {
        throw new HttpError(409, "A customer with that email already exists");
      }
      throw error;
    }
  });

  app.get("/customers", async (request) => {
    const { q } = CustomerQuery.parse(request.query);
    const { rows } = q
      ? await pool.query<CustomerRow>(
          "select * from customers where name ilike $1 or email ilike $1 order by name limit 50",
          [`%${q}%`],
        )
      : await pool.query<CustomerRow>("select * from customers order by name limit 50");
    return { customers: rows.map(toCustomer) };
  });

  app.get("/customers/:id", async (request) => {
    const { id } = IdParam.parse(request.params);
    const { rows } = await pool.query<CustomerRow>("select * from customers where id = $1", [id]);
    if (rows.length === 0) {
      throw notFound("Customer");
    }
    return toCustomer(rows[0]);
  });
}
