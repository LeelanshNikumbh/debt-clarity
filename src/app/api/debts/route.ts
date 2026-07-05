import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { getUserIdFromRequest } from '@/lib/api-auth';
import { createDebtSchema } from '@/lib/debts';
import { logError } from '@/lib/logger';

export async function POST(req: Request) {
  try {
    const userId = getUserIdFromRequest(req);
    if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const body = await req.json();
    const parsed = createDebtSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: 'Invalid input', details: parsed.error.issues }, { status: 400 });
    }

    const debt = await db.debt.create({
      data: {
        ...parsed.data,
        userId,
      },
    });

    return NextResponse.json(debt, { status: 201 });
  } catch (error) {
    logError(req, 'POST /api/debts', 'InternalError', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

export async function GET(req: Request) {
  try {
    const userId = getUserIdFromRequest(req);
    if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const url = new URL(req.url);
    const limit = parseInt(url.searchParams.get('limit') || '30');
    const offset = parseInt(url.searchParams.get('offset') || '0');

    const debts = await db.debt.findMany({
      where: { userId, archived_at: null },
      orderBy: { apr: 'desc' },
      take: limit,
      skip: offset,
    });

    return NextResponse.json(debts, { status: 200 });
  } catch (error) {
    logError(req, 'GET /api/debts', 'InternalError', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
