import { describe, it, expect, beforeEach } from "bun:test";
import { app } from "../src/index";
import { db } from "../db";
import { users, session } from "../db/schema";
import { sql } from "drizzle-orm";

describe("Users API", () => {
  beforeEach(async () => {
    // Clear database before each test to ensure consistency
    await db.execute(sql`DELETE FROM session`);
    await db.execute(sql`DELETE FROM users`);
  });

  describe("POST /api/users", () => {
    it("should register a new user successfully", async () => {
      const response = await app.handle(
        new Request("http://localhost/api/users", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            name: "Test User",
            email: "test@example.com",
            password: "securepassword123",
          }),
        })
      );

      const body = await response.json();
      expect(response.status).toBe(200);
      expect(body.message).toBe("User created successfully");
      expect(body.data.email).toBe("test@example.com");
    });

    it("should fail if password is too short", async () => {
      const response = await app.handle(
        new Request("http://localhost/api/users", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            name: "Test User",
            email: "test@example.com",
            password: "short",
          }),
        })
      );

      expect(response.status).toBe(400);
      const body = await response.json();
      expect(body.message).toBe("Validation failed");
    });
  });

  describe("POST /api/users/login", () => {
    beforeEach(async () => {
      // Create a user for login tests
      await app.handle(
        new Request("http://localhost/api/users", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            name: "Login User",
            email: "login@example.com",
            password: "loginpassword123",
          }),
        })
      );
    });

    it("should login successfully and return a token", async () => {
      const response = await app.handle(
        new Request("http://localhost/api/users/login", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            email: "login@example.com",
            password: "loginpassword123",
          }),
        })
      );

      const body = await response.json();
      expect(response.status).toBe(200);
      expect(body.message).toBe("Successfully");
      expect(body.data).toBeDefined();
    });

    it("should fail with invalid credentials", async () => {
      const response = await app.handle(
        new Request("http://localhost/api/users/login", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            email: "login@example.com",
            password: "wrongpassword",
          }),
        })
      );

      expect(response.status).toBe(401);
      const body = await response.json();
      expect(body.message).toBe("Invalid credentials");
    });
  });

  describe("Protected Routes", () => {
    let token: string;

    beforeEach(async () => {
      // Register and login to get token
      await app.handle(
        new Request("http://localhost/api/users", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            name: "Auth User",
            email: "auth@example.com",
            password: "authpassword123",
          }),
        })
      );

      const loginRes = await app.handle(
        new Request("http://localhost/api/users/login", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            email: "auth@example.com",
            password: "authpassword123",
          }),
        })
      );
      const loginBody = await loginRes.json();
      token = loginBody.data;
    });

    it("should get current user profile", async () => {
      const response = await app.handle(
        new Request("http://localhost/api/users/current", {
          method: "GET",
          headers: { Authorization: `Bearer ${token}` },
        })
      );

      const body = await response.json();
      expect(response.status).toBe(200);
      expect(body.data.email).toBe("auth@example.com");
    });

    it("should logout successfully", async () => {
      const response = await app.handle(
        new Request("http://localhost/api/users/logout", {
          method: "DELETE",
          headers: { Authorization: `Bearer ${token}` },
        })
      );

      expect(response.status).toBe(200);
      const body = await response.json();
      expect(body.data).toBe("ok");

      // Verify token is invalidated
      const verifyRes = await app.handle(
        new Request("http://localhost/api/users/current", {
          method: "GET",
          headers: { Authorization: `Bearer ${token}` },
        })
      );
      expect(verifyRes.status).toBe(401);
    });

    it("should fail to access current user without token", async () => {
      const response = await app.handle(
        new Request("http://localhost/api/users/current", {
          method: "GET",
        })
      );

      expect(response.status).toBe(401);
    });
  });
});
