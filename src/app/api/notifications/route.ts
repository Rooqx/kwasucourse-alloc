import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUser, authErrorResponse } from "@/lib/auth/session";

/**
 * GET /api/notifications
 * Returns notifications for the current user, newest first.
 */
export async function GET(request: NextRequest) {
  try {
    const user = await getCurrentUser(request);

    const notifications = await prisma.notification.findMany({
      where: { userId: user.userId },
      include: {
        allocation: {
          include: { course: { select: { code: true, title: true } } },
        },
      },
      orderBy: { createdAt: "desc" },
      take: 50,
    });

    return Response.json({ data: notifications });
  } catch (error) {
    return authErrorResponse(error);
  }
}
