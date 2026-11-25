import express, { NextFunction, Request, Response } from 'express';
import request from 'supertest';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { isDemoAccount, lockDemoAccount, lockDemoCredentials } from '../demoAccount';

const DEMO_EMAIL = 'demo@petfinder.example';

function appAs(email: string): express.Express {
  const app = express();
  app.use(express.json());
  app.use((req: Request, _res: Response, next: NextFunction) => {
    req.user = { id: 'u1', email } as Request['user'];
    next();
  });
  const ok = (_req: Request, res: Response): void => {
    res.json({ ok: true });
  };
  app.post('/change-password', lockDemoAccount, ok);
  app.delete('/users/u1', lockDemoAccount, ok);
  app.put('/users/u1', lockDemoCredentials, ok);
  return app;
}

beforeEach(() => {
  process.env.DEMO_USER_EMAIL = DEMO_EMAIL;
});

afterEach(() => {
  delete process.env.DEMO_USER_EMAIL;
});

describe('isDemoAccount', () => {
  it('reconhece o e-mail da demo sem diferenciar maiúsculas', () => {
    expect(isDemoAccount('Demo@PetFinder.example')).toBe(true);
  });

  it('não reconhece outros e-mails', () => {
    expect(isDemoAccount('joao@email.com')).toBe(false);
  });

  it('não reconhece ninguém quando DEMO_USER_EMAIL não está definida', () => {
    delete process.env.DEMO_USER_EMAIL;
    expect(isDemoAccount(DEMO_EMAIL)).toBe(false);
    expect(isDemoAccount(undefined)).toBe(false);
  });
});

describe('conta demo', () => {
  it('não troca a senha', async () => {
    const res = await request(appAs(DEMO_EMAIL)).post('/change-password').send({});
    expect(res.status).toBe(403);
  });

  it('não exclui a conta', async () => {
    expect((await request(appAs(DEMO_EMAIL)).delete('/users/u1')).status).toBe(403);
  });

  it('não troca e-mail nem senha pelo perfil', async () => {
    const app = appAs(DEMO_EMAIL);
    expect((await request(app).put('/users/u1').send({ email: 'x@y.com' })).status).toBe(403);
    expect((await request(app).put('/users/u1').send({ password: 'nova-senha' })).status).toBe(403);
  });

  it('edita o restante do perfil normalmente', async () => {
    const res = await request(appAs(DEMO_EMAIL)).put('/users/u1').send({ name: 'Outro nome' });
    expect(res.status).toBe(200);
  });
});

describe('outras contas', () => {
  it('trocam senha, e-mail e excluem a conta normalmente', async () => {
    const app = appAs('joao@email.com');
    expect((await request(app).post('/change-password').send({})).status).toBe(200);
    expect((await request(app).put('/users/u1').send({ email: 'x@y.com' })).status).toBe(200);
    expect((await request(app).delete('/users/u1')).status).toBe(200);
  });
});
