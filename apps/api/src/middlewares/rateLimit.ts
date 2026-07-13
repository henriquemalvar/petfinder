import rateLimit from 'express-rate-limit';

// O e2e roda tudo a partir de um mesmo IP (localhost), entao logins de UI e
// de cy.request compartilham o mesmo balde. AUTH_RATE_LIMIT_MAX afrouxa o
// limite so nesse ambiente; em producao vale o default.
const MAX_ATTEMPTS = Number(process.env.AUTH_RATE_LIMIT_MAX) || 20;

/**
 * Limite mais rígido para rotas de autenticação, mitigando brute force
 * de senha e spam de cadastro.
 */
export const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutos
  max: MAX_ATTEMPTS, // tentativas por IP na janela
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Muitas tentativas. Tente novamente mais tarde.' },
});
