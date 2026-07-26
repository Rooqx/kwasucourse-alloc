import { NextRequest } from "next/server";
import { verifyToken, type JwtPayload } from "./jwt";

/**
 * Extract and verify the JWT from the Authorization header.
 * Returns the decoded payload or throws an error.
 *
 * Usage in API routes:
 *   const user = await getCurrentUser(request);
 *   if (user.role !== "ADMIN") return NextResponse.json({ error: { message: "Forbidden" } }, { status: 403 });
 */
export async function getCurrentUser(request: NextRequest): Promise<JwtPayload> {
  const authHeader = request.headers.get("Authorization");

  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    throw new AuthError("Missing or invalid authorization header", 401);
  }

  const token = authHeader.split(" ")[1];

  try {
    return verifyToken(token);
  } catch {
    throw new AuthError("Invalid or expired token", 401);
  }
}

export class AuthError extends Error {
  statusCode: number;

  constructor(message: string, statusCode: number = 401) {
    super(message);
    this.name = "AuthError";
    this.statusCode = statusCode;
  }
}

/**
 * Helper to create a standardized error response for auth failures.
 */
export function authErrorResponse(error: unknown) {
  if (error instanceof AuthError) {
    return Response.json(
      { error: { message: error.message } },
      { status: error.statusCode }
    );
  }
  return Response.json(
    { error: { message: "Authentication failed" } },
    { status: 401 }
  );
}
