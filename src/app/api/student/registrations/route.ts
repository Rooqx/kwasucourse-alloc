import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUser, authErrorResponse } from "@/lib/auth/session";

/**
 * GET /api/student/registrations
 * Returns student's course registrations for the active session.
 *
 * POST /api/student/registrations
 * Registers a student for a course in the active session.
 */
export async function GET(request: NextRequest) {
  try {
    const user = await getCurrentUser(request);
    if (user.role !== "STUDENT") {
      return Response.json(
        { error: { message: "Students only" } },
        { status: 403 }
      );
    }

    const activeSession = await prisma.academicSession.findFirst({
      where: { isActive: true },
    });

    if (!activeSession) {
      return Response.json({ data: [] });
    }

    const registrations = await prisma.studentRegistration.findMany({
      where: {
        studentId: user.userId,
        sessionId: activeSession.id,
      },
      include: {
        course: {
          include: {
            allocations: {
              where: {
                sessionId: activeSession.id,
                status: "APPROVED",
              },
              include: {
                lecturer: {
                  include: { user: { select: { fullName: true } } },
                },
              },
            },
          },
        },
      },
      orderBy: { createdAt: "desc" },
    });

    return Response.json({ data: registrations });
  } catch (error) {
    return authErrorResponse(error);
  }
}

export async function POST(request: NextRequest) {
  try {
    const user = await getCurrentUser(request);
    if (user.role !== "STUDENT") {
      return Response.json(
        { error: { message: "Students only" } },
        { status: 403 }
      );
    }

    const body = await request.json();
    const { courseId } = body;

    if (!courseId) {
      return Response.json(
        { error: { message: "courseId is required" } },
        { status: 400 }
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

    // Verify course exists
    const course = await prisma.course.findUnique({
      where: { id: courseId },
    });

    if (!course) {
      return Response.json(
        { error: { message: "Course not found" } },
        { status: 404 }
      );
    }

    // Check duplicate registration
    const existing = await prisma.studentRegistration.findUnique({
      where: {
        studentId_courseId_sessionId: {
          studentId: user.userId,
          courseId,
          sessionId: activeSession.id,
        },
      },
    });

    if (existing) {
      return Response.json(
        { error: { message: "Already registered for this course" } },
        { status: 409 }
      );
    }

    const registration = await prisma.studentRegistration.create({
      data: {
        studentId: user.userId,
        courseId,
        sessionId: activeSession.id,
      },
      include: { course: true },
    });

    return Response.json({ data: registration }, { status: 201 });
  } catch (error) {
    return authErrorResponse(error);
  }
}
