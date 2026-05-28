import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import crypto from 'crypto';

const JWT_SECRET = process.env.JWT_SECRET || 'dev-secret';
const BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN || '';

export interface AuthenticatedRequest extends Request {
  user?: {
    telegramId: number;
    username?: string;
    firstName?: string;
  };
}

/** Validate Telegram Mini App initData and extract user info */
export function validateInitData(initData: string): { telegramId: number; username?: string; firstName?: string } | null {
  try {
    const params = new URLSearchParams(initData);
    const hash = params.get('hash');
    if (!hash) return null;

    params.delete('hash');
    const dataCheckString = Array.from(params.entries())
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([key, val]) => `${key}=${val}`)
      .join('\n');

    const secretKey = crypto.createHmac('sha256', 'WebAppData').update(BOT_TOKEN).digest();
    const expectedHash = crypto.createHmac('sha256', secretKey).update(dataCheckString).digest('hex');

    if (hash !== expectedHash) return null;

    const userStr = params.get('user');
    if (!userStr) return null;

    const user = JSON.parse(userStr);
    return {
      telegramId: user.id,
      username: user.username,
      firstName: user.first_name,
    };
  } catch {
    return null;
  }
}

/** Auth middleware — validates JWT or initData */
export function authMiddleware(req: AuthenticatedRequest, res: Response, next: NextFunction): void {
  const authHeader = req.headers.authorization;

  // Try JWT first
  if (authHeader?.startsWith('Bearer ')) {
    try {
      const payload = jwt.verify(authHeader.slice(7), JWT_SECRET) as any;
      req.user = { telegramId: payload.telegramId, username: payload.username, firstName: payload.firstName };
      next();
      return;
    } catch { /* fall through to initData */ }
  }

  // Try initData from header
  const initData = req.headers['x-telegram-init-data'] as string;
  if (initData) {
    const user = validateInitData(initData);
    if (user) {
      req.user = user;
      next();
      return;
    }
  }

  // Dev mode bypass
  if (process.env.NODE_ENV === 'development' && req.headers['x-dev-telegram-id']) {
    req.user = {
      telegramId: Number(req.headers['x-dev-telegram-id']),
      username: 'dev_user',
      firstName: 'Dev',
    };
    next();
    return;
  }

  res.status(401).json({ error: 'Unauthorized' });
}

/** Generate JWT from validated user */
export function generateToken(user: { telegramId: number; username?: string; firstName?: string }): string {
  return jwt.sign(user, JWT_SECRET, { expiresIn: '24h' });
}
