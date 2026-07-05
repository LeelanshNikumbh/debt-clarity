import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { getUserIdFromRequest } from '@/lib/api-auth';
import { calculatePayoff } from '@/lib/calculator';
import { logError } from '@/lib/logger';
import { z } from 'zod';

const simulateSchema = z.object({
  budget: z.number().positive(),
  strategy: z.enum(['avalanche', 'snowball']),
  extra_lump_sum: z.number().nonnegative().optional(),
  lump_sum_target_id: z.string().optional(),
});

export async function POST(req: Request) {
  try {
    const userId = getUserIdFromRequest(req);
    if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const body = await req.json();
    const parsed = simulateSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: 'Invalid input', details: parsed.error.issues }, { status: 400 });
    }

    const { budget, strategy, extra_lump_sum, lump_sum_target_id } = parsed.data;

    const debts = await db.debt.findMany({
      where: { userId, archived_at: null },
    });

    if (debts.length === 0) {
      return NextResponse.json({ error: 'Add at least one debt to calculate a strategy' }, { status: 400 });
    }

    // Convert Prisma decimals to numbers for calculator
    const debtInputs = debts.map(d => ({
      id: d.id,
      name: d.name,
      principal: Number(d.principal),
      apr: Number(d.apr),
      minimum_payment: Number(d.minimum_payment),
    }));

    try {
      const results = calculatePayoff(debtInputs, budget, strategy, extra_lump_sum, lump_sum_target_id);
      return NextResponse.json(results, { status: 200 });
    } catch (e: any) {
      if (e.message.startsWith('Budget shortfall')) {
        return NextResponse.json({ error: e.message }, { status: 422 });
      }
      throw e;
    }
  } catch (error) {
    logError(req, 'POST /api/simulate', 'InternalError', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
