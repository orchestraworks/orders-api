import { describe, expect, it } from "vitest";
import { app, createProduct, pool } from "./helpers";

describe("POST /products", () => {
  it("creates a product and stores the price in cents", async () => {
    const response = await app.inject({
      method: "POST",
      url: "/products",
      payload: { sku: "BTL-01", name: "Water bottle", price: "19.99" },
    });

    expect(response.statusCode).toBe(201);
    expect(response.json()).toMatchObject({ id: 1, sku: "BTL-01", name: "Water bottle", price: "19.99" });
    const { rows } = await pool.query("select price_cents from products where sku = 'BTL-01'");
    expect(rows).toEqual([{ price_cents: 1999 }]);
  });

  it("rejects a malformed price", async () => {
    const response = await app.inject({
      method: "POST",
      url: "/products",
      payload: { sku: "BTL-01", name: "Water bottle", price: "19.999" },
    });

    expect(response.statusCode).toBe(400);
  });

  it("rejects a duplicate sku", async () => {
    await createProduct({ sku: "BTL-01" });

    const response = await app.inject({
      method: "POST",
      url: "/products",
      payload: { sku: "BTL-01", name: "Another bottle", price: "9.00" },
    });

    expect(response.statusCode).toBe(409);
  });
});

describe("GET /products", () => {
  it("lists products by name", async () => {
    await createProduct({ sku: "TEE-01", name: "T-shirt", price: "25.00" });
    await createProduct({ sku: "MUG-01", name: "Coffee mug", price: "12.99" });

    const response = await app.inject({ method: "GET", url: "/products" });

    expect(response.statusCode).toBe(200);
    expect(response.json().products).toEqual([
      { id: 2, sku: "MUG-01", name: "Coffee mug", price: "12.99" },
      { id: 1, sku: "TEE-01", name: "T-shirt", price: "25.00" },
    ]);
  });
});
