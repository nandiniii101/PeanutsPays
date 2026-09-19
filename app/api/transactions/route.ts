import { NextRequest, NextResponse } from "next/server";
import { requireUser, UnauthorizedError } from "@/lib/auth/helpers";
import {
  getTransactionsByUser,
  insertTransaction,
} from "@/lib/db/queries";
import { z } from "zod";
import crypto from "crypto";

const createTxnSchema = z
  .object({
    id: z.string().uuid().optional(),
    amount: z.number().positive(),
    description: z.string().min(1),
    category: z.string().min(1),
    type: z.enum(["income", "expense"]),
    date: z.string().optional(),
  })
  .refine(
    (data) => {
      if (!data.date) return true;
      const parsedDate = new Date(data.date);
      if (isNaN(parsedDate.getTime())) return false;
      // Allow current day or past, reject future dates
      const todayEnd = new Date();
      todayEnd.setHours(23, 59, 59, 999);
      return parsedDate <= todayEnd;
    },
    {
      message: "Transaction date cannot be in the future",
      path: ["date"],
    }
  );

export async function GET() {
  try {
    const user = await requireUser();
    const rows = await getTransactionsByUser(user.id);
    return NextResponse.json(rows);
  } catch (err) {
    if (err instanceof UnauthorizedError) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    console.error("[GET /api/transactions]", err);
    return NextResponse.json({ error: "Failed to fetch transactions" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const user = await requireUser();
    const body = await req.json();
    const parsed = createTxnSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json({ error: "Invalid transaction payload" }, { status: 400 });
    }

    const { id, amount, description, category, type, date } = parsed.data;

    const row = await insertTransaction({
      id: id || crypto.randomUUID(),
      userId: user.id,
      amount,
      description,
      category,
      type,
      date,
    });

    return NextResponse.json(row, { status: 201 });
  } catch (err) {
    if (err instanceof UnauthorizedError) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    console.error("[POST /api/transactions]", err);
    return NextResponse.json({ error: "Failed to create transaction" }, { status: 500 });
  }
}
