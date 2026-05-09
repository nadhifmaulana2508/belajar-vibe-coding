import { Elysia, t } from "elysia";
import { UsersService } from "../services/users.service";

const usersService = new UsersService();

export const usersRoutes = new Elysia({ prefix: "/api/users" })
  .derive(async ({ headers }) => {
    const authHeader = headers.authorization;
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return { user: null };
    }

    const token = authHeader.split(" ")[1];
    if (!token) {
      return { user: null };
    }

    const user = await usersService.getUserByToken(token);
    
    return { user };
  })
  .post("/", async ({ body }) => {
    try {
      const newUser = await usersService.registerUser(body);
      return {
        message: "User created successfully",
        data: newUser,
      };
    } catch (error) {
      const err = error as Error;
      if (err.message === "User already exists") {
        return { message: err.message };
      }
      return { message: "Internal server error", detail: err.message };
    }
  }, {
    body: t.Object({
      name: t.String(),
      email: t.String({ format: "email" }),
      password: t.String(),
    })
  })
  .post("/login", async ({ body }) => {
    try {
      const token = await usersService.loginUser(body);
      return {
        message: "Successfully",
        data: token,
      };
    } catch (error) {
      const err = error as Error;
      if (err.message === "Invalid credentials") {
        return { message: err.message };
      }
      return { message: "Internal server error", detail: err.message };
    }
  }, {
    body: t.Object({
      email: t.String({ format: "email" }),
      password: t.String(),
    })
  })
  .post("/current", async ({ user, set }) => {
    if (!user) {
      set.status = 401;
      return { message: "Unauthorized" };
    }

    return {
      message: "Successfully",
      data: user,
    };
  });
