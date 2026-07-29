import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUser, authErrorResponse } from "@/lib/auth/session";

export async function GET(request: NextRequest) {
  try {
    const user = await getCurrentUser(request);
    if (!user || user.role !== "LECTURER") {
      return NextResponse.json(
        { error: { message: "Forbidden" } },
        { status: 403 }
      );
    }

    const lecturer = await prisma.lecturerProfile.findUnique({
      where: { userId: user.userId },
    });

    if (!lecturer) {
      return NextResponse.json(
        { error: { message: "Lecturer profile not found" } },
        { status: 404 }
      );
    }

    const activeSession = await prisma.academicSession.findFirst({
      where: { isActive: true },
    });

    if (!activeSession) {
      return NextResponse.json(
        { error: { message: "No active session" } },
        { status: 400 }
      );
    }

    const allocations = await prisma.allocation.findMany({
      where: {
        sessionId: activeSession.id,
        lecturerId: lecturer.id,
      },
      include: {
        course: true,
      },
      orderBy: { allocatedAt: "desc" },
    });

    return NextResponse.json({ data: allocations });
  } catch (error) {
    return authErrorResponse(error);
  }
}
