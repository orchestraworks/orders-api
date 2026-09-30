import { describe, expect, it } from "vitest";
import { app, createCustomer, pool } from "./helpers";

describe("POST /customers", () => {
  it("creates a customer", async () => {
    const response = await app.inject({
      method: "POST",
      url: "/customers",
      payload: { name: "Grace Hopper", email: "Grace@Example.com" },
    });

    expect(response.statusCode).toBe(201);
    expect(response.json()).toMatchObject({ id: 1, name: "Grace Hopper", email: "grace@example.com" });
    const { rows } = await pool.query("select name, email from customers");
    expect(rows).toEqual([{ name: "Grace Hopper", email: "grace@example.com" }]);
  });

  it("rejects an invalid email", async () => {
    const response = await app.inject({
      method: "POST",
      url: "/customers",
      payload: { name: "Grace Hopper", email: "grace" },
    });

    expect(response.statusCode).toBe(400);
  });

  it("rejects a second customer with the same email", async () => {
    await createCustomer({ email: "ada@example.com" });

    const response = await app.inject({
      method: "POST",
      url: "/customers",
      payload: { name: "Someone Else", email: "ada@example.com" },
    });

    expect(response.statusCode).toBe(409);
  });
});

describe("GET /customers/:id", () => {
  it("returns the customer", async () => {
    const customer = await createCustomer();

    const response = await app.inject({ method: "GET", url: `/customers/${customer.id}` });

    expect(response.statusCode).toBe(200);
    expect(response.json()).toMatchObject({ id: customer.id, name: "Ada Lovelace" });
  });

  it("returns 404 for an unknown customer", async () => {
    const response = await app.inject({ method: "GET", url: "/customers/999" });

    expect(response.statusCode).toBe(404);
  });
});

describe("GET /customers", () => {
  it("lists customers by name", async () => {
    await createCustomer({ name: "Grace Hopper", email: "grace@example.com" });
    await createCustomer({ name: "Ada Lovelace", email: "ada@example.com" });

    const response = await app.inject({ method: "GET", url: "/customers" });

    expect(response.statusCode).toBe(200);
    expect(response.json().customers.map((c: { name: string }) => c.name)).toEqual([
      "Ada Lovelace",
      "Grace Hopper",
    ]);
  });

  it("searches by name", async () => {
    await createCustomer({ name: "Ada Lovelace", email: "ada@example.com" });
    await createCustomer({ name: "Grace Hopper", email: "grace@example.com" });

    const response = await app.inject({ method: "GET", url: "/customers?q=Ada" });

    expect(response.statusCode).toBe(200);
    expect(response.json().customers.map((c: { name: string }) => c.name)).toEqual(["Ada Lovelace"]);
  });

  it("searches by email", async () => {
    await createCustomer({ name: "Ada Lovelace", email: "ada@example.com" });
    await createCustomer({ name: "Grace Hopper", email: "grace@navy.example" });

    const response = await app.inject({ method: "GET", url: "/customers?q=navy" });

    expect(response.json().customers.map((c: { name: string }) => c.name)).toEqual(["Grace Hopper"]);
  });
});
