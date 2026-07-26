import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUser, authErrorResponse } from "@/lib/auth/session";

/**
 * POST /api/notifications/send-reminders
 * Sends reminder notifications to lecturers who haven't submitted preferences.
 * HOD only. Per spec: mocked — just creates Notification records.
 */
export async function POST(request: NextRequest) {
  try {
    const user = await getCurrentUser(request);
    if (user.role !== "HOD") {
      return Response.json(
        { error: { message: "Only HOD can send reminders" } },
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

    // Find lecturers who haven't submitted preferences for the active session
    const lecturersWithPrefs = await prisma.lecturerPreference.findMany({
      where: { sessionId: activeSession.id },
      select: { lecturerId: true },
      distinct: ["lecturerId"],
    });

    const lecturerIdsWithPrefs = new Set(
      lecturersWithPrefs.map((p) => p.lecturerId)
    );

    const allLecturers = await prisma.lecturerProfile.findMany({
      where: {
        user: {
          departmentId: user.departmentId,
          isApproved: true,
          role: "LECTURER",
        },
      },
      include: { user: true },
    });

    const lecturersWithoutPrefs = allLecturers.filter(
      (lp) => !lecturerIdsWithPrefs.has(lp.id)
    );

    // Create notification for each
    const notifications = await prisma.$transaction(
      lecturersWithoutPrefs.map((lp) =>
        prisma.notification.create({
          data: {
            userId: lp.userId,
            type: "PREFERENCE_REMINDER",
            message: `Reminder: Please submit your course preferences for ${activeSession.label} — ${activeSession.semester} before the deadline.`,
          },
        })
      )
    );

    return Response.json({
      data: {
        remindersCount: notifications.length,
        lecturersReminded: lecturersWithoutPrefs.map((lp) => lp.user.fullName),
      },
    });
  } catch (error) {
    return authErrorResponse(error);
  }
}
