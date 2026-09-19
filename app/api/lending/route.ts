import { NextRequest, NextResponse } from "next/server";
import { requireUser, UnauthorizedError, NotFoundError } from "@/lib/auth/helpers";
import {
  getFriendsByUser,
  getLendingEntriesByUser,
  getFriendById,
  insertFriend,
  insertLendingEntry,
  settleLendingEntry,
} from "@/lib/db/queries";
import { z } from "zod";
import crypto from "crypto";

const createEntrySchema = z.object({
  id: z.string().uuid().optional(),
  friendId: z.string().uuid().optional(),
  friendName: z.string().min(1).optional(), // Encrypted client-side ciphertext
  amount: z.number().positive(),
  direction: z.enum(["lent", "borrowed"]),
  note: z.string().optional().nullable(), // Encrypted client-side ciphertext or null
});

const patchEntrySchema = z.object({
  entryId: z.string().uuid(),
});

export async function GET() {
  try {
    const user = await requireUser();
    const userFriends = await getFriendsByUser(user.id);
    const userEntries = await getLendingEntriesByUser(user.id, false); // unsettled entries

    const result = userFriends.map((f) => {
      const friendEntries = userEntries.filter((e) => e.friendId === f.id);
      const lentTotal = friendEntries
        .filter((e) => e.direction === "lent")
        .reduce((s, e) => s + e.amount, 0);
      const borrowedTotal = friendEntries
        .filter((e) => e.direction === "borrowed")
        .reduce((s, e) => s + e.amount, 0);
      const netBalance = lentTotal - borrowedTotal;
      return {
        ...f,
        netBalance,
        entries: friendEntries,
      };
    });

    return NextResponse.json(result);
  } catch (err) {
    if (err instanceof UnauthorizedError) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    console.error("[GET /api/lending]", err);
    return NextResponse.json({ error: "Failed to fetch lending data" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const user = await requireUser();
    const body = await req.json();
    const parsed = createEntrySchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json({ error: "Invalid lending entry payload" }, { status: 400 });
    }

    const { id, friendId, friendName, amount, direction, note } = parsed.data;

    let targetFriendId = friendId;

    if (!targetFriendId) {
      if (!friendName) {
        return NextResponse.json({ error: "Friend identifier is required" }, { status: 400 });
      }
      const newFriend = await insertFriend({
        id: crypto.randomUUID(),
        userId: user.id,
        name: friendName,
      });
      targetFriendId = newFriend.id;
    } else {
      // Validate friend belongs to user
      await getFriendById(targetFriendId, user.id);
    }

    const entry = await insertLendingEntry({
      id: id || crypto.randomUUID(),
      userId: user.id,
      friendId: targetFriendId,
      amount,
      direction,
      note: note ?? null,
    });

    return NextResponse.json(entry, { status: 201 });
  } catch (err) {
    if (err instanceof UnauthorizedError) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    if (err instanceof NotFoundError) {
      return NextResponse.json({ error: "Not Found" }, { status: 404 });
    }
    console.error("[POST /api/lending]", err);
    return NextResponse.json({ error: "Failed to create lending entry" }, { status: 500 });
  }
}

export async function PATCH(req: NextRequest) {
  try {
    const user = await requireUser();
    const body = await req.json();
    const parsed = patchEntrySchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json({ error: "Invalid entry ID" }, { status: 400 });
    }

    await settleLendingEntry(parsed.data.entryId, user.id);
    return NextResponse.json({ success: true });
  } catch (err) {
    if (err instanceof UnauthorizedError) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    if (err instanceof NotFoundError) {
      return NextResponse.json({ error: "Not Found" }, { status: 404 });
    }
    console.error("[PATCH /api/lending]", err);
    return NextResponse.json({ error: "Failed to settle entry" }, { status: 500 });
  }
}
