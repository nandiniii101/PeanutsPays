import { auth } from "@/auth";

export class UnauthorizedError extends Error {
  constructor(message: string = "Unauthorized") {
    super(message);
    this.name = "UnauthorizedError";
  }
}

export class NotFoundError extends Error {
  constructor(message: string = "Not Found") {
    super(message);
    this.name = "NotFoundError";
  }
}

export async function requireUser(): Promise<{ id: string; email: string }> {
  const session = await auth();
  if (!session?.user?.id) {
    throw new UnauthorizedError("Authentication required");
  }
  return {
    id: session.user.id,
    email: session.user.email || "",
  };
}
