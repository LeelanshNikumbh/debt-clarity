import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { verifyPassword, signAccessToken, signRefreshToken } from '@/lib/auth';
import { checkRateLimit } from '@/lib/rate-limit';
import { logError } from '@/lib/logger';
import { z } from 'zod';

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string(),
});

export async function POST(req: Request) {
  try {
    const ip = req.headers.get('x-forwarded-for') || 'unknown';
    const isAllowed = await checkRateLimit(ip);
    if (!isAllowed) {
      return NextResponse.json({ error: 'Too many requests' }, { status: 429 });
    }

    const body = await req.json();
    const parsed = loginSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: 'Invalid input' }, { status: 400 });
    }

    const { email, password } = parsed.data;
    const user = await db.user.findUnique({ where: { email } });
    
    if (!user || !(await verifyPassword(password, user.password))) {
      return NextResponse.json({ error: 'Invalid credentials' }, { status: 401 });
    }

    const accessToken = signAccessToken(user.id);
    const refreshToken = signRefreshToken(user.id);

    const response = NextResponse.json({ accessToken }, { status: 200 });
    response.cookies.set('refreshToken', refreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 7 * 24 * 60 * 60,
      path: '/',
    });

    return response;
  } catch (error) {
    logError(req, '/api/auth/login', 'InternalError', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
