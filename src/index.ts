import { Elysia } from "elysia";
import { usersRoutes } from "./routes/users.routes";

export const app = new Elysia()
  .get("/", () => ({ status: "ok", message: "Server is running" }))
  .use(usersRoutes);

app.listen(3000);

console.log(
  `🦊 Elysia is running at ${app.server?.hostname}:${app.server?.port}`
);
