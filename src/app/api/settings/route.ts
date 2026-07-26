import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getCurrentUser, authErrorResponse } from '@/lib/auth/session';

export async function GET() {
  try {
    const configs = await prisma.systemConfig.findMany();
    if (configs.length === 0) {
      await prisma.systemConfig.createMany({
        data: [
          { key: 'allocation_weight_w1', value: '0.4' },
          { key: 'allocation_weight_w2', value: '0.3' },
          { key: 'allocation_weight_w3', value: '0.2' },
          { key: 'allocation_weight_w4', value: '0.1' },
        ]
      });
    }
    
    const dbConfigs = await prisma.systemConfig.findMany();
    const configObj = dbConfigs.reduce((acc: any, curr) => {
      acc[curr.key] = parseFloat(curr.value);
      return acc;
    }, {});
    
    return NextResponse.json({ data: configObj });
  } catch (error: any) {
    return NextResponse.json({ error: { message: error.message } }, { status: 500 });
  }
}

export async function PUT(req: Request) {
  try {
    const user = await getCurrentUser(req as any);
    if (!user || user.role !== 'ADMIN') return authErrorResponse(new Error("Unauthorized"));

    const body = await req.json();
    const { w1, w2, w3, w4 } = body;

    const sum = w1 + w2 + w3 + w4;
    if (Math.abs(sum - 1.0) > 0.001) {
      return NextResponse.json({ error: { message: 'Weights must sum to 1.0' } }, { status: 400 });
    }

    await prisma.$transaction([
      prisma.systemConfig.upsert({ where: { key: 'allocation_weight_w1' }, update: { value: w1.toString() }, create: { key: 'allocation_weight_w1', value: w1.toString() } }),
      prisma.systemConfig.upsert({ where: { key: 'allocation_weight_w2' }, update: { value: w2.toString() }, create: { key: 'allocation_weight_w2', value: w2.toString() } }),
      prisma.systemConfig.upsert({ where: { key: 'allocation_weight_w3' }, update: { value: w3.toString() }, create: { key: 'allocation_weight_w3', value: w3.toString() } }),
      prisma.systemConfig.upsert({ where: { key: 'allocation_weight_w4' }, update: { value: w4.toString() }, create: { key: 'allocation_weight_w4', value: w4.toString() } }),
    ]);

    await prisma.auditLog.create({
      data: {
        action: 'UPDATE',
        entityType: 'SETTINGS',
        entityId: 'system',
        actorId: user.userId,
        details: `Updated allocation weights`
      }
    });

    return NextResponse.json({ data: { w1, w2, w3, w4 } });
  } catch (error: any) {
    return NextResponse.json({ error: { message: error.message } }, { status: 500 });
  }
}
