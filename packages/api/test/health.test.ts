import { describe, expect, it } from "vitest";
import { app } from "./helpers";

describe("GET /health", () => {
  it("reports ok when the database answers", async () => {
    const response = await app.inject({ method: "GET", url: "/health" });

    expect(response.statusCode).toBe(200);
    expect(response.json()).toEqual({ ok: true });
  });
});
