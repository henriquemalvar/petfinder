import express from 'express';
import request from 'supertest';
import { describe, expect, it } from 'vitest';

const DEFAULT_AUTH_MAX = 20;

async function buildApp(max?: string): Promise<express.Express> {
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

async function expectBlockedAfter(app: express.Express, allowed: number): Promise<void> {
  for (let i = 0; i < allowed; i += 1) {
    expect((await request(app).get('/auth')).status).toBe(200);
  }
  expect((await request(app).get('/auth')).status).toBe(429);
}

describe('authLimiter', () => {
  it('respeita o teto definido em AUTH_RATE_LIMIT_MAX', async () => {
    await expectBlockedAfter(await buildApp('2'), 2);
  });

  it('usa o padrão quando a variável não está definida', async () => {
    await expectBlockedAfter(await buildApp(undefined), DEFAULT_AUTH_MAX);
  });

  it.each(['muitos', '', '0', '-5'])('cai no padrão quando o valor é %j', async (value) => {
    await expectBlockedAfter(await buildApp(value), DEFAULT_AUTH_MAX);
  });
});
