import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUser, authErrorResponse } from "@/lib/auth/session";

export async function POST(request: NextRequest) {
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
        { error: { message: "No active academic session found" } },
        { status: 400 }
      );
    }

    // Find drafts to know who to notify
    const drafts = await prisma.allocation.findMany({
      where: {
        sessionId: activeSession.id,
        status: "DRAFT",
      },
      include: {
        course: true,
        lecturer: true
      }
    });

    if (drafts.length === 0) {
       return Response.json(
        { error: { message: "No draft allocations to publish" } },
        { status: 400 }
      );
    }

    // Update allocations
    await prisma.$transaction(async (tx) => {
      await tx.allocation.updateMany({
        where: {
          sessionId: activeSession.id,
          status: "DRAFT",
        },
        data: {
          status: "APPROVED",
        },
      });

      // Send notifications to lecturers
      const notifications = drafts.map(draft => ({
        userId: draft.lecturer.userId,
        allocationId: draft.id,
        type: "ALLOCATION_PUBLISHED",
        message: `You have been officially allocated to teach ${draft.course.code} - ${draft.course.title}.`,
        read: false,
      }));

      if (notifications.length > 0) {
        await tx.notification.createMany({
          data: notifications
        });
      }
    });

    return Response.json({ data: { publishedCount: drafts.length } });
  } catch (error) {
    return authErrorResponse(error);
  }
}
