import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { getUserIdFromRequest } from '@/lib/api-auth';
import { calculatePayoff } from '@/lib/calculator';
import { logError } from '@/lib/logger';
import { z } from 'zod';
import { generateText } from 'ai';
import { createGroq } from '@ai-sdk/groq';
import crypto from 'crypto';

const explainSchema = z.object({
  budget: z.number().positive(),
  strategy: z.enum(['avalanche', 'snowball']),
});

export async function POST(req: Request) {
  try {
    const userId = getUserIdFromRequest(req);
    if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const body = await req.json();
    const parsed = explainSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: 'Invalid input' }, { status: 400 });
    }

    const { budget, strategy } = parsed.data;

    const debts = await db.debt.findMany({ where: { userId, archived_at: null, paid_at: null } });
    if (debts.length === 0) {
      return NextResponse.json({ error: 'No debts' }, { status: 400 });
    }

    const debtInputs = debts.map(d => ({
      id: d.id,
      name: d.name, // Excluded below
      principal: Number(d.principal),
      apr: Number(d.apr),
      minimum_payment: Number(d.minimum_payment),
    }));

    let results;
    try {
      results = calculatePayoff(debtInputs, budget, strategy);
    } catch (e: any) {
      return NextResponse.json({ error: e.message }, { status: 422 });
    }

    const payload = JSON.stringify({
      debts: debtInputs.map(d => ({ p: d.principal, a: d.apr, m: d.minimum_payment })),
      budget,
      strategy
    });
    const inputHash = crypto.createHash('sha256').update(payload).digest('hex');

    const cached = await db.aICache.findUnique({ where: { inputHash } });
    if (cached && cached.expiresAt > new Date()) {
      return NextResponse.json({ explanation: cached.explanation, cached: true }, { status: 200 });
    }

    const safeDebts = debtInputs.map((d, i) => `Debt ${i + 1}: Principal $${d.principal}, APR ${d.apr}%`);
    const prompt = `
You are a financial assistant. Explain this user's debt payoff strategy in plain language (150-250 words).
Strategy selected: ${strategy}
Monthly budget: $${budget}
Debts:
${safeDebts.join('\n')}

Calculation results:
Total interest to be paid: $${results.total_interest.toFixed(2)}
Months to payoff: ${results.months_to_payoff}

Explain the tradeoffs between avalanche and snowball, and why this strategy works for their specific situation.
Do NOT give any investment advice or recommend taking new credit.
`;

    const groq = createGroq({
      apiKey: process.env.GROQ_API_KEY || 'dummy_key',
    });

    try {
      const { text } = await generateText({
        model: groq('llama-3.1-8b-instant'),
        prompt,
        maxRetries: 0,
        abortSignal: AbortSignal.timeout(8000),
      });

      const expiresAt = new Date();
      expiresAt.setHours(expiresAt.getHours() + 24);

      await db.aICache.upsert({
        where: { inputHash },
        create: { inputHash, explanation: text, expiresAt },
        update: { explanation: text, expiresAt },
      });

      return NextResponse.json({ explanation: text, cached: false }, { status: 200 });
    } catch (aiError) {
      logError(req, 'POST /api/ai/explain', 'AIProviderError', aiError);
      return NextResponse.json({ 
        explanation: "AI explanation unavailable right now — here are your calculated results.",
        fallback: true,
      }, { status: 200 });
    }
  } catch (error) {
    logError(req, 'POST /api/ai/explain', 'InternalError', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
