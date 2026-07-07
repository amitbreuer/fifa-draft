import { Request, Response, NextFunction } from 'express';
import crypto from 'crypto';

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
    const botToken = process.env.TELEGRAM_BOT_TOKEN || '';
    if (!botToken) return null;

    const params = new URLSearchParams(initData);
    const hash = params.get('hash');
    if (!hash) return null;

    // Only `hash` is excluded from the data-check-string. The `signature` field
    // (Ed25519, for third-party validation) IS included in Telegram's HMAC hash,
    // so it must remain here — removing it makes validation fail for real clients.
    params.delete('hash');
    const dataCheckString = Array.from(params.entries())
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([key, val]) => `${key}=${val}`)
      .join('\n');

    const secretKey = crypto.createHmac('sha256', 'WebAppData').update(botToken).digest();
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

/** Auth middleware — validates Telegram initData */
export function authMiddleware(req: AuthenticatedRequest, res: Response, next: NextFunction): void {
  // Validate initData from header
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
