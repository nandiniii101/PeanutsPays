import { NextRequest, NextResponse } from "next/server";
import { requireUser, UnauthorizedError, NotFoundError } from "@/lib/auth/helpers";
import { getTransactionById, deleteTransaction } from "@/lib/db/queries";

export async function GET(
  _req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const user = await requireUser();
    const txn = await getTransactionById(params.id, user.id);
    return NextResponse.json(txn);
  } catch (err) {
    if (err instanceof UnauthorizedError) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    if (err instanceof NotFoundError) {
      return NextResponse.json({ error: "Not Found" }, { status: 404 });
    }
    console.error("[GET /api/transactions/[id]]", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const user = await requireUser();
    await deleteTransaction(params.id, user.id);
    return NextResponse.json({ success: true });
  } catch (err) {
    if (err instanceof UnauthorizedError) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    if (err instanceof NotFoundError) {
      return NextResponse.json({ error: "Not Found" }, { status: 404 });
    }
    console.error("[DELETE /api/transactions/[id]]", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
