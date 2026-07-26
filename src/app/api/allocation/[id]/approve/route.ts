import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUser, authErrorResponse } from "@/lib/auth/session";

/**
 * POST /api/allocation/[id]/approve
 * Approves a DRAFT allocation — sets status to APPROVED, records approver.
 * HOD only. Creates notifications for the allocated lecturer.
 */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getCurrentUser(request);
    if (user.role !== "HOD") {
      return Response.json(
        { error: { message: "Only HOD can approve allocations" } },
        { status: 403 }
      );
    }

    const { id } = await params;

    const allocation = await prisma.allocation.findUnique({
      where: { id },
      include: {
        course: true,
        lecturer: { include: { user: true } },
      },
    });

    if (!allocation) {
      return Response.json(
        { error: { message: "Allocation not found" } },
        { status: 404 }
      );
    }

    if (allocation.status !== "DRAFT") {
      return Response.json(
        { error: { message: `Cannot approve allocation with status: ${allocation.status}` } },
        { status: 400 }
      );
    }

    // Transaction: approve allocation + create notification + audit log
    const [updatedAllocation] = await prisma.$transaction([
      prisma.allocation.update({
        where: { id },
        data: {
          status: "APPROVED",
          approvedById: user.userId,
          approvedAt: new Date(),
        },
      }),
      prisma.notification.create({
        data: {
          userId: allocation.lecturer.userId,
          allocationId: id,
          type: "ALLOCATION_APPROVED",
          message: `Your allocation for "${allocation.course.title}" (${allocation.course.code}) has been approved.`,
        },
      }),
      prisma.auditLog.create({
        data: {
          actorId: user.userId,
          action: "APPROVE_ALLOCATION",
          entityType: "Allocation",
          entityId: id,
          details: JSON.stringify({
            courseCode: allocation.course.code,
            lecturerName: allocation.lecturer.user.fullName,
          }),
        },
      }),
    ]);

    return Response.json({ data: updatedAllocation });
  } catch (error) {
    return authErrorResponse(error);
  }
}
