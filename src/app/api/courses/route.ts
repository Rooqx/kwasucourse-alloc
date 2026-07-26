import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getCurrentUser, authErrorResponse } from '@/lib/auth/session';

export async function GET(req: Request) {
  try {
    const url = new URL(req.url);
    const departmentId = url.searchParams.get('departmentId');
    const level = url.searchParams.get('level');
    const semester = url.searchParams.get('semester');

    const where: any = {};
    if (departmentId) where.departmentId = departmentId;
    if (level) where.level = parseInt(level, 10);
    if (semester) where.semester = semester;

    const courses = await prisma.course.findMany({
      where,
      include: { department: true }
    });
    
    return NextResponse.json({ data: courses });
  } catch (error: any) {
    return NextResponse.json({ error: { message: error.message } }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const user = await getCurrentUser(req as any);
    if (!user || user.role !== 'ADMIN') return authErrorResponse(new Error("Unauthorized"));

    const body = await req.json();
    
    const existing = await prisma.course.findUnique({ where: { code_departmentId: { code: body.code, departmentId: body.departmentId } } });
    if (existing) {
      return NextResponse.json({ error: { message: 'Validation failed', fields: { code: 'Course code already exists' } } }, { status: 400 });
    }

    const course = await prisma.course.create({
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
        action: 'CREATE',
        entityType: 'COURSE',
        entityId: course.id,
        actorId: user.userId,
        details: `Created course ${course.code}`
      }
    });

    return NextResponse.json({ data: course });
  } catch (error: any) {
    return NextResponse.json({ error: { message: error.message } }, { status: 500 });
  }
}
