import { verifyAccessToken } from './auth';

export function getUserIdFromRequest(req: Request): string | null {
  const authHeader = req.headers.get('authorization');
  if (!authHeader?.startsWith('Bearer ')) return null;

  const token = authHeader.substring(7);
  const decoded = verifyAccessToken(token);
  return decoded ? decoded.userId : null;
}
