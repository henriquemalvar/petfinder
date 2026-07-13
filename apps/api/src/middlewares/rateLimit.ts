import rateLimit from 'express-rate-limit';

/**
 * Limite mais rígido para rotas de autenticação, mitigando brute force
 * de senha e spam de cadastro.
 */
export const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutos
  max: 20, // 20 tentativas por IP na janela
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Muitas tentativas. Tente novamente mais tarde.' },
});
