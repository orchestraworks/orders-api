import { buildApp } from "../src/app";
import { createPool } from "../src/db";

export const pool = createPool();
export const app = buildApp({ pool });

export async function resetDatabase(): Promise<void> {
  await pool.query("truncate order_lines, orders, products, customers restart identity cascade");
}

export async function createCustomer(body: { name?: string; email?: string } = {}) {
  const response = await app.inject({
    method: "POST",
    url: "/customers",
    payload: { name: "Ada Lovelace", email: "ada@example.com", ...body },
  });
  if (response.statusCode !== 201) throw new Error(`createCustomer: ${response.statusCode} ${response.body}`);
  return response.json<{ id: number; name: string; email: string }>();
}

export async function createProduct(body: { sku?: string; name?: string; price?: string } = {}) {
  const response = await app.inject({
    method: "POST",
    url: "/products",
    payload: { sku: "MUG-01", name: "Coffee mug", price: "15.00", ...body },
  });
  if (response.statusCode !== 201) throw new Error(`createProduct: ${response.statusCode} ${response.body}`);
  return response.json<{ id: number; sku: string; name: string; price: string }>();
}

export async function createOrder(customerId: number, lines: { productId: number; quantity: number }[]) {
  const response = await app.inject({
    method: "POST",
    url: "/orders",
    payload: { customerId, lines },
  });
  if (response.statusCode !== 201) throw new Error(`createOrder: ${response.statusCode} ${response.body}`);
  return response.json<{ id: number; total: string }>();
}
