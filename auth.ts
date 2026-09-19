import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";
import bcrypt from "bcryptjs";
import { authConfig } from "./auth.config";
import { db } from "@/lib/db/client";
import { ensureTablesExist } from "@/lib/db/init";
import { users } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { z } from "zod";

const DUMMY_BCRYPT_HASH =
  "$2a$12$abcdefghijklmnopqrstuuABCDEFGHIJKLMNOPQRSTUU123456789012";

const credentialsSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
});

export const { handlers, auth, signIn, signOut } = NextAuth({
  ...authConfig,
  providers: [
    Credentials({
      name: "Credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        const parsed = credentialsSchema.safeParse(credentials);
        if (!parsed.success) {
          return null;
        }

        const email = parsed.data.email.trim().toLowerCase();
        const password = parsed.data.password;

        await ensureTablesExist();

        const foundUsers = await db
          .select()
          .from(users)
          .where(eq(users.email, email))
          .limit(1);

        const user = foundUsers[0];

        if (!user) {
          await bcrypt.compare(password, DUMMY_BCRYPT_HASH);
          return null;
        }

        const isValid = await bcrypt.compare(password, user.passwordHash);
        if (!isValid) {
          return null;
        }

        return {
          id: user.id,
          email: user.email,
        };
      },
    }),
  ],
});
