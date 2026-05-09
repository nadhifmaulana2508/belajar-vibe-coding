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
  })
  .post("/login", async ({ body, set }) => {
    try {
      const token = await usersService.loginUser(body);
      return {
        message: "Successfully",
        data: token,
      };
    } catch (error) {
      const err = error as Error;
      if (err.message === "Invalid credentials") {
        set.status = 401;
        return { message: err.message };
      }
      set.status = 500;
      return { message: "Internal server error", detail: err.message };
    }
  }, {
    body: t.Object({
      email: t.String({ format: "email" }),
      password: t.String(),
    })
  });
