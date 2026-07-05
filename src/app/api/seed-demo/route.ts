import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { hashPassword } from '@/lib/auth';

export async function POST() {
  try {
    const email = 'demo@debtclarity.com';
    const existing = await db.user.findUnique({ where: { email } });
    if (existing) {
      return NextResponse.json({ message: 'Demo already seeded' });
    }

    const hashedPassword = await hashPassword('DemoPassword1!');
    const user = await db.user.create({
      data: {
        email,
        password: hashedPassword,
        debts: {
          create: [
            { name: 'High Interest CC', principal: 8000, apr: 24.99, minimum_payment: 200, type: 'credit_card' },
            { name: 'Student Loan', principal: 15000, apr: 6.8, minimum_payment: 250, type: 'personal_loan' },
            { name: 'Car Loan', principal: 12000, apr: 4.5, minimum_payment: 300, type: 'other' },
          ],
        },
      },
    });

    return NextResponse.json({ message: 'Seeded successfully', email: 'demo@debtclarity.com', password: 'DemoPassword1!' });
  } catch (error) {
    return NextResponse.json({ error: 'Failed to seed' }, { status: 500 });
  }
}
