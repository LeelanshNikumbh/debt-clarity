import { NextResponse } from 'next/server';
import { verifyRefreshToken, signAccessToken } from '@/lib/auth';
import { logError } from '@/lib/logger';

export async function POST(req: Request) {
  try {
    const cookieStore = req.headers.get('cookie');
    const refreshTokenMatch = cookieStore?.match(/refreshToken=([^;]+)/);
    const refreshToken = refreshTokenMatch ? refreshTokenMatch[1] : null;

    if (!refreshToken) {
      return NextResponse.json({ error: 'Refresh token missing' }, { status: 401 });
    }

    const decoded = verifyRefreshToken(refreshToken);
    if (!decoded) {
      return NextResponse.json({ error: 'Invalid or expired refresh token' }, { status: 401 });
    }

    const newAccessToken = signAccessToken(decoded.userId);
    return NextResponse.json({ accessToken: newAccessToken }, { status: 200 });
  } catch (error) {
    logError(req, '/api/auth/refresh', 'InternalError', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
