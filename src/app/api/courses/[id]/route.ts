import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getCurrentUser, authErrorResponse } from '@/lib/auth/session';

export async function GET(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const course = await prisma.course.findUnique({
      where: { id: (await params).id },
      include: { department: true }
    });
    if (!course) return NextResponse.json({ error: { message: 'Not found' } }, { status: 404 });
    return NextResponse.json({ data: course });
  } catch (error: any) {
    return NextResponse.json({ error: { message: error.message } }, { status: 500 });
  }
}

export async function PUT(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const user = await getCurrentUser(req as any);
    if (!user || user.role !== 'ADMIN') return authErrorResponse(new Error("Unauthorized"));

    const body = await req.json();

    const course = await prisma.course.update({
      where: { id: (await params).id },
      data: {
        code: body.code,
        title: body.title,
        units: body.units,
        level: body.level,
        semester: body.semester,
        departmentId: body.departmentId,
        specializationTag: body.specializationTag,
        capacity: body.capacity,
        timeSlot: body.timeSlot,
      }
    });

    await prisma.auditLog.create({
      data: {
        action: 'UPDATE',
        entityType: 'COURSE',
        entityId: course.id,
        actorId: user.userId,
        details: `Updated course ${course.id}`
      }
    });

    return NextResponse.json({ data: course });
  } catch (error: any) {
    return NextResponse.json({ error: { message: error.message } }, { status: 500 });
  }
}

export async function DELETE(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const user = await getCurrentUser(req as any);
    if (!user || user.role !== 'ADMIN') return authErrorResponse(new Error("Unauthorized"));

    await prisma.course.delete({ where: { id: (await params).id } });

    await prisma.auditLog.create({
      data: {
        action: 'DELETE',
        entityType: 'COURSE',
        entityId: (await params).id,
        actorId: user.userId,
        details: `Deleted course ${(await params).id}`
      }
    });

    return NextResponse.json({ data: { success: true } });
  } catch (error: any) {
    return NextResponse.json({ error: { message: error.message } }, { status: 500 });
  }
}
