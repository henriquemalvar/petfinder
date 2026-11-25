import express from 'express';
import request from 'supertest';
import { afterEach, describe, expect, it } from 'vitest';

const DEFAULT_AUTH_MAX = 20;

async function buildApp(max?: string, instance = ''): Promise<express.Express> {
  if (max === undefined) {
    delete process.env.AUTH_RATE_LIMIT_MAX;
  } else {
    process.env.AUTH_RATE_LIMIT_MAX = max;
  }

  const { authLimiter } = await import(`../rateLimit?bust=${max ?? 'default'}${instance}`);

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

describe('authLimiter atrás do proxy do web', () => {
  const SECRET = 'segredo-do-proxy';

  afterEach(() => {
    delete process.env.AUTH_PROXY_SECRET;
  });

  function viaProxy(app: express.Express, clientIp: string, secret = SECRET): request.Test {
    return request(app).get('/auth').set('x-client-ip', clientIp).set('x-proxy-secret', secret);
  }

  it('conta cada visitante separado quando o segredo confere', async () => {
    process.env.AUTH_PROXY_SECRET = SECRET;
    const app = await buildApp('1', 'visitantes');

    expect((await viaProxy(app, '200.1.1.1')).status).toBe(200);
    expect((await viaProxy(app, '200.1.1.1')).status).toBe(429);
    expect((await viaProxy(app, '200.2.2.2')).status).toBe(200);
  });

  it('ignora o IP repassado quando o segredo não confere', async () => {
    process.env.AUTH_PROXY_SECRET = SECRET;
    const app = await buildApp('1', 'segredo-errado');

    expect((await viaProxy(app, '200.1.1.1', 'chute')).status).toBe(200);
    expect((await viaProxy(app, '200.2.2.2', 'chute')).status).toBe(429);
  });

  it('ignora o IP repassado quando a API não tem segredo configurado', async () => {
    const app = await buildApp('1', 'sem-segredo');

    expect((await viaProxy(app, '200.1.1.1', '')).status).toBe(200);
    expect((await viaProxy(app, '200.2.2.2', '')).status).toBe(429);
  });
});
