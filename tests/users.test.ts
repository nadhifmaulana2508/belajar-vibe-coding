import { describe, it, expect, beforeEach } from "bun:test";
import { app } from "../src/index";
import { db } from "../db";
import { users, session } from "../db/schema";
import { sql } from "drizzle-orm";

// Helper untuk membuat request lebih ringkas
const request = async (path: string, method: string, body?: any, token?: string) => {
  const headers: Record<string, string> = { "Content-Type": "application/json" };
  if (token) headers["Authorization"] = `Bearer ${token}`;

  return await app.handle(
    new Request(`http://localhost${path}`, {
      method,
      headers,
      body: body ? JSON.stringify(body) : undefined,
    })
  );
};

// Shorthand helpers
const post = (path: string, body: any, token?: string) => request(path, "POST", body, token);
const get = (path: string, token?: string) => request(path, "GET", undefined, token);
const del = (path: string, token?: string) => request(path, "DELETE", undefined, token);

describe("Users API", () => {
  beforeEach(async () => {
    await db.execute(sql`DELETE FROM session`);
    await db.execute(sql`DELETE FROM users`);
  });

  describe("POST /api/users", () => {
    it("should register a new user successfully", async () => {
      const response = await post("/api/users", {
        name: "Test User",
        email: "test@example.com",
        password: "securepassword123",
      });

      const body: any = await response.json();
      expect(response.status).toBe(200);
      expect(body.data.email).toBe("test@example.com");
    });

    it("should fail if password is too short", async () => {
      const response = await post("/api/users", {
        name: "Test User",
        email: "test@example.com",
        password: "short",
      });

      expect(response.status).toBe(400);
    });
  });

  describe("POST /api/users/login", () => {
    beforeEach(async () => {
      await post("/api/users", {
        name: "Login User",
        email: "login@example.com",
        password: "loginpassword123",
      });
    });

    it("should login successfully and return a token", async () => {
      const response = await post("/api/users/login", {
        email: "login@example.com",
        password: "loginpassword123",
      });

      const body: any = await response.json();
      expect(response.status).toBe(200);
      expect(body.data).toBeDefined();
    });
  });

  describe("Protected Routes", () => {
    let token: string;

    beforeEach(async () => {
      await post("/api/users", {
        name: "Auth User",
        email: "auth@example.com",
        password: "authpassword123",
      });

      const loginRes = await post("/api/users/login", {
        email: "auth@example.com",
        password: "authpassword123",
      });
      const loginBody: any = await loginRes.json();
      token = loginBody.data;
    });

    it("should get current user profile", async () => {
      const response = await get("/api/users/current", token);
      const body: any = await response.json();
      expect(response.status).toBe(200);
      expect(body.data.email).toBe("auth@example.com");
    });

    it("should logout successfully", async () => {
      const response = await del("/api/users/logout", token);
      expect(response.status).toBe(200);

      const verifyRes = await get("/api/users/current", token);
      expect(verifyRes.status).toBe(401);
    });
  });
});
