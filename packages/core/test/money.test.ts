import { describe, expect, it } from "vitest";
import { formatPrice, parsePrice } from "../src/money";

describe("parsePrice", () => {
  it.each([
    ["19.99", 1999],
    ["5", 500],
    ["0.5", 50],
    ["0.05", 5],
    [" 12.30 ", 1230],
    ["1200.00", 120000],
  ])("parses %j as %i cents", (input, cents) => {
    expect(parsePrice(input)).toBe(cents);
  });

  it.each(["", "abc", "-1", "1.999", "1,00", ".50", "12345678"])("rejects %j", (input) => {
    expect(() => parsePrice(input)).toThrow(RangeError);
  });
});

describe("formatPrice", () => {
  it.each([
    [1999, "19.99"],
    [5, "0.05"],
    [0, "0.00"],
    [120000, "1200.00"],
  ])("formats %i cents as %j", (cents, text) => {
    expect(formatPrice(cents)).toBe(text);
  });

  it.each([-1, 1.5, Number.NaN])("rejects %s", (cents) => {
    expect(() => formatPrice(cents)).toThrow(RangeError);
  });

  it("round-trips a parsed price", () => {
    expect(formatPrice(parsePrice("42.10"))).toBe("42.10");
  });
});
