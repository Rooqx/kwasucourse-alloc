import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET(req: Request) {
  try {
    const url = new URL(req.url);
    const isApprovedParam = url.searchParams.get('isApproved');

    const where: any = { role: 'LECTURER' };
    if (isApprovedParam !== null) {
      where.isApproved = isApprovedParam === 'true';
    }

    const lecturers = await prisma.user.findMany({
      where,
      include: {
        lecturerProfile: {
          include: { user: { select: { department: true } } }
        }
      }
    });
    
    return NextResponse.json({ data: lecturers });
  } catch (error: any) {
    return NextResponse.json({ error: { message: error.message } }, { status: 500 });
  }
}
