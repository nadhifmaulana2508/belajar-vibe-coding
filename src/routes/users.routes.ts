import { Elysia, t } from "elysia";
import { UsersService } from "../services/users.service";

const usersService = new UsersService();

export const usersRoutes = new Elysia({ prefix: "/api/users" })
  .onError(({ code, error, set }) => {
    const err = error as any;
    const message = err?.message || "";

    if (message === "UNAUTHORIZED") {
      set.status = 401;
      return { message: "Unauthorized" };
    }
    if (message === "INVALID_CREDENTIALS") {
      set.status = 401;
      return { message: "Invalid credentials" };
    }
    if (message === "CONFLICT") {
      set.status = 409;
      return { message: "User already exists" };
    }

    if (code === "VALIDATION") {
      set.status = 400;
      return { 
        message: "Validation failed", 
        errors: err?.all?.map((e: any) => ({ path: e.path, message: e.message })) || []
      };
    }

    set.status = 500;
    return { message: "Internal server error", detail: message };
  })
  .derive(async ({ headers }) => {
    const authHeader = headers.authorization;
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return { user: null, token: null };
    }

    const token = authHeader.split(" ")[1];
    if (!token) {
      return { user: null, token: null };
    }

    const user = await usersService.getUserByToken(token);
    return { user, token };
  })
  .post("/", async ({ body }) => {
    const newUser = await usersService.registerUser(body);
    return {
      message: "User created successfully",
      data: newUser,
    };
  }, {
    body: t.Object({
      name: t.String({ minLength: 1 }),
      email: t.String({ format: "email" }),
      password: t.String({ minLength: 8 }),
    })
  })
  .post("/login", async ({ body }) => {
    const token = await usersService.loginUser(body);
    return {
      message: "Successfully",
      data: token,
    };
  }, {
    body: t.Object({
      email: t.String({ format: "email" }),
      password: t.String({ minLength: 8 }),
    })
  })
  .get("/current", async ({ user }) => {
    if (!user) throw new Error("UNAUTHORIZED");

    return {
      message: "Successfully",
      data: user,
    };
  })
  .delete("/logout", async ({ user, token }) => {
    if (!user || !token) throw new Error("UNAUTHORIZED");

    await usersService.logoutUser(token);

    return {
      message: "Successfully",
      data: "ok",
    };
  });
