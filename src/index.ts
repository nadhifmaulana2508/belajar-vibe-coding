import { Elysia } from "elysia";
import { db } from "../db";
import { users } from "../db/schema";

const app = new Elysia()
  .get("/", () => ({ status: "ok", message: "Server is running" }))
  .get("/users", async () => {
    try {
      const allUsers = await db.select().from(users);
      return allUsers;
    } catch (error) {
      return { error: "Failed to fetch users", detail: (error as Error).message };
    }
  })
  .listen(3000);

console.log(
  `🦊 Elysia is running at ${app.server?.hostname}:${app.server?.port}`
);
