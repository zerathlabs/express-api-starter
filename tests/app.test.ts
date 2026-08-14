import request from "supertest";
import { describe, expect, it } from "vitest";
import { app } from "../src/app.js";

describe("GET /", () => {
  it("responds with 200 OK text", async () => {
    const response = await request(app).get("/").expect(200);
    expect(response.text).toBe("OK");
  });
});

describe("GET /non-existent-route", () => {
  it("responds with 404 for undefined routes", async () => {
    await request(app).get("/non-existent-route").expect(404);
  });
});
