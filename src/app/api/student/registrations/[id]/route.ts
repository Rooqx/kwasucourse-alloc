import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUser, authErrorResponse } from "@/lib/auth/session";

/**
 * DELETE /api/student/registrations/[id]
 * Removes a student's course registration.
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getCurrentUser(request);
    if (user.role !== "STUDENT") {
      return Response.json(
        { error: { message: "Students only" } },
        { status: 403 }
      );
    }

    const { id } = await params;

    const registration = await prisma.studentRegistration.findUnique({
      where: { id },
    });

    if (!registration) {
      return Response.json(
        { error: { message: "Registration not found" } },
        { status: 404 }
      );
    }

    if (registration.studentId !== user.userId) {
      return Response.json(
        { error: { message: "Forbidden" } },
        { status: 403 }
      );
    }

    await prisma.studentRegistration.delete({ where: { id } });

    return Response.json({ data: { message: "Registration removed" } });
  } catch (error) {
    return authErrorResponse(error);
  }
}
