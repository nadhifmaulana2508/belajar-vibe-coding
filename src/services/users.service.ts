import { db } from "../../db";

import { users, session } from "../../db/schema";
import { eq } from "drizzle-orm";

export interface UserProfile {
  id: number;
  name: string;
  email: string;
  createdAt: Date | null;
}

export class UsersService {
  async registerUser(data: typeof users.$inferInsert) {
    // 1. Check if user already exists
    const [existingUser] = await db
      .select()
      .from(users)
      .where(eq(users.email, data.email));

    if (existingUser) {
      throw new Error("User already exists");
    }

    // 2. Hash password
    const hashedPassword = await Bun.password.hash(data.password);

    // 3. Create user
    await db.insert(users).values({
      ...data,
      password: hashedPassword,
    });

    // 4. Return user data without password
    const [newUser] = await db
      .select({
        id: users.id,
        name: users.name,
        email: users.email,
        createdAt: users.createdAt,
      })
      .from(users)
      .where(eq(users.email, data.email));

    return newUser;
  }

  async loginUser(data: Pick<typeof users.$inferInsert, "email" | "password">) {
    // 1. Find user by email
    const [user] = await db
      .select()
      .from(users)
      .where(eq(users.email, data.email));

    if (!user) {
      throw new Error("Invalid credentials");
    }

    // 2. Verify password
    const isPasswordValid = await Bun.password.verify(data.password, user.password);

    if (!isPasswordValid) {
      throw new Error("Invalid credentials");
    }

    // 3. Generate token
    const token = crypto.randomUUID();

    // 4. Create session
    await db.insert(session).values({
      token,
      userId: user.id,
    });

    return token;
  }

  async getUserByToken(token: string): Promise<UserProfile | null> {
    // 1. Find session and join with user
    const results = await db
      .select({
        id: users.id,
        name: users.name,
        email: users.email,
        createdAt: users.createdAt,
      })
      .from(session)
      .innerJoin(users, eq(session.userId, users.id))
      .where(eq(session.token, token));

    return results[0] || null;
  }
}
