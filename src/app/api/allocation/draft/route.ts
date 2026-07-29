import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUser, authErrorResponse } from "@/lib/auth/session";

/**
 * GET /api/allocation/draft
 * Returns allocations, unallocated courses, and lecturers for the active session.
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

    const url = new URL(request.url);
    const sessionQuery = url.searchParams.get("sessionId");
    const statusQuery = url.searchParams.get("status");

    let sessionFilter;
    if (sessionQuery) {
      sessionFilter = await prisma.academicSession.findUnique({ where: { id: sessionQuery } });
    } else {
      sessionFilter = await prisma.academicSession.findFirst({
        where: { isActive: true },
      });
    }

    if (!sessionFilter) {
      return Response.json(
        { error: { message: "Session not found" } },
        { status: 400 }
      );
    }

    const whereClause: any = {
      sessionId: sessionFilter.id,
      course: { departmentId: user.departmentId },
    };
    if (statusQuery) {
      whereClause.status = statusQuery;
    }

    const allocations = await prisma.allocation.findMany({
      where: whereClause,
      include: {
        course: true,
        lecturer: {
          include: { user: { select: { fullName: true, email: true } } },
        },
        flags: { where: { status: 'OPEN' } },
      },
      orderBy: { allocatedAt: "desc" },
    });

    const allCourses = await prisma.course.findMany({
      where: { departmentId: user.departmentId },
      orderBy: { code: 'asc' }
    });

    const allocatedCourseIds = new Set(allocations.map(a => a.courseId));
    const unallocatedCourses = allCourses.filter(c => !allocatedCourseIds.has(c.id));

    const lecturersData = await prisma.user.findMany({
      where: { role: 'LECTURER', departmentId: user.departmentId, isApproved: true },
      include: { lecturerProfile: true },
      orderBy: { fullName: 'asc' }
    });

    const lecturers = lecturersData
      .filter(l => l.lecturerProfile)
      .map(l => ({
        id: l.lecturerProfile!.id,
        name: l.fullName,
        maxLoad: l.lecturerProfile!.maxLoadUnits,
      }));

    return Response.json({ 
      data: {
        allocations,
        unallocatedCourses,
        lecturers,
        sessionId: sessionFilter.id
      }
    });
  } catch (error) {
    return authErrorResponse(error);
  }
}
