import { NextRequest, NextResponse } from "next/server";
import { requireUser, UnauthorizedError } from "@/lib/auth/helpers";
import { getRecentTransactionsByUser } from "@/lib/db/queries";
import { askBudgetQuestion } from "@/lib/ai/groq";
import { fallbackChatAnswer } from "@/lib/ai/fallback";
import { handleRuleBasedChatQuery } from "@/lib/chat/rule-based-handler";

export async function POST(req: NextRequest) {
  try {
    const user = await requireUser();
    const { question } = await req.json();

    if (!question || typeof question !== "string") {
      return NextResponse.json({ answer: fallbackChatAnswer() });
    }

    // 1. Check fast rule-based query handler first (Zero AI Latency)
    const ruleAnswer = await handleRuleBasedChatQuery(user.id, question);
    if (ruleAnswer) {
      return NextResponse.json({ answer: ruleAnswer });
    }

    // 2. Otherwise, load last 30 days of spending as context for Groq AI
    const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString();
    const recentTxns = await getRecentTransactionsByUser(user.id, thirtyDaysAgo);

    const totalExpenses = recentTxns
      .filter((t) => t.type === "expense")
      .reduce((s, t) => s + t.amount, 0);
    const totalIncome = recentTxns
      .filter((t) => t.type === "income")
      .reduce((s, t) => s + t.amount, 0);

    const breakdown: Record<string, number> = {};
    for (const t of recentTxns.filter((t) => t.type === "expense")) {
      breakdown[t.category] = (breakdown[t.category] ?? 0) + t.amount;
    }

    const transactionList = recentTxns.map((t) => ({
      date: t.date,
      description: t.description,
      amount: t.amount,
      category: t.category,
      type: t.type,
    }));

    const context = {
      totalExpenses,
      totalIncome,
      breakdown,
      recentTransactions: transactionList,
      period: "last 30 days",
    };

    let answer: string;
    console.log("[Chat Route] Initiating Groq call:", {
      hasGroqApiKey: Boolean(process.env.GROQ_API_KEY),
      model: "llama-3.3-70b-versatile",
      questionLength: question.length,
      txnCount: context.recentTransactions.length,
    });

    try {
      answer = await askBudgetQuestion(question, context);
    } catch (err: unknown) {
      const errorObj = err as Record<string, unknown>;
      console.error("[Chat Route] Groq Call Failed:", {
        message: err instanceof Error ? err.message : String(err),
        stack: err instanceof Error ? err.stack : undefined,
        response: errorObj?.response,
        responseData: (errorObj?.response as Record<string, unknown>)?.data,
        responseBody: (errorObj?.response as Record<string, unknown>)?.body,
        rawError: err,
      });
      answer = fallbackChatAnswer();
    }

    return NextResponse.json({ answer });
  } catch (err) {
    if (err instanceof UnauthorizedError) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    console.error("[POST /api/chat]", err);
    return NextResponse.json({ answer: fallbackChatAnswer() });
  }
}
