import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUser, authErrorResponse } from "@/lib/auth/session";

export async function GET(request: NextRequest) {
  try {
    const payload = await getCurrentUser(request);

    const user = await prisma.user.findUnique({
      where: { id: payload.userId },
      select: {
        id: true,
        fullName: true,
        email: true,
        role: true,
        level: true,
        departmentId: true,
        isApproved: true,
        department: {
          select: {
            id: true,
            name: true,
            code: true,
          },
        },
      },
    });

    if (!user) {
      return Response.json(
        { error: { message: "User not found" } },
        { status: 404 }
      );
    }

    return Response.json({ data: user });
  } catch (error) {
    return authErrorResponse(error);
  }
}
