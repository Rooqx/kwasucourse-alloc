import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUser, authErrorResponse } from "@/lib/auth/session";

/**
 * GET /api/reports/export
 * Returns allocation data formatted for printable HTML export.
 * HOD only.
 */
export async function GET(request: NextRequest) {
  try {
    const user = await getCurrentUser(request);
    if (user.role !== "HOD") {
      return Response.json(
        { error: { message: "HOD only" } },
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
        status: "APPROVED",
        course: { departmentId: user.departmentId },
      },
      include: {
        course: { include: { department: true } },
        lecturer: {
          include: { user: { select: { fullName: true, email: true } } },
        },
      },
      orderBy: { course: { code: "asc" } },
    });

    return Response.json({
      data: {
        session: activeSession,
        allocations,
        generatedAt: new Date().toISOString(),
      },
    });
  } catch (error) {
    return authErrorResponse(error);
  }
}
