import express from 'express';
import request from 'supertest';
import { describe, expect, it } from 'vitest';

async function buildApp(max?: string) {
  if (max === undefined) {
    delete process.env.AUTH_RATE_LIMIT_MAX;
  } else {
    process.env.AUTH_RATE_LIMIT_MAX = max;
  }

  const { authLimiter } = await import(`../rateLimit?bust=${max ?? 'default'}`);

  const app = express();
  app.get('/auth', authLimiter, (_req, res) => {
    res.json({ ok: true });
  });
  return app;
}

describe('authLimiter', () => {
  it('respeita o teto definido em AUTH_RATE_LIMIT_MAX', async () => {
    const app = await buildApp('2');

    expect((await request(app).get('/auth')).status).toBe(200);
    expect((await request(app).get('/auth')).status).toBe(200);
    expect((await request(app).get('/auth')).status).toBe(429);
  });

  it('usa 20 como padrão quando a variável não está definida', async () => {
    const app = await buildApp(undefined);

    for (let i = 0; i < 20; i += 1) {
      expect((await request(app).get('/auth')).status).toBe(200);
    }
    expect((await request(app).get('/auth')).status).toBe(429);
  });

  it('ignora valor não numérico e cai no padrão', async () => {
    const app = await buildApp('muitos');

    expect((await request(app).get('/auth')).status).toBe(200);
  });
});
