import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUser, authErrorResponse } from "@/lib/auth/session";
import { runGaleShapley } from "@/lib/allocation/galeShapley";
import { detectConflicts } from "@/lib/allocation/conflicts";
import type { ScoringWeights } from "@/lib/allocation/scoring";

/**
 * POST /api/allocation/run
 * Runs the Gale-Shapley allocation algorithm for the active session.
 * Creates DRAFT allocations in the database.
 * HOD only.
 */
export async function POST(request: NextRequest) {
  try {
    const user = await getCurrentUser(request);
    if (user.role !== "HOD") {
      return Response.json(
        { error: { message: "Only HOD can run allocations" } },
        { status: 403 }
      );
    }

    // Find active session
    const activeSession = await prisma.academicSession.findFirst({
      where: { isActive: true },
    });

    if (!activeSession) {
      return Response.json(
        { error: { message: "No active academic session found" } },
        { status: 400 }
      );
    }

    // Load weights from SystemConfig
    const weightConfigs = await prisma.systemConfig.findMany({
      where: {
        key: {
          in: [
            "allocation_weight_w1",
            "allocation_weight_w2",
            "allocation_weight_w3",
            "allocation_weight_w4",
          ],
        },
      },
    });

    const weightMap = new Map(weightConfigs.map((c) => [c.key, parseFloat(c.value)]));
    const weights: ScoringWeights = {
      w1: weightMap.get("allocation_weight_w1") ?? 0.4,
      w2: weightMap.get("allocation_weight_w2") ?? 0.2,
      w3: weightMap.get("allocation_weight_w3") ?? 0.25,
      w4: weightMap.get("allocation_weight_w4") ?? 0.15,
    };

    // Load all courses for this department
    const courses = await prisma.course.findMany({
      where: { departmentId: user.departmentId },
    });

    // Load all approved lecturer profiles with their users
    const lecturerProfiles = await prisma.lecturerProfile.findMany({
      where: {
        user: {
          departmentId: user.departmentId,
          isApproved: true,
        },
      },
    });

    // Load all preferences for this session
    const preferences = await prisma.lecturerPreference.findMany({
      where: {
        sessionId: activeSession.id,
        lecturer: {
          user: {
            departmentId: user.departmentId,
          },
        },
      },
    });

    // Map to algorithm input format
    const lecturerData = lecturerProfiles.map((lp) => ({
      id: lp.id,
      specialization: lp.specialization,
      seniorityRank: lp.seniorityRank,
      maxLoadUnits: lp.maxLoadUnits,
      currentLoadUnits: 0,
    }));

    const courseData = courses.map((c) => ({
      id: c.id,
      specializationTag: c.specializationTag,
      units: c.units,
    }));

    const prefData = preferences.map((p) => ({
      lecturerId: p.lecturerId,
      courseId: p.courseId,
      rank: p.rank,
    }));

    // Run the algorithm
    const result = runGaleShapley({
      lecturers: lecturerData,
      courses: courseData,
      preferences: prefData,
      weights,
    });

    // Detect conflicts
    const coursesWithSlots = courses.map((c) => ({
      id: c.id,
      timeSlot: c.timeSlot,
    }));
    const conflicts = detectConflicts(result.allocations, coursesWithSlots);

    // Build a set of conflicting allocation pairs for marking
    const conflictingCoursesByLecturer = new Map<string, Set<string>>();
    for (const conflict of conflicts) {
      if (!conflictingCoursesByLecturer.has(conflict.lecturerId)) {
        conflictingCoursesByLecturer.set(conflict.lecturerId, new Set());
      }
      conflictingCoursesByLecturer.get(conflict.lecturerId)!.add(conflict.courseA);
      conflictingCoursesByLecturer.get(conflict.lecturerId)!.add(conflict.courseB);
    }

    // Delete existing DRAFT allocations for this session (re-run scenario)
    await prisma.allocation.deleteMany({
      where: {
        sessionId: activeSession.id,
        status: "DRAFT",
        course: {
          departmentId: user.departmentId,
        },
      },
    });

    // Create new allocations
    const createdAllocations = await prisma.$transaction(
      result.allocations.map((alloc) => {
        const hasConflict =
          conflictingCoursesByLecturer.get(alloc.lecturerId)?.has(alloc.courseId) ?? false;

        return prisma.allocation.create({
          data: {
            courseId: alloc.courseId,
            lecturerId: alloc.lecturerId,
            sessionId: activeSession.id,
            status: "DRAFT",
            hasConflict,
          },
        });
      })
    );

    // Create audit log
    await prisma.auditLog.create({
      data: {
        actorId: user.userId,
        action: "RUN_ALLOCATION",
        entityType: "Allocation",
        entityId: activeSession.id,
        details: JSON.stringify({
          totalAllocations: createdAllocations.length,
          conflicts: conflicts.length,
          unallocatedCourses: result.unallocatedCourses.length,
          unallocatedLecturers: result.unallocatedLecturers.length,
        }),
      },
    });

    return Response.json({
      data: {
        totalAllocations: createdAllocations.length,
        conflicts: conflicts.length,
        unallocatedCourses: result.unallocatedCourses,
        unallocatedLecturers: result.unallocatedLecturers,
        conflictDetails: conflicts,
      },
    });
  } catch (error) {
    if (error && typeof error === "object" && "statusCode" in error) {
      return authErrorResponse(error);
    }
    console.error("Allocation run error:", error);
    return Response.json(
      { error: { message: "An unexpected error occurred" } },
      { status: 500 }
    );
  }
}
