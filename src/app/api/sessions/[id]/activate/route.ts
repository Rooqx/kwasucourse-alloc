import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getCurrentUser, authErrorResponse } from '@/lib/auth/session';

export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const user = await getCurrentUser(req as any);
    if (!user || user.role !== 'ADMIN') return authErrorResponse(new Error("Unauthorized"));

    await prisma.$transaction([
      prisma.academicSession.updateMany({
        data: { isActive: false }
      }),
      prisma.academicSession.update({
        where: { id: (await params).id },
        data: { isActive: true }
      })
    ]);

    await prisma.auditLog.create({
      data: {
        action: 'UPDATE',
        entityType: 'SESSION',
        entityId: (await params).id,
        actorId: user.userId,
        details: `Activated session ${(await params).id}`
      }
    });

    return NextResponse.json({ data: { success: true } });
  } catch (error: any) {
    return NextResponse.json({ error: { message: error.message } }, { status: 500 });
  }
}
