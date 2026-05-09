import { Elysia, t } from "elysia";
import { UsersService } from "../services/users.service";

const usersService = new UsersService();

export const usersRoutes = new Elysia({ prefix: "/api/users" })
  .post("/", async ({ body, set }) => {
    try {
      const newUser = await usersService.registerUser(body);
      return {
        message: "User created successfully",
        data: newUser,
      };
    } catch (error) {
      const err = error as Error;
      if (err.message === "User already exists") {
        set.status = 409;
        return { message: err.message };
      }
      set.status = 500;
      return { message: "Internal server error", detail: err.message };
    }
  }, {
    body: t.Object({
      name: t.String(),
      email: t.String({ format: "email" }),
      password: t.String(),
    })
  });
