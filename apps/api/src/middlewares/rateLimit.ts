import rateLimit from 'express-rate-limit';

const DEFAULT_AUTH_MAX = 20;

function resolveAuthMax(): number {
  const raw = Number(process.env.AUTH_RATE_LIMIT_MAX);
  return Number.isFinite(raw) && raw > 0 ? raw : DEFAULT_AUTH_MAX;
}

export const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: resolveAuthMax(),
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Muitas tentativas. Tente novamente mais tarde.' },
});
