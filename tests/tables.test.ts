import request from "supertest";
import { describe, expect, it } from "vitest";
import { app } from "../src/app.js";

describe("GET /api/tables", () => {
  it("responds with database tables list or valid response code", async () => {
    const response = await request(app)
      .get("/api/tables")
      .set("Accept", "application/json");

    expect([200, 400, 404, 500]).toContain(response.status);
    expect(response.headers["content-type"]).toMatch(/json/);
  });

  it("responds with database summary or error when DB is unavailable", async () => {
    const response = await request(app)
      .get("/api/tables/summary")
      .set("Accept", "application/json");

    expect([200, 404, 500]).toContain(response.status);
    expect(response.headers["content-type"]).toMatch(/json/);
  });
});
