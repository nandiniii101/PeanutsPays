import { NextResponse } from "next/server";
import { requireUser, UnauthorizedError } from "@/lib/auth/helpers";
import { deleteAllUserData } from "@/lib/db/queries";

export async function DELETE() {
  try {
    const user = await requireUser();
    await deleteAllUserData(user.id);
    return NextResponse.json({ success: true });
  } catch (err) {
    if (err instanceof UnauthorizedError) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    console.error("[DELETE /api/data]", err);
    return NextResponse.json({ error: "Failed to clear data" }, { status: 500 });
  }
}
