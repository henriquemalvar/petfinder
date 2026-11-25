import { describe, expect, it } from 'vitest';
import { app, registerUser, request } from './helpers';

describe('POST /api/auth/register', () => {
  it('recusa email já cadastrado', async () => {
    const user = await registerUser();

    const res = await request(app)
      .post('/api/auth/register')
      .send({ name: 'Outro Nome', email: user.email, password: 'senha123' });

    expect(res.status).toBe(409);
  });

  it('recusa senha com menos de 6 caracteres', async () => {
    const res = await request(app)
      .post('/api/auth/register')
      .send({ name: 'Fulano', email: 'curta@petfinder.test', password: '123' });

    expect(res.status).toBe(400);
  });

  it('nunca devolve o hash da senha', async () => {
    const res = await request(app)
      .post('/api/auth/register')
      .send({ name: 'Fulano', email: 'hash@petfinder.test', password: 'senha123' });

    expect(res.status).toBe(201);
    expect(res.body.user).not.toHaveProperty('password');
  });
});

describe('POST /api/auth/login', () => {
  it('recusa senha errada', async () => {
    const user = await registerUser();

    const res = await request(app)
      .post('/api/auth/login')
      .send({ email: user.email, password: 'errada123' });

    expect(res.status).toBe(401);
  });

  it('não distingue email inexistente de senha errada na mensagem', async () => {
    const user = await registerUser();

    const senhaErrada = await request(app)
      .post('/api/auth/login')
      .send({ email: user.email, password: 'errada123' });
    const emailInexistente = await request(app)
      .post('/api/auth/login')
      .send({ email: 'ninguem@petfinder.test', password: 'errada123' });

    expect(senhaErrada.status).toBe(emailInexistente.status);
    expect(senhaErrada.body.error).toBe(emailInexistente.body.error);
  });
});

describe('authMiddleware', () => {
  it('recusa token ausente', async () => {
    const res = await request(app).get('/api/notifications');

    expect(res.status).toBe(401);
  });

  it('recusa esquema diferente de Bearer', async () => {
    const user = await registerUser();

    const res = await request(app)
      .get('/api/notifications')
      .set('Authorization', `Basic ${user.token}`);

    expect(res.status).toBe(401);
  });

  it('recusa token assinado com outro segredo', async () => {
    const res = await request(app)
      .get('/api/notifications')
      .set('Authorization', 'Bearer eyJhbGciOiJIUzI1NiJ9.eyJpZCI6IngifQ.assinatura_invalida');

    expect(res.status).toBe(401);
  });

  it('recusa token de usuário já excluído', async () => {
    const user = await registerUser();
    await request(app)
      .delete(`/api/users/${user.id}`)
      .set('Authorization', `Bearer ${user.token}`)
      .send({ password: 'senha123' });

    const res = await request(app)
      .get('/api/notifications')
      .set('Authorization', `Bearer ${user.token}`);

    expect(res.status).toBe(401);
  });
});
