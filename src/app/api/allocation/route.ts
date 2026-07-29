import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUser, authErrorResponse } from "@/lib/auth/session";

/**
 * POST /api/allocation
 * Creates a new allocation (e.g., manually assigning an unallocated course).
 * HOD only.
 */
export async function POST(request: NextRequest) {
  try {
    const user = await getCurrentUser(request);
    if (user.role !== "HOD") {
      return Response.json(
        { error: { message: "Forbidden" } },
        { status: 403 }
      );
    }
    const body = await request.json();

    const activeSession = await prisma.academicSession.findFirst({
      where: { isActive: true },
    });

    if (!activeSession) {
      return Response.json(
        { error: { message: "No active session" } },
        { status: 400 }
      );
    }

    const allocation = await prisma.allocation.create({
      data: {
        courseId: body.courseId,
        lecturerId: body.lecturerId,
        sessionId: activeSession.id,
        status: "DRAFT",
        hasConflict: false,
      },
      include: {
        course: true,
        lecturer: {
          include: { user: { select: { fullName: true, email: true } } },
        },
      },
    });

    return Response.json({ data: allocation });
  } catch (error) {
    return authErrorResponse(error);
  }
}
