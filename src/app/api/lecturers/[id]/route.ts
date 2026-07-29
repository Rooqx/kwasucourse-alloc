import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getCurrentUser, authErrorResponse } from '@/lib/auth/session';

export async function GET(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const lecturer = await prisma.user.findUnique({
      where: { id: (await params).id, role: 'LECTURER' },
      include: {
        department: true,
        lecturerProfile: {
          include: { 
            allocations: { include: { course: true, session: true } }
          }
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

export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const user = await getCurrentUser(req as any);
    const { id } = await params;

    // Only LECTURER can patch, and only their own profile
    if (!user || user.role !== 'LECTURER' || user.userId !== id) {
      return authErrorResponse(new Error("Unauthorized"));
    }

    const body = await req.json();

    if (!body.specialization) {
      return NextResponse.json({ error: { message: 'Specialization is required' } }, { status: 400 });
    }

    const profile = await prisma.lecturerProfile.update({
      where: { userId: id },
      data: {
        specialization: body.specialization,
      }
    });

    await prisma.auditLog.create({
      data: {
        action: 'UPDATE',
        entityType: 'LECTURER',
        entityId: id,
        actorId: user.userId,
        details: `Lecturer updated their own specialization`
      }
    });

    return NextResponse.json({ data: profile });
  } catch (error: any) {
    return NextResponse.json({ error: { message: error.message } }, { status: 500 });
  }
}
