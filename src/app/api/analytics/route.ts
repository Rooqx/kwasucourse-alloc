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

    // 3. Preference fulfillment — how many allocations match lecturer's top 3 preferences
    const allPreferences = await prisma.lecturerPreference.findMany({
      where: { sessionId: activeSession.id },
    });

    let totalAllocated = 0;
    let inTop1 = 0;
    let inTop3 = 0;
    let notInPrefs = 0;

    for (const alloc of allocations) {
      totalAllocated++;
      const lecPrefs = allPreferences
        .filter((p) => p.lecturerId === alloc.lecturerId)
        .sort((a, b) => a.rank - b.rank);

      const matchedPref = lecPrefs.find((p) => p.courseId === alloc.courseId);
      if (!matchedPref) {
        notInPrefs++;
      } else if (matchedPref.rank === 1) {
        inTop1++;
      } else if (matchedPref.rank <= 3) {
        inTop3++;
      }
    }

    const preferenceFulfillment = [
      { label: "Top 1 Choice", value: inTop1 },
      { label: "Top 3 Choice", value: inTop3 },
      { label: "Other / Not in Prefs", value: notInPrefs },
    ];

    return Response.json({
      data: {
        workloadDistribution,
        statusBreakdown,
        preferenceFulfillment,
        totalAllocations: totalAllocated,
      },
    });
  } catch (error) {
    return authErrorResponse(error);
  }
}
