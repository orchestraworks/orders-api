import { CreateProduct, formatPrice } from "@orders/core";
import type { FastifyInstance } from "fastify";
import type pg from "pg";
import { isUniqueViolation } from "../db";
import { HttpError } from "../errors";

type ProductRow = {
  id: number;
  sku: string;
  name: string;
  price_cents: number;
};

const toProduct = (row: ProductRow) => ({
  id: row.id,
  sku: row.sku,
  name: row.name,
  price: formatPrice(row.price_cents),
});

export function productRoutes(app: FastifyInstance, pool: pg.Pool) {
  app.post("/products", async (request, reply) => {
    const input = CreateProduct.parse(request.body);
    try {
      const { rows } = await pool.query<ProductRow>(
        "insert into products (sku, name, price_cents) values ($1, $2, $3) returning id, sku, name, price_cents",
        [input.sku, input.name, input.price],
      );
      return reply.code(201).send(toProduct(rows[0]));
    } catch (error) {
      if (isUniqueViolation(error)) {
        throw new HttpError(409, "A product with that SKU already exists");
      }
      throw error;
    }
  });

  app.get("/products", async () => {
    const { rows } = await pool.query<ProductRow>("select id, sku, name, price_cents from products order by name");
    return { products: rows.map(toProduct) };
  });
}
