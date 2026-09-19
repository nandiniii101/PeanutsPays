import { db } from "./client";
import { ensureTablesExist } from "./init";
import { transactions, friends, lendingEntries, users, budgetLimits } from "./schema";
import { and, desc, eq, gte } from "drizzle-orm";
import { NotFoundError } from "@/lib/auth/helpers";
import crypto from "crypto";

// ================= RECURRING TRANSACTION DETECTION =================

export function attachRecurringFlags<
  T extends {
    id: string;
    userId: string;
    amount: number;
    description: string;
    category: string;
    type: "income" | "expense";
    date: string;
  }
>(txns: T[]): (T & { isRecurring: boolean })[] {
  return txns.map((t) => {
    const desc = t.description.trim().toLowerCase();
    const matchingTxns = txns.filter((o) => {
      if (o.type !== t.type) return false;
      if (o.description.trim().toLowerCase() !== desc) return false;
      const diff = Math.abs(o.amount - t.amount);
      const maxAmt = Math.max(o.amount, t.amount);
      if (maxAmt > 0 && diff / maxAmt > 0.05) return false;
      return true;
    });

    const distinctMonths = new Set(
      matchingTxns.map((m) => {
        const d = new Date(m.date);
        return `${d.getFullYear()}-${d.getMonth() + 1}`;
      })
    );

    // 2+ occurrences in different calendar months
    const isRecurring = distinctMonths.size >= 2;
    return { ...t, isRecurring };
  });
}

// ================= TRANSACTION QUERIES =================

export async function getTransactionsByUser(userId: string) {
  await ensureTablesExist();
  const rows = await db
    .select()
    .from(transactions)
    .where(eq(transactions.userId, userId))
    .orderBy(desc(transactions.date));
  return attachRecurringFlags(rows);
}

export async function getRecentTransactionsByUser(
  userId: string,
  sinceIso: string
) {
  await ensureTablesExist();
  return db
    .select()
    .from(transactions)
    .where(
      and(
        eq(transactions.userId, userId),
        gte(transactions.date, sinceIso)
      )
    )
    .orderBy(desc(transactions.date));
}

export async function getTransactionById(id: string, userId: string) {
  await ensureTablesExist();
  const rows = await db
    .select()
    .from(transactions)
    .where(and(eq(transactions.id, id), eq(transactions.userId, userId)))
    .limit(1);

  if (rows.length === 0) {
    throw new NotFoundError("Transaction not found");
  }
  return rows[0];
}

export async function insertTransaction(data: {
  id: string;
  userId: string;
  amount: number;
  description: string;
  category: string;
  type: "income" | "expense";
  date?: string;
}) {
  await ensureTablesExist();
  const rows = await db
    .insert(transactions)
    .values({
      id: data.id,
      userId: data.userId,
      amount: data.amount,
      description: data.description,
      category: data.category,
      type: data.type,
      ...(data.date ? { date: data.date } : {}),
    })
    .returning();
  return rows[0];
}

export async function deleteTransaction(id: string, userId: string) {
  await ensureTablesExist();
  await getTransactionById(id, userId);

  await db
    .delete(transactions)
    .where(and(eq(transactions.id, id), eq(transactions.userId, userId)));
  return { success: true };
}

// ================= FRIEND QUERIES =================

export async function getFriendsByUser(userId: string) {
  await ensureTablesExist();
  return db.select().from(friends).where(eq(friends.userId, userId));
}

export async function getFriendById(id: string, userId: string) {
  await ensureTablesExist();
  const rows = await db
    .select()
    .from(friends)
    .where(and(eq(friends.id, id), eq(friends.userId, userId)))
    .limit(1);

  if (rows.length === 0) {
    throw new NotFoundError("Friend not found");
  }
  return rows[0];
}

export async function insertFriend(data: {
  id: string;
  userId: string;
  name: string;
}) {
  await ensureTablesExist();
  const rows = await db
    .insert(friends)
    .values({
      id: data.id,
      userId: data.userId,
      name: data.name,
    })
    .returning();
  return rows[0];
}

// ================= LENDING QUERIES =================

