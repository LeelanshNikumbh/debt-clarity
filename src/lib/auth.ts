import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET || 'fallback-secret-do-not-use-in-prod';
const JWT_REFRESH_SECRET = process.env.JWT_REFRESH_SECRET || 'fallback-refresh-secret-do-not-use-in-prod';

export const hashPassword = async (password: string): Promise<string> => {
  return bcrypt.hash(password, 10);
};

export const verifyPassword = async (password: string, hash: string): Promise<boolean> => {
  return bcrypt.compare(password, hash);
};

export const signAccessToken = (userId: string): string => {
  return jwt.sign({ userId }, JWT_SECRET, { expiresIn: '15m' });
};

export const signRefreshToken = (userId: string): string => {
  return jwt.sign({ userId }, JWT_REFRESH_SECRET, { expiresIn: '7d' });
};

export const verifyAccessToken = (token: string): { userId: string } | null => {
  try {
    return jwt.verify(token, JWT_SECRET) as { userId: string };
  } catch (error) {
    return null;
  }
};

export const verifyRefreshToken = (token: string): { userId: string } | null => {
  try {
    return jwt.verify(token, JWT_REFRESH_SECRET) as { userId: string };
  } catch (error) {
    return null;
  }
};
