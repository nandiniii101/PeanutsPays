import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { z } from "zod";
import crypto from "crypto";
import { getUserByEmail, insertUser } from "@/lib/db/queries";
import { checkRateLimit } from "@/lib/rate-limit";

const signupSchema = z.object({
  email: z.string().email().max(255),
  password: z.string().min(8, "Password must be at least 8 characters long"),
});

export async function POST(req: NextRequest) {
  try {
    const ip = req.headers.get("x-forwarded-for") || "unknown-ip";
    const rateLimit = checkRateLimit(`signup:${ip}`, 5, 60000);
    if (!rateLimit.success) {
      return NextResponse.json(
        { error: "Too many signup attempts. Please try again later." },
        { status: 429 }
      );
    }

    const body = await req.json();
    const parsed = signupSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.issues[0]?.message || "Invalid registration payload." },
        { status: 400 }
      );
    }

    const email = parsed.data.email.trim().toLowerCase();
    const existing = await getUserByEmail(email);

    if (existing) {
      await bcrypt.hash(parsed.data.password, 12);
      return NextResponse.json(
        { error: "Unable to complete registration. Please verify your details." },
        { status: 400 }
      );
    }

    const passwordHash = await bcrypt.hash(parsed.data.password, 12);
    const userId = crypto.randomUUID();

    await insertUser({
      id: userId,
      email,
      passwordHash,
    });

    return NextResponse.json(
      { success: true, message: "Account created successfully." },
      { status: 201 }
    );
  } catch (err) {
    console.error("[POST /api/auth/signup] Error processing registration:", err);
    return NextResponse.json(
      { error: "Internal server error." },
      { status: 500 }
    );
  }
}
