import { NextRequest, NextResponse } from "next/server";
import { requireUser, UnauthorizedError } from "@/lib/auth/helpers";
import { getBudgetLimitsByUser, upsertBudgetLimit, deleteBudgetLimit } from "@/lib/db/queries";
import { z } from "zod";

const setBudgetLimitSchema = z.object({
  category: z.string().min(1),
  monthlyLimit: z.number().positive(),
});

export async function GET() {
  try {
    const user = await requireUser();
    const rows = await getBudgetLimitsByUser(user.id);
    return NextResponse.json(rows);
  } catch (err) {
    if (err instanceof UnauthorizedError) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    console.error("[GET /api/budget-limits]", err);
    return NextResponse.json({ error: "Failed to fetch budget limits" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const user = await requireUser();
    const body = await req.json();
    const parsed = setBudgetLimitSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json({ error: "Invalid budget limit payload" }, { status: 400 });
    }

    const { category, monthlyLimit } = parsed.data;
    const row = await upsertBudgetLimit(user.id, category, monthlyLimit);
    return NextResponse.json(row, { status: 200 });
  } catch (err) {
    if (err instanceof UnauthorizedError) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    console.error("[POST /api/budget-limits]", err);
    return NextResponse.json({ error: "Failed to save budget limit" }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const user = await requireUser();
    const { searchParams } = new URL(req.url);
    const category = searchParams.get("category");

    if (!category) {
      return NextResponse.json({ error: "Category is required" }, { status: 400 });
    }

    await deleteBudgetLimit(user.id, category);
    return NextResponse.json({ success: true });
  } catch (err) {
    if (err instanceof UnauthorizedError) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    console.error("[DELETE /api/budget-limits]", err);
    return NextResponse.json({ error: "Failed to delete budget limit" }, { status: 500 });
  }
}
