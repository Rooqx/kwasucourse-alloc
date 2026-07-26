import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUser, authErrorResponse } from "@/lib/auth/session";

/**
 * POST /api/allocation/[id]/flag
 * Flags an allocation for review. Lecturer only.
 */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getCurrentUser(request);
    if (user.role !== "LECTURER") {
      return Response.json(
        { error: { message: "Only lecturers can flag allocations" } },
        { status: 403 }
      );
    }

    const { id } = await params;
    const body = await request.json();
    const { reason } = body;

    if (!reason || typeof reason !== "string" || reason.trim().length === 0) {
      return Response.json(
        { error: { message: "Reason is required" } },
        { status: 400 }
      );
    }

    const allocation = await prisma.allocation.findUnique({
      where: { id },
      include: { course: true },
    });

    if (!allocation) {
      return Response.json(
        { error: { message: "Allocation not found" } },
        { status: 404 }
      );
    }

    // Get the lecturer's profile
    const lecturerProfile = await prisma.lecturerProfile.findUnique({
      where: { userId: user.userId },
    });

    if (!lecturerProfile) {
      return Response.json(
        { error: { message: "Lecturer profile not found" } },
        { status: 404 }
      );
    }

    // Verify this allocation belongs to this lecturer
    if (allocation.lecturerId !== lecturerProfile.id) {
      return Response.json(
        { error: { message: "You can only flag your own allocations" } },
        { status: 403 }
      );
    }

    const [flag, updatedAllocation] = await prisma.$transaction([
      prisma.allocationFlag.create({
        data: {
          allocationId: id,
          raisedById: lecturerProfile.id,
          reason: reason.trim(),
          status: "OPEN",
        },
      }),
      prisma.allocation.update({
        where: { id },
        data: { status: "FLAGGED" },
      }),
    ]);

    return Response.json({ data: { flag, allocation: updatedAllocation } });
  } catch (error) {
    return authErrorResponse(error);
  }
}
