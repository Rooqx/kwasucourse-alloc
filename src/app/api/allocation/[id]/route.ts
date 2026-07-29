import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUser, authErrorResponse } from "@/lib/auth/session";

/**
 * GET /api/allocation/[id]
 * Returns a single allocation with all details.
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await getCurrentUser(request);
    const { id } = await params;

    const allocation = await prisma.allocation.findUnique({
      where: { id },
      include: {
        course: { include: { department: true } },
        lecturer: {
          include: { user: { select: { fullName: true, email: true } } },
        },
        flags: {
          include: {
            raisedBy: {
              include: { user: { select: { fullName: true } } },
            },
          },
        },
        teachingGuide: true,
        approvedBy: { select: { fullName: true } },
      },
    });

    if (!allocation) {
      return Response.json(
        { error: { message: "Allocation not found" } },
        { status: 404 }
      );
    }

    return Response.json({ data: allocation });
  } catch (error) {
    return authErrorResponse(error);
  }
}

/**
 * PATCH /api/allocation/[id]
 * Updates an allocation (e.g., reassign lecturer).
 */
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getCurrentUser(request);
    if (user.role !== "HOD") {
      return Response.json(
        { error: { message: "Forbidden" } },
        { status: 403 }
      );
    }
    const { id } = await params;
    const body = await request.json();

    const allocation = await prisma.allocation.update({
      where: { id },
      data: {
        lecturerId: body.lecturerId,
        status: "DRAFT", // reset status to draft if changed
        hasConflict: false, // assuming manual resolution clears conflict
      },
      include: {
        course: { include: { department: true } },
        lecturer: {
          include: { user: { select: { fullName: true, email: true } } },
        },
      },
    });

    // Also resolve any open flags for this allocation
    await prisma.allocationFlag.updateMany({
      where: { allocationId: id, status: "OPEN" },
      data: { status: "RESOLVED" },
    });

    return Response.json({ data: allocation });
  } catch (error) {
    return authErrorResponse(error);
  }
}
