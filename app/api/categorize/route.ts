import { NextRequest, NextResponse } from "next/server";
import { requireUser, UnauthorizedError } from "@/lib/auth/helpers";
import { categorizeByRules } from "@/lib/categorize-rules";
import { categorizeWithAI } from "@/lib/ai/groq";
import { fallbackCategory } from "@/lib/ai/fallback";

export async function POST(req: NextRequest) {
  try {
    await requireUser();
    const body = await req.json();
    const { description } = body as { description?: string };

    if (!description || typeof description !== "string") {
      return NextResponse.json({ category: "Other" });
    }

    let category = categorizeByRules(description);
    if (!category) {
      try {
        category = await categorizeWithAI(description);
      } catch {
        category = fallbackCategory();
      }
    }

    return NextResponse.json({ category });
  } catch (err) {
    if (err instanceof UnauthorizedError) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    console.error("[POST /api/categorize]", err);
    return NextResponse.json({ category: "Other" });
  }
}
