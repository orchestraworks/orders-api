import { describe, expect, it } from "vitest";
import {
  CreateCustomer,
  CreateOrder,
  CreateProduct,
  CustomerQuery,
  IdParam,
  OrderStatus,
  PageQuery,
  UpdateOrder,
} from "../src/validation";

describe("CreateCustomer", () => {
  it("trims the name and lowercases the email", () => {
    expect(CreateCustomer.parse({ name: "  Ada Lovelace ", email: "Ada@Example.com" })).toEqual({
      name: "Ada Lovelace",
      email: "ada@example.com",
    });
  });

  it("rejects an invalid email", () => {
    expect(CreateCustomer.safeParse({ name: "Ada", email: "not-an-email" }).success).toBe(false);
  });

  it("rejects an empty name", () => {
    expect(CreateCustomer.safeParse({ name: "   ", email: "ada@example.com" }).success).toBe(false);
  });
});

describe("CreateProduct", () => {
  it("turns the price into cents", () => {
    expect(CreateProduct.parse({ sku: "MUG-01", name: "Coffee mug", price: "12.99" })).toEqual({
      sku: "MUG-01",
      name: "Coffee mug",
      price: 1299,
    });
  });

  it("rejects a price with more than two decimals", () => {
    expect(CreateProduct.safeParse({ sku: "MUG-01", name: "Mug", price: "12.999" }).success).toBe(false);
  });

  it("rejects a lowercase sku", () => {
    expect(CreateProduct.safeParse({ sku: "mug-01", name: "Mug", price: "12.99" }).success).toBe(false);
  });
});

describe("CreateOrder", () => {
  it("accepts an order with lines", () => {
    const input = { customerId: 1, lines: [{ productId: 2, quantity: 3 }] };
    expect(CreateOrder.parse(input)).toEqual(input);
  });

  it("requires at least one line", () => {
    expect(CreateOrder.safeParse({ customerId: 1, lines: [] }).success).toBe(false);
  });

  it.each([0, -1, 1.5])("rejects quantity %s", (quantity) => {
    expect(CreateOrder.safeParse({ customerId: 1, lines: [{ productId: 2, quantity }] }).success).toBe(false);
  });
});

describe("OrderStatus", () => {
  it("accepts the known statuses", () => {
    for (const status of ["pending", "paid", "shipped", "canceled"]) {
      expect(OrderStatus.parse(status)).toBe(status);
    }
  });

  it("rejects an unknown status", () => {
    expect(UpdateOrder.safeParse({ status: "lost" }).success).toBe(false);
  });
});

describe("PageQuery", () => {
  it("defaults to the first page of 20", () => {
    expect(PageQuery.parse({})).toEqual({ page: 1, pageSize: 20 });
  });

  it("reads numbers from query strings", () => {
    expect(PageQuery.parse({ page: "3", pageSize: "5" })).toEqual({ page: 3, pageSize: 5 });
  });

  it.each([{ page: "0" }, { pageSize: "101" }, { page: "two" }])("rejects %j", (query) => {
    expect(PageQuery.safeParse(query).success).toBe(false);
  });
});

describe("CustomerQuery", () => {
  it("treats a blank search as no search", () => {
    expect(CustomerQuery.parse({ q: "  " })).toEqual({ q: undefined });
  });
});

describe("IdParam", () => {
  it("reads the id from a path segment", () => {
    expect(IdParam.parse({ id: "42" })).toEqual({ id: 42 });
  });

  it("rejects a non-numeric id", () => {
    expect(IdParam.safeParse({ id: "abc" }).success).toBe(false);
  });
});
