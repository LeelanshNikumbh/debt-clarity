import { db } from './db';

export async function checkRateLimit(ip: string): Promise<boolean> {
  const windowStart = new Date();
  windowStart.setSeconds(0, 0); // truncate to current minute
  const windowStr = windowStart.toISOString();

  try {
    const record = await db.rateLimit.upsert({
      where: {
        ip_window: {
          ip,
          window: windowStr,
        },
      },
      create: {
        ip,
        window: windowStr,
        requests: 1,
      },
      update: {
        requests: {
          increment: 1,
        },
      },
    });

    if (record.requests > 5) {
      return false;
    }
    return true;
  } catch (error) {
    console.error('Rate limit error:', error);
    return true;
  }
}