export async function getLendingEntriesByUser(
  userId: string,
  settled?: boolean
) {
  await ensureTablesExist();
  if (settled !== undefined) {
    return db
      .select()
      .from(lendingEntries)
      .where(
        and(
          eq(lendingEntries.userId, userId),
          eq(lendingEntries.settled, settled)
        )
      )
      .orderBy(desc(lendingEntries.date));
  }
  return db
    .select()
    .from(lendingEntries)
    .where(eq(lendingEntries.userId, userId))
    .orderBy(desc(lendingEntries.date));
}

export async function getLendingEntryById(id: string, userId: string) {
  await ensureTablesExist();
  const rows = await db
    .select()
    .from(lendingEntries)
    .where(and(eq(lendingEntries.id, id), eq(lendingEntries.userId, userId)))
    .limit(1);

  if (rows.length === 0) {
    throw new NotFoundError("Lending entry not found");
  }
  return rows[0];
}

export async function insertLendingEntry(data: {
  id: string;
  userId: string;
  friendId: string;
  amount: number;
  direction: "lent" | "borrowed";
  note?: string | null;
  date?: string;
  settled?: boolean;
}) {
  await ensureTablesExist();
  await getFriendById(data.friendId, data.userId);

  const rows = await db
    .insert(lendingEntries)
    .values({
      id: data.id,
      userId: data.userId,
      friendId: data.friendId,
      amount: data.amount,
      direction: data.direction,
      note: data.note ?? null,
      settled: data.settled ?? false,
      ...(data.date ? { date: data.date } : {}),
    })
    .returning();
  return rows[0];
}

export async function settleLendingEntry(id: string, userId: string) {
  await ensureTablesExist();
  await getLendingEntryById(id, userId);

  await db
    .update(lendingEntries)
    .set({ settled: true })
    .where(and(eq(lendingEntries.id, id), eq(lendingEntries.userId, userId)));
  return { success: true };
}

// ================= USER CLEAR DATA =================

export async function deleteAllUserData(userId: string) {
  await ensureTablesExist();
  await db.delete(lendingEntries).where(eq(lendingEntries.userId, userId));
  await db.delete(friends).where(eq(friends.userId, userId));
  await db.delete(transactions).where(eq(transactions.userId, userId));
  return { success: true };
}

// ================= USER PROFILE QUERIES =================

export async function getUserByEmail(email: string) {
  await ensureTablesExist();
  const rows = await db
    .select()
    .from(users)
    .where(eq(users.email, email.trim().toLowerCase()))
    .limit(1);
  return rows[0] || null;
}

export async function getUserById(id: string) {
  await ensureTablesExist();
  const rows = await db.select().from(users).where(eq(users.id, id)).limit(1);
  if (rows.length === 0) {
    throw new NotFoundError("User not found");
  }
  return rows[0];
}

export async function insertUser(data: {
  id: string;
  email: string;
  passwordHash: string;
}) {
  await ensureTablesExist();
  const rows = await db
    .insert(users)
    .values({
      id: data.id,
      email: data.email.trim().toLowerCase(),
      passwordHash: data.passwordHash,
    })
    .returning();
  return rows[0];
}

// ================= BUDGET LIMIT QUERIES =================

export async function getBudgetLimitsByUser(userId: string) {
  await ensureTablesExist();
  return db
    .select()
    .from(budgetLimits)
    .where(eq(budgetLimits.userId, userId));
}

export async function upsertBudgetLimit(
  userId: string,
  category: string,
  monthlyLimit: number
) {
  await ensureTablesExist();
  const existing = await db
    .select()
    .from(budgetLimits)
    .where(and(eq(budgetLimits.userId, userId), eq(budgetLimits.category, category)))
    .limit(1);

  if (existing.length > 0) {
    const updated = await db
      .update(budgetLimits)
      .set({
        monthlyLimit,
        updatedAt: new Date().toISOString(),
      })
      .where(eq(budgetLimits.id, existing[0].id))
      .returning();
    return updated[0];
  } else {
    const inserted = await db
      .insert(budgetLimits)
      .values({
        id: crypto.randomUUID(),
        userId,
        category,
        monthlyLimit,
        updatedAt: new Date().toISOString(),
      })
      .returning();
    return inserted[0];
  }
}

export async function deleteBudgetLimit(userId: string, category: string) {
  await ensureTablesExist();
  await db
    .delete(budgetLimits)
    .where(and(eq(budgetLimits.userId, userId), eq(budgetLimits.category, category)));
  return { success: true };
}

