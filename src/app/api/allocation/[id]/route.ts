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
