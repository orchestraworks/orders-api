import { describe, expect, it } from "vitest";
import { app, createCustomer, createOrder, createProduct, pool } from "./helpers";

describe("POST /orders", () => {
  it("creates an order with its lines and total", async () => {
    const customer = await createCustomer();
    const mug = await createProduct({ sku: "MUG-01", name: "Coffee mug", price: "15.00" });
    const tee = await createProduct({ sku: "TEE-01", name: "T-shirt", price: "10.00" });

    const response = await app.inject({
      method: "POST",
      url: "/orders",
      payload: {
        customerId: customer.id,
        lines: [
          { productId: mug.id, quantity: 2 },
          { productId: tee.id, quantity: 1 },
        ],
      },
    });

    expect(response.statusCode).toBe(201);
    expect(response.json()).toMatchObject({
      id: 1,
      customerId: customer.id,
      status: "pending",
      lineCount: 2,
      total: "40.00",
      lines: [
        { productId: mug.id, sku: "MUG-01", quantity: 2, unitPrice: "15.00" },
        { productId: tee.id, sku: "TEE-01", quantity: 1, unitPrice: "10.00" },
      ],
    });
    const { rows } = await pool.query("select product_id, quantity, unit_price_cents from order_lines order by id");
    expect(rows).toEqual([
      { product_id: mug.id, quantity: 2, unit_price_cents: 1500 },
      { product_id: tee.id, quantity: 1, unit_price_cents: 1000 },
    ]);
  });

  it("rejects an unknown product and writes nothing", async () => {
    const customer = await createCustomer();

    const response = await app.inject({
      method: "POST",
      url: "/orders",
      payload: { customerId: customer.id, lines: [{ productId: 999, quantity: 1 }] },
    });

    expect(response.statusCode).toBe(422);
    const { rows } = await pool.query("select count(*)::int as count from orders");
    expect(rows[0].count).toBe(0);
  });

  it("rejects an unknown customer", async () => {
    const product = await createProduct();

    const response = await app.inject({
      method: "POST",
      url: "/orders",
      payload: { customerId: 999, lines: [{ productId: product.id, quantity: 1 }] },
    });

    expect(response.statusCode).toBe(422);
  });

  it("rejects an order without lines", async () => {
    const customer = await createCustomer();

    const response = await app.inject({
      method: "POST",
      url: "/orders",
      payload: { customerId: customer.id, lines: [] },
    });

    expect(response.statusCode).toBe(400);
  });
});

describe("GET /orders/:id", () => {
  it("returns 404 for an unknown order", async () => {
    const response = await app.inject({ method: "GET", url: "/orders/999" });

    expect(response.statusCode).toBe(404);
  });

  it("keeps the price the product had when the order was placed", async () => {
    const customer = await createCustomer();
    const product = await createProduct({ price: "20.00" });
    const order = await createOrder(customer.id, [{ productId: product.id, quantity: 1 }]);
    await pool.query("update products set price_cents = 3000 where id = $1", [product.id]);

    const response = await app.inject({ method: "GET", url: `/orders/${order.id}` });

    expect(response.json()).toMatchObject({ total: "20.00", lines: [{ unitPrice: "20.00" }] });
  });
});

describe("PATCH /orders/:id", () => {
  it("changes the status", async () => {
    const customer = await createCustomer();
    const product = await createProduct();
    const order = await createOrder(customer.id, [{ productId: product.id, quantity: 1 }]);

    const response = await app.inject({
      method: "PATCH",
      url: `/orders/${order.id}`,
      payload: { status: "paid" },
    });

    expect(response.statusCode).toBe(200);
    expect(response.json()).toMatchObject({ id: order.id, status: "paid" });
    const { rows } = await pool.query("select status from orders where id = $1", [order.id]);
    expect(rows).toEqual([{ status: "paid" }]);
  });

  it("rejects an unknown status", async () => {
    const customer = await createCustomer();
    const product = await createProduct();
    const order = await createOrder(customer.id, [{ productId: product.id, quantity: 1 }]);

    const response = await app.inject({
      method: "PATCH",
      url: `/orders/${order.id}`,
      payload: { status: "lost" },
    });

    expect(response.statusCode).toBe(400);
  });

  it("returns 404 for an unknown order", async () => {
    const response = await app.inject({
      method: "PATCH",
      url: "/orders/999",
      payload: { status: "paid" },
    });

    expect(response.statusCode).toBe(404);
  });
});

describe("GET /orders", () => {
  it("lists orders newest first, one page at a time", async () => {
    const customer = await createCustomer();
    const product = await createProduct({ price: "5.00" });
    for (let i = 0; i < 3; i++) {
      await createOrder(customer.id, [{ productId: product.id, quantity: i + 1 }]);
    }

    const first = await app.inject({ method: "GET", url: "/orders?page=1&pageSize=2" });
    const second = await app.inject({ method: "GET", url: "/orders?page=2&pageSize=2" });

    expect(first.statusCode).toBe(200);
    expect(first.json()).toMatchObject({
      page: 1,
      pageSize: 2,
      orders: [
        { id: 3, total: "15.00", lineCount: 1 },
        { id: 2, total: "10.00", lineCount: 1 },
      ],
    });
    expect(second.json().orders).toMatchObject([{ id: 1, total: "5.00" }]);
  });

  it("rejects a page size over 100", async () => {
    const response = await app.inject({ method: "GET", url: "/orders?pageSize=500" });

    expect(response.statusCode).toBe(400);
  });
});
