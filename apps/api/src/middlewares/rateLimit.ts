import rateLimit from 'express-rate-limit';

const DEFAULT_AUTH_MAX = 20;

function resolveAuthMax(): number {
  const raw = Number(process.env.AUTH_RATE_LIMIT_MAX);
  return Number.isFinite(raw) && raw > 0 ? raw : DEFAULT_AUTH_MAX;
}

/**
 * Limite mais rígido para rotas de autenticação, mitigando brute force
 * de senha e spam de cadastro. O teto é configurável porque a suíte de
 * e2e roda dezenas de logins de um mesmo IP.
 */
export const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutos
  max: resolveAuthMax(),
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Muitas tentativas. Tente novamente mais tarde.' },
});
