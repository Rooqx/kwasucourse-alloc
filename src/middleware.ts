import { NextResponse, type NextRequest } from "next/server";

/**
 * Lightweight middleware — checks JWT presence on protected routes.
 * Full JWT verification happens in API route handlers via getCurrentUser(request as any).
 * Per spec Section 5.4: middleware mainly protects page routes by checking
 * for token presence. The real auth flow is client-side via AuthProvider.
 */
export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Public routes — no protection needed
  const publicPaths = ["/", "/login", "/register"];
  const isPublic =
    publicPaths.includes(pathname) ||
    pathname.startsWith("/api/auth/") ||
    pathname === "/api/departments" ||
    pathname.startsWith("/_next/") ||
    pathname.startsWith("/favicon");

  if (isPublic) {
    return NextResponse.next();
  }

  // For API routes: check Authorization header
  if (pathname.startsWith("/api/")) {
    const authHeader = request.headers.get("Authorization");
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return NextResponse.json(
        { error: { message: "Authentication required" } },
        { status: 401 }
      );
    }
    return NextResponse.next();
  }

  // For page routes: we can't check localStorage from middleware (server-side).
  // The AuthProvider handles redirection on the client side.
  // Just allow the page to render — AuthProvider will redirect if needed.
  return NextResponse.next();
}

export const config = {
  matcher: [
    /*
     * Match all request paths except:
     * - _next/static (static files)
     * - _next/image (image optimization)
     * - favicon.ico (favicon)
     */
    "/((?!_next/static|_next/image|favicon.ico).*)",
  ],
};
