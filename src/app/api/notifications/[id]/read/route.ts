import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUser, authErrorResponse } from "@/lib/auth/session";

/**
 * POST /api/notifications/[id]/read
 * Marks a notification as read.
 */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getCurrentUser(request);
    const { id } = await params;

    const notification = await prisma.notification.findUnique({
      where: { id },
    });

    if (!notification) {
      return Response.json(
        { error: { message: "Notification not found" } },
        { status: 404 }
      );
    }

    if (notification.userId !== user.userId) {
      return Response.json(
        { error: { message: "Forbidden" } },
        { status: 403 }
      );
    }

    const updated = await prisma.notification.update({
      where: { id },
      data: { read: true },
    });

    return Response.json({ data: updated });
  } catch (error) {
    return authErrorResponse(error);
  }
}
