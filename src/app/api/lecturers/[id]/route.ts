import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getCurrentUser, authErrorResponse } from '@/lib/auth/session';

export async function GET(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const lecturer = await prisma.user.findUnique({
      where: { id: (await params).id, role: 'LECTURER' },
      include: {
        lecturerProfile: {
          include: { user: { select: { department: true } } }
        }
      }
    });
    if (!lecturer) return NextResponse.json({ error: { message: 'Not found' } }, { status: 404 });
    return NextResponse.json({ data: lecturer });
  } catch (error: any) {
    return NextResponse.json({ error: { message: error.message } }, { status: 500 });
  }
}

export async function PUT(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const user = await getCurrentUser(req as any);
    if (!user || user.role !== 'ADMIN') return authErrorResponse(new Error("Unauthorized"));

    const body = await req.json();

    const profile = await prisma.lecturerProfile.update({
      where: { userId: (await params).id },
      data: {
        maxLoadUnits: body.maxUnits,
        specialization: body.specialization,
        seniorityRank: body.seniorityLevel,

      }
    });

    await prisma.auditLog.create({
      data: {
        action: 'UPDATE',
        entityType: 'LECTURER',
        entityId: (await params).id,
        actorId: user.userId,
        details: `Updated lecturer profile for ${(await params).id}`
      }
    });

    return NextResponse.json({ data: profile });
  } catch (error: any) {
    return NextResponse.json({ error: { message: error.message } }, { status: 500 });
  }
}
