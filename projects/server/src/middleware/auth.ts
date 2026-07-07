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
  const debug = process.env.AUTH_DEBUG === '1';
  try {
    const botToken = process.env.TELEGRAM_BOT_TOKEN || '';
    if (!botToken) { if (debug) console.warn('[AUTH_DEBUG] no bot token set'); return null; }

    const params = new URLSearchParams(initData);
    const hash = params.get('hash');
    if (debug) console.warn('[AUTH_DEBUG] keys=', Array.from(params.keys()).sort().join(','), 'hashPresent=', !!hash, 'initDataLen=', initData.length);
    if (!hash) return null;

    params.delete('hash');
    // Telegram Mini App initData includes a `signature` field (Ed25519, used for
    // third-party validation). It must be excluded from the HMAC data-check-string,
    // otherwise validation fails for all real clients.
    params.delete('signature');
    const dataCheckString = Array.from(params.entries())
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([key, val]) => `${key}=${val}`)
      .join('\n');

    const secretKey = crypto.createHmac('sha256', 'WebAppData').update(botToken).digest();
    const expectedHash = crypto.createHmac('sha256', secretKey).update(dataCheckString).digest('hex');

    if (hash !== expectedHash) {
      if (debug) console.warn('[AUTH_DEBUG] hash mismatch. received=', hash, 'expected=', expectedHash, 'rawInitData=', initData);
      return null;
    }

    const userStr = params.get('user');
    if (!userStr) return null;

    const user = JSON.parse(userStr);
    return {
      telegramId: user.id,
      username: user.username,
      firstName: user.first_name,
    };
  } catch (e) {
    if (debug) console.warn('[AUTH_DEBUG] exception', e);
    return null;
  }
}

/** Auth middleware — validates Telegram initData */
export function authMiddleware(req: AuthenticatedRequest, res: Response, next: NextFunction): void {
  const debug = process.env.AUTH_DEBUG === '1';
  // Validate initData from header
  const initData = req.headers['x-telegram-init-data'] as string;
  if (debug) {
    console.warn('[AUTH_DEBUG] path=', req.method, req.originalUrl,
      'hasInitDataHeader=', !!initData,
      'initDataHeaderLen=', initData ? initData.length : 0,
      'hasDevHeader=', !!req.headers['x-dev-telegram-id']);
  }
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
