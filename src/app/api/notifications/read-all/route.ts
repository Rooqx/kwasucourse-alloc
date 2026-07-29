import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUser, authErrorResponse } from "@/lib/auth/session";

export async function PATCH(request: NextRequest) {
  try {
    const user = await getCurrentUser(request);

    await prisma.notification.updateMany({
      where: {
        userId: user.userId,
        read: false,
      },
      data: {
        read: true,
      },
    });

    return Response.json({ data: { success: true } });
  } catch (error) {
    return authErrorResponse(error);
  }
}
