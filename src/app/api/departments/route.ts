import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getCurrentUser, authErrorResponse } from '@/lib/auth/session';

export async function GET() {
  try {
    const departments = await prisma.department.findMany({
      include: {
        _count: {
          select: { users: true, courses: true }
        }
      }
    });
    return NextResponse.json({ data: departments });
  } catch (error: any) {
    return NextResponse.json({ error: { message: error.message } }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const user = await getCurrentUser(req as any);
    if (!user || user.role !== 'ADMIN') return authErrorResponse(new Error("Unauthorized"));

    const body = await req.json();
    const { code, name } = body;

    const existing = await prisma.department.findUnique({ where: { code } });
    if (existing) {
      return NextResponse.json({ error: { message: 'Validation failed', fields: { code: 'Code already exists' } } }, { status: 400 });
    }

    const department = await prisma.department.create({
      data: { code, name }
    });

    await prisma.auditLog.create({
      data: {
        action: 'CREATE',
        entityType: 'DEPARTMENT',
        entityId: department.id,
        actorId: user.userId,
        details: `Created department ${code}`
      }
    });

    return NextResponse.json({ data: department });
  } catch (error: any) {
    return NextResponse.json({ error: { message: error.message } }, { status: 500 });
  }
}
