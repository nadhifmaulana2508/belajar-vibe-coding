import { db } from "../../db";
import { users } from "../../db/schema";
import { eq } from "drizzle-orm";

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
}
