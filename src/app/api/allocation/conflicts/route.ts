import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUser, authErrorResponse } from "@/lib/auth/session";

/**
 * GET /api/allocation/conflicts
 * Returns all allocations with hasConflict=true for the active session.
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
      return Response.json({ data: [] });
    }

    const conflicts = await prisma.allocation.findMany({
      where: {
        sessionId: activeSession.id,
        hasConflict: true,
        course: { departmentId: user.departmentId },
      },
      include: {
        course: true,
        lecturer: {
          include: { user: { select: { fullName: true } } },
        },
      },
    });

    return Response.json({ data: conflicts });
  } catch (error) {
    return authErrorResponse(error);
  }
}
