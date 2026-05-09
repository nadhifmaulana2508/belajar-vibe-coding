import { Elysia } from "elysia";
import { usersRoutes } from "./routes/users.routes";

const app = new Elysia()
  .get("/", () => ({ status: "ok", message: "Server is running" }))
  .use(usersRoutes)
  .listen(3000);

console.log(
  `🦊 Elysia is running at ${app.server?.hostname}:${app.server?.port}`
);
