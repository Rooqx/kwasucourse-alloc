import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUser, authErrorResponse } from "@/lib/auth/session";

/**
 * GET /api/allocation/[id]/checklist
 * Returns the checklist state for an allocation.
 *
 * PATCH /api/allocation/[id]/checklist
 * Updates the checklist state (JSON string stored in checklistState field).
 * LECTURER only.
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
      select: { id: true, checklistState: true },
    });

    if (!allocation) {
      return Response.json(
        { error: { message: "Allocation not found" } },
        { status: 404 }
      );
    }

    const checklist = allocation.checklistState
      ? JSON.parse(allocation.checklistState)
      : getDefaultChecklist();

    return Response.json({ data: checklist });
  } catch (error) {
    return authErrorResponse(error);
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getCurrentUser(request);
    if (user.role !== "LECTURER") {
      return Response.json(
        { error: { message: "Only LECTURER can update checklist" } },
        { status: 403 }
      );
    }

    const { id } = await params;
    const body = await request.json();

    const updated = await prisma.allocation.update({
      where: { id },
      data: { checklistState: JSON.stringify(body) },
    });

    return Response.json({ data: { id: updated.id, checklistState: body } });
  } catch (error) {
    return authErrorResponse(error);
  }
}

function getDefaultChecklist() {
  return {
    items: [
      { label: "Reviewed teaching guide", checked: false },
      { label: "Prepared week 1-2 materials", checked: false },
      { label: "Confirmed timetable slot", checked: false },
    ],
  };
}
