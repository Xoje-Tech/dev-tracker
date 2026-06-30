import { afterAll, beforeAll, beforeEach, describe, expect, it } from "vitest";
import request from "supertest";
import type { Express } from "express";
import { createApp } from "@/app.js";
import { prisma } from "@/prisma.js";
import { authResponseDtoSchema } from "@auth/application/dto/auth-response-dto.js";
import { clearDatabase } from "../../../../../../../tests/helpers.js";

/**
 * Integration tests for /api/auth/me.
 *
 * Verifies that the response shape matches authResponseDtoSchema
 * (i.e. includes id, email, name, AND apiKey) — see F4 backend fix.
 *
 * Uses supertest against the real createApp() composition root so the full
 * middleware chain (session cookie → auth strategy → controller) is exercised.
 */
describe("GET /api/auth/me", () => {
  let app: Express;

  beforeAll(() => {
    app = createApp();
  });

  afterAll(async () => {
    await prisma.$disconnect();
  });

  beforeEach(async () => {
    await clearDatabase();
  });

  it("returns the full user shape including apiKey after register", async () => {
    const registerRes = await request(app).post("/api/auth/register").send({
      email: "me-shape@test.com",
      name: "Me Shape",
      password: "password123",
    });

    expect(registerRes.status).toBe(201);
    expect(registerRes.body).toMatchObject({
      email: "me-shape@test.com",
      name: "Me Shape",
    });
    // Register response already includes apiKey (null on first registration).
    expect("apiKey" in registerRes.body).toBe(true);

    const cookies = registerRes.headers["set-cookie"];
    expect(cookies).toBeDefined();

    const meRes = await request(app).get("/api/auth/me").set("Cookie", cookies!);

    expect(meRes.status).toBe(200);
    // Schema-level assertion — the source of truth for the contract.
    const parsed = authResponseDtoSchema.safeParse(meRes.body);
    expect(parsed.success).toBe(true);
    // Explicit field-by-field check so the test failure message is clear.
    expect(meRes.body).toEqual({
      id: expect.any(String),
      email: "me-shape@test.com",
      name: "Me Shape",
      apiKey: null,
    });
  });

  it("reflects a rotated apiKey on subsequent /me calls", async () => {
    const registerRes = await request(app).post("/api/auth/register").send({
      email: "rotate@test.com",
      name: "Rotate",
      password: "password123",
    });
    const cookies = registerRes.headers["set-cookie"]!;

    const rotateRes = await request(app)
      .post("/api/auth/rotate-api-key")
      .set("Cookie", cookies);
    expect(rotateRes.status).toBe(200);
    expect(typeof rotateRes.body.apiKey).toBe("string");
    const rotatedKey = rotateRes.body.apiKey;

    const meRes = await request(app).get("/api/auth/me").set("Cookie", cookies);

    expect(meRes.status).toBe(200);
    expect(authResponseDtoSchema.safeParse(meRes.body).success).toBe(true);
    expect(meRes.body.apiKey).toBe(rotatedKey);
  });

  it("returns 401 when no session cookie is provided", async () => {
    const meRes = await request(app).get("/api/auth/me");
    expect(meRes.status).toBe(401);
  });
});