import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUser, authErrorResponse } from "@/lib/auth/session";
import { generateTeachingGuide } from "@/lib/mock/teachingGuide";

/**
 * GET /api/teaching-guide/[allocationId]
 * Returns or generates a teaching guide for an approved allocation.
 * Per spec: the guide is mocked — generated from course/lecturer data.
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ allocationId: string }> }
) {
  try {
    await getCurrentUser(request);
    const { allocationId } = await params;

    const allocation = await prisma.allocation.findUnique({
      where: { id: allocationId },
      include: {
        course: { include: { department: true } },
        lecturer: {
          include: { user: { select: { fullName: true } } },
        },
        teachingGuide: true,
      },
    });

    if (!allocation) {
      return Response.json(
        { error: { message: "Allocation not found" } },
        { status: 404 }
      );
    }

    // If teaching guide already exists, return it
    if (allocation.teachingGuide) {
      return Response.json({ data: allocation.teachingGuide });
    }

    // Generate and store a new teaching guide (mocked)
    const content = generateTeachingGuide({
      courseCode: allocation.course.code,
      courseTitle: allocation.course.title,
      courseUnits: allocation.course.units,
      courseLevel: allocation.course.level,
      lecturerName: allocation.lecturer.user.fullName,
      departmentName: allocation.course.department.name,
      semester: allocation.course.semester,
    });

    const guide = await prisma.teachingGuide.create({
      data: {
        allocationId,
        content,
      },
    });

    return Response.json({ data: guide });
  } catch (error) {
    return authErrorResponse(error);
  }
}
