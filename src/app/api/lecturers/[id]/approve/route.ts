import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getCurrentUser, authErrorResponse } from '@/lib/auth/session';

export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const user = await getCurrentUser(req as any);
    if (!user || user.role !== 'ADMIN') return authErrorResponse(new Error("Unauthorized"));

    const lecturer = await prisma.user.update({
      where: { id: (await params).id, role: 'LECTURER' },
      data: { isApproved: true }
    });

    await prisma.auditLog.create({
      data: {
        action: 'UPDATE',
        entityType: 'LECTURER',
        entityId: (await params).id,
        actorId: user.userId,
        details: `Approved lecturer ${(await params).id}`
      }
    });

    return NextResponse.json({ data: lecturer });
  } catch (error: any) {
    return NextResponse.json({ error: { message: error.message } }, { status: 500 });
  }
}
