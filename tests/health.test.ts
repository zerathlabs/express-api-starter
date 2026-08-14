import request from "supertest";
import { describe, expect, it } from "vitest";
import { app } from "../src/app.js";

describe("GET /api/health", () => {
  it("responds with health status JSON object", async () => {
    const response = await request(app)
      .get("/api/health")
      .set("Accept", "application/json")
      .expect("Content-Type", /json/)
      .expect(200);

    expect(response.body).toHaveProperty("status", "ok");
    expect(response.body).toHaveProperty("timestamp");
    expect(response.body).toHaveProperty("uptime");
  });
});
