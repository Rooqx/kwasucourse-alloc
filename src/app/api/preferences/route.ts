import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getCurrentUser, authErrorResponse } from '@/lib/auth/session';
import { preferenceSchema } from '@/lib/validation/preference';

export async function GET(req: Request) {
  try {
    const user = await getCurrentUser(req as any);
    if (!user || user.role !== 'LECTURER') {
      return authErrorResponse('Unauthorized');
    }

    const lecturer = await prisma.lecturerProfile.findUnique({
      where: { userId: user.userId },
    });

    if (!lecturer) {
      return NextResponse.json({ error: { message: 'Lecturer profile not found' } }, { status: 404 });
    }

    const activeSession = await prisma.academicSession.findFirst({
      where: { isActive: true },
    });

    if (!activeSession) {
      return NextResponse.json({ error: { message: 'No active session found' } }, { status: 404 });
    }

    const preferences = await prisma.lecturerPreference.findMany({
      where: {
        lecturerId: lecturer.id,
        sessionId: activeSession.id,
      },
      include: {
        course: true,
      },
      orderBy: {
        rank: 'asc',
      },
    });

    return NextResponse.json({ data: preferences });
  } catch (error) {
    console.error('Error fetching preferences:', error);
    return NextResponse.json({ error: { message: 'Failed to fetch preferences' } }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const user = await getCurrentUser(req as any);
    if (!user || user.role !== 'LECTURER') {
      return authErrorResponse('Unauthorized');
    }

    const lecturer = await prisma.lecturerProfile.findUnique({
      where: { userId: user.userId },
    });

    if (!lecturer) {
      return NextResponse.json({ error: { message: 'Lecturer profile not found' } }, { status: 404 });
    }

    const activeSession = await prisma.academicSession.findFirst({
      where: { isActive: true },
    });

    if (!activeSession) {
      return NextResponse.json({ error: { message: 'No active session found' } }, { status: 404 });
    }

    const body = await req.json();
    const result = preferenceSchema.safeParse(body);

    if (!result.success) {
      const fields = result.error.flatten().fieldErrors;
      return NextResponse.json(
        { error: { message: 'Validation failed', fields } },
        { status: 400 }
      );
    }

    const { preferences, maxLoadUnits } = result.data;

    // Validate sequential ranks starting from 1
    const sortedRanks = preferences.map((p) => p.rank).sort((a, b) => a - b);
    for (let i = 0; i < sortedRanks.length; i++) {
      if (sortedRanks[i] !== i + 1) {
        return NextResponse.json(
          { error: { message: 'Ranks must be sequential starting from 1' } },
          { status: 400 }
        );
      }
    }

    // Validate courseIds exist
    const courseIds = preferences.map((p) => p.courseId);
    const courses = await prisma.course.findMany({
      where: { id: { in: courseIds } },
    });

    if (courses.length !== courseIds.length) {
      return NextResponse.json(
        { error: { message: 'One or more courses not found' } },
        { status: 400 }
      );
    }

    // Delete existing and insert new
    await prisma.$transaction(async (tx) => {
      if (maxLoadUnits !== undefined) {
        await tx.lecturerProfile.update({
          where: { id: lecturer.id },
          data: { maxLoadUnits },
        });
      }

      await tx.lecturerPreference.deleteMany({
        where: {
          lecturerId: lecturer.id,
          sessionId: activeSession.id,
        },
      });

      await tx.lecturerPreference.createMany({
        data: preferences.map((p) => ({
          lecturerId: lecturer.id,
          sessionId: activeSession.id,
          courseId: p.courseId,
          rank: p.rank,
        })),
      });
    });

    const newPreferences = await prisma.lecturerPreference.findMany({
      where: {
        lecturerId: lecturer.id,
        sessionId: activeSession.id,
      },
      include: {
        course: true,
      },
      orderBy: {
        rank: 'asc',
      },
    });

    return NextResponse.json({ data: newPreferences });
  } catch (error) {
    console.error('Error saving preferences:', error);
    return NextResponse.json({ error: { message: 'Failed to save preferences' } }, { status: 500 });
  }
}
