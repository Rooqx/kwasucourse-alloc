import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getCurrentUser, authErrorResponse } from '@/lib/auth/session';

export async function GET() {
  try {
    const sessions = await prisma.academicSession.findMany({
      orderBy: { createdAt: 'desc' }
    });
    return NextResponse.json({ data: sessions });
  } catch (error: any) {
    return NextResponse.json({ error: { message: error.message } }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const user = await getCurrentUser(req as any);
    if (!user || user.role !== 'ADMIN') return authErrorResponse(new Error("Unauthorized"));

    const body = await req.json();
    const { label, semester, isActive } = body;

    const session = await prisma.academicSession.create({
      data: {
        label: label || 'New Session',
        semester: semester || 'First',
        isActive: isActive || false,
      }
    });

    if (isActive) {
      await prisma.academicSession.updateMany({
        where: { id: { not: session.id } },
        data: { isActive: false }
      });
    }

    await prisma.auditLog.create({
      data: {
        action: 'CREATE',
        entityType: 'SESSION',
        entityId: session.id,
        actorId: user.userId,
        details: `Created session ${label}`
      }
    });

    return NextResponse.json({ data: session });
  } catch (error: any) {
    return NextResponse.json({ error: { message: error.message } }, { status: 500 });
  }
}
