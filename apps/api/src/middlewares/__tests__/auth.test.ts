import express from 'express';
import * as jwt from 'jsonwebtoken';
import request from 'supertest';
import { beforeEach, describe, expect, it, vi } from 'vitest';

process.env.JWT_SECRET = 'segredo-de-teste';

const findUnique = vi.fn();

vi.mock('../../config/prisma', () => ({
  prisma: { user: { findUnique: (...args: unknown[]) => findUnique(...args) } },
}));

const { authMiddleware } = await import('../auth');
const { errorHandler } = await import('../errorHandler');

function buildApp() {
  const app = express();
  app.get('/protegido', authMiddleware, (_req, res) => {
    res.json({ ok: true });
  });
  app.use(errorHandler);
  return app;
}

function tokenValido() {
  return jwt.sign({ id: 'user-1' }, 'segredo-de-teste');
}

describe('authMiddleware', () => {
  beforeEach(() => {
    findUnique.mockReset();
  });

  it('responde 500 quando a consulta ao banco falha', async () => {
    findUnique.mockRejectedValue(new Error('Connection terminated unexpectedly'));

    const res = await request(buildApp())
      .get('/protegido')
      .set('Authorization', `Bearer ${tokenValido()}`);

    expect(res.status).toBe(500);
  });

  it('responde 401 quando o usuário do token não existe mais', async () => {
    findUnique.mockResolvedValue(null);

    const res = await request(buildApp())
      .get('/protegido')
      .set('Authorization', `Bearer ${tokenValido()}`);

    expect(res.status).toBe(401);
  });

  it('responde 401 quando a assinatura do token é inválida', async () => {
    const res = await request(buildApp())
      .get('/protegido')
      .set('Authorization', `Bearer ${jwt.sign({ id: 'user-1' }, 'outro-segredo')}`);

    expect(res.status).toBe(401);
    expect(findUnique).not.toHaveBeenCalled();
  });

  it('libera a requisição quando o token e o usuário são válidos', async () => {
    findUnique.mockResolvedValue({ id: 'user-1', name: 'Fulano' });

    const res = await request(buildApp())
      .get('/protegido')
      .set('Authorization', `Bearer ${tokenValido()}`);

    expect(res.status).toBe(200);
    expect(res.body).toEqual({ ok: true });
  });
});
