import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getCurrentUser, authErrorResponse } from '@/lib/auth/session';

export async function GET() {
  try {
    const user = await getCurrentUser(null as any);
    if (!user || user.role !== 'ADMIN') return authErrorResponse(new Error("Unauthorized"));

    const logs = await prisma.auditLog.findMany({
      orderBy: { createdAt: 'desc' },
      include: { actor: { select: { fullName: true, email: true } } }
    });
    return NextResponse.json({ data: logs });
  } catch (error: any) {
    return NextResponse.json({ error: { message: error.message } }, { status: 500 });
  }
}
