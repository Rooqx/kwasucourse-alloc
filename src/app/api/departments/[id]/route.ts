import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getCurrentUser, authErrorResponse } from '@/lib/auth/session';

export async function GET(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const department = await prisma.department.findUnique({
      where: { id: (await params).id },
      include: {
        users: { select: { id: true, fullName: true, email: true, role: true } },
        courses: true
      }
    });
    if (!department) return NextResponse.json({ error: { message: 'Not found' } }, { status: 404 });
    return NextResponse.json({ data: department });
  } catch (error: any) {
    return NextResponse.json({ error: { message: error.message } }, { status: 500 });
  }
}

export async function PUT(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const user = await getCurrentUser(req as any);
    if (!user || user.role !== 'ADMIN') return authErrorResponse(new Error("Unauthorized"));

    const body = await req.json();
    const { code, name } = body;

    const department = await prisma.department.update({
      where: { id: (await params).id },
      data: { code, name }
    });

    await prisma.auditLog.create({
      data: {
        action: 'UPDATE',
        entityType: 'DEPARTMENT',
        entityId: department.id,
        actorId: user.userId,
        details: `Updated department ${department.id}`
      }
    });

    return NextResponse.json({ data: department });
  } catch (error: any) {
    return NextResponse.json({ error: { message: error.message } }, { status: 500 });
  }
}

export async function DELETE(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const user = await getCurrentUser(req as any);
    if (!user || user.role !== 'ADMIN') return authErrorResponse(new Error("Unauthorized"));

    const department = await prisma.department.findUnique({
      where: { id: (await params).id },
      include: { _count: { select: { users: true, courses: true } } }
    });

    if (!department) return NextResponse.json({ error: { message: 'Not found' } }, { status: 404 });
    
    if (department._count.users > 0 || department._count.courses > 0) {
      return NextResponse.json({ error: { message: 'Cannot delete department with attached users or courses' } }, { status: 400 });
    }

    await prisma.department.delete({ where: { id: (await params).id } });

    await prisma.auditLog.create({
      data: {
        action: 'DELETE',
        entityType: 'DEPARTMENT',
        entityId: (await params).id,
        actorId: user.userId,
        details: `Deleted department ${(await params).id}`
      }
    });

    return NextResponse.json({ data: { success: true } });
  } catch (error: any) {
    return NextResponse.json({ error: { message: error.message } }, { status: 500 });
  }
}
