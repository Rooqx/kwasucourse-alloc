import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUser, authErrorResponse } from "@/lib/auth/session";

/**
 * GET /api/allocation/draft
 * Returns all DRAFT allocations for the active session (with course + lecturer details).
 * HOD only.
 */
export async function GET(request: NextRequest) {
  try {
    const user = await getCurrentUser(request);
    if (user.role !== "HOD") {
      return Response.json(
        { error: { message: "Forbidden" } },
        { status: 403 }
      );
    }

    const activeSession = await prisma.academicSession.findFirst({
      where: { isActive: true },
    });

    if (!activeSession) {
      return Response.json(
        { error: { message: "No active session" } },
        { status: 400 }
      );
    }

    const allocations = await prisma.allocation.findMany({
      where: {
        sessionId: activeSession.id,
        course: { departmentId: user.departmentId },
      },
      include: {
        course: true,
        lecturer: {
          include: { user: { select: { fullName: true, email: true } } },
        },
        flags: true,
      },
      orderBy: { allocatedAt: "desc" },
    });

    return Response.json({ data: allocations });
  } catch (error) {
    return authErrorResponse(error);
  }
}
