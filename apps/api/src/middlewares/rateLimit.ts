import { timingSafeEqual } from 'node:crypto';
import { Request } from 'express';
import rateLimit, { ipKeyGenerator } from 'express-rate-limit';

const DEFAULT_AUTH_MAX = 20;

export const CLIENT_IP_HEADER = 'x-client-ip';
export const PROXY_SECRET_HEADER = 'x-proxy-secret';

function resolveAuthMax(): number {
  const raw = Number(process.env.AUTH_RATE_LIMIT_MAX);
  return Number.isFinite(raw) && raw > 0 ? raw : DEFAULT_AUTH_MAX;
}

function secretsMatch(received: string, expected: string): boolean {
  const a = Buffer.from(received);
  const b = Buffer.from(expected);
  return a.length === b.length && timingSafeEqual(a, b);
}

function forwardedClientIp(req: Request): string | undefined {
  const expected = process.env.AUTH_PROXY_SECRET;
  const received = req.get(PROXY_SECRET_HEADER);
  const clientIp = req.get(CLIENT_IP_HEADER)?.trim();
  if (!expected || !received || !clientIp) return undefined;
  return secretsMatch(received, expected) ? clientIp : undefined;
}

export function authRateLimitKey(req: Request): string {
  return ipKeyGenerator(forwardedClientIp(req) ?? req.ip ?? '');
}

export const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: resolveAuthMax(),
  standardHeaders: true,
  legacyHeaders: false,
  keyGenerator: authRateLimitKey,
  message: { error: 'Muitas tentativas. Tente novamente mais tarde.' },
});
