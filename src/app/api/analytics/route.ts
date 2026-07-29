import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUser, authErrorResponse } from "@/lib/auth/session";

/**
 * GET /api/analytics
 * Returns analytics data for HOD dashboard charts.
 * Includes workload distribution, allocation status breakdown, preference fulfillment.
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
      return Response.json({
        data: {
          workloadDistribution: [],
          statusBreakdown: [],
          preferenceFulfillment: [],
        },
      });
    }

    // 1. Workload distribution: units allocated per lecturer
    const allocations = await prisma.allocation.findMany({
      where: {
        sessionId: activeSession.id,
        course: { departmentId: user.departmentId },
      },
      include: {
        course: { select: { units: true } },
        lecturer: {
          include: {
            user: { select: { fullName: true } },
          },
        },
      },
    });

    const workloadMap = new Map<string, { name: string; units: number; maxUnits: number }>();
    for (const alloc of allocations) {
      const lecId = alloc.lecturerId;
      const existing = workloadMap.get(lecId);
      if (existing) {
        existing.units += alloc.course.units;
      } else {
        workloadMap.set(lecId, {
          name: alloc.lecturer.user.fullName,
          units: alloc.course.units,
          maxUnits: alloc.lecturer.maxLoadUnits,
        });
      }
    }
    const workloadDistribution = Array.from(workloadMap.values());

    // 2. Status breakdown
    const statusCounts = await prisma.allocation.groupBy({
      by: ["status"],
      where: {
        sessionId: activeSession.id,
        course: { departmentId: user.departmentId },
      },
      _count: { status: true },
    });

    const statusBreakdown = statusCounts.map((s) => ({
      status: s.status,
      count: s._count.status,
    }));

    // 3. Top 5 most-preferred courses
    const allPreferences = await prisma.lecturerPreference.findMany({
      where: { sessionId: activeSession.id },
      include: { course: { select: { code: true } } },
    });

    const coursePrefCounts = new Map<string, number>();
    for (const pref of allPreferences) {
      const current = coursePrefCounts.get(pref.course.code) || 0;
      coursePrefCounts.set(pref.course.code, current + 1);
    }

    const top5PreferredCourses = Array.from(coursePrefCounts.entries())
      .map(([name, value]) => ({ name, value }))
      .sort((a, b) => b.value - a.value)
      .slice(0, 5);

    const totalAllocations = allocations.length;

    return Response.json({
      data: {
        workloadDistribution,
        statusBreakdown,
        top5PreferredCourses,
        totalAllocations,
      },
    });
  } catch (error) {
    return authErrorResponse(error);
  }
}
