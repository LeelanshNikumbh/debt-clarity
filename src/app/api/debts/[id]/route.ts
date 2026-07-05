import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { getUserIdFromRequest } from '@/lib/api-auth';
import { logError } from '@/lib/logger';

export async function DELETE(req: Request, context: { params: Promise<{ id: string }> }) {
  try {
    const userId = getUserIdFromRequest(req);
    if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { id: debtId } = await context.params;

    // Verify ownership
    const debt = await db.debt.findUnique({ where: { id: debtId } });
    if (!debt || debt.userId !== userId) {
      return NextResponse.json({ error: 'Not found or forbidden' }, { status: 403 });
    }

    // Soft delete by setting archived_at (FR9)
    await db.debt.update({
      where: { id: debtId },
      data: { archived_at: new Date() },
    });

    return NextResponse.json({ success: true }, { status: 200 });
  } catch (error) {
    logError(req, `DELETE /api/debts/[id]`, 'InternalError', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

export async function PATCH(req: Request, context: { params: Promise<{ id: string }> }) {
  try {
    const userId = getUserIdFromRequest(req);
    if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { id: debtId } = await context.params;

    const debt = await db.debt.findUnique({ where: { id: debtId } });
    if (!debt || debt.userId !== userId) {
      return NextResponse.json({ error: 'Not found or forbidden' }, { status: 403 });
    }

    const body = await req.json();
    if (body.paid) {
      await db.debt.update({
        where: { id: debtId },
        data: { paid_at: new Date() },
      });
    }

    return NextResponse.json({ success: true }, { status: 200 });
  } catch (error) {
    logError(req, `PATCH /api/debts/[id]`, 'InternalError', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
