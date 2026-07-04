import { describe, expect, it, vi, beforeAll, afterAll } from "vitest";
import request from "supertest";
import { prisma } from "@/prisma.js";
import { clearDatabase } from "../../../../../tests/helpers.js";

// We must mock the env BEFORE any other imports that depend on it
vi.mock("@config/env.js", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@config/env.js")>();
  return {
    ...actual,
    env: {
      ...actual.env,
      NODE_ENV: "production",
      SESSION_SECRET: "test-secret-123456",
    },
  };
});

// Import after the mock
import { createApp } from "@/app.js";

describe("Session Cookie in Production (HTTP)", () => {
  let app: any;

  beforeAll(async () => {
    app = createApp();
    await clearDatabase();
    
    // Register a test user directly via the API
    await request(app)
      .post("/api/auth/register")
      .send({ email: "test@example.com", name: "Test User", password: "password123" })
      .expect(201);
  });

  afterAll(async () => {
    await prisma.$disconnect();
    vi.restoreAllMocks();
  });

  it("should set a session cookie when logging in over HTTP in production mode", async () => {
    const res = await request(app)
      .post("/api/auth/login")
      .send({ email: "test@example.com", password: "password123" })
      .expect(200);

    const cookies = res.headers["set-cookie"];
    expect(cookies).toBeDefined();
    expect(cookies.length).toBeGreaterThan(0);
    
    // It should NOT have the 'Secure' flag if we hit it over plain HTTP
    const sessionCookie = (Array.isArray(cookies) ? cookies : [cookies]).find((c: string) => c.includes("connect.sid"));
    expect(sessionCookie).toBeDefined();
    expect(sessionCookie).not.toMatch(/Secure/i);
  });

  it("should set a Secure session cookie when logging in behind an HTTPS proxy", async () => {
    const res = await request(app)
      .post("/api/auth/login")
      .set("X-Forwarded-Proto", "https")
      .send({ email: "test@example.com", password: "password123" })
      .expect(200);

    const cookies = res.headers["set-cookie"];
    expect(cookies).toBeDefined();
    
    // With trust proxy = 1, it should recognize HTTPS and set the Secure flag
    const sessionCookie = (Array.isArray(cookies) ? cookies : [cookies]).find((c: string) => c.includes("connect.sid"));
    expect(sessionCookie).toBeDefined();
    expect(sessionCookie).toMatch(/Secure/i);
  });
});
