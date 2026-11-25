import { afterEach, describe, expect, it } from 'vitest';
import { app, registerUser, request, TestUser } from './helpers';

describe('POST /api/users/change-password', () => {
  it('recusa a troca quando a senha atual está errada', async () => {
    const user = await registerUser();

    const res = await request(app)
      .post('/api/users/change-password')
      .set('Authorization', `Bearer ${user.token}`)
      .send({ currentPassword: 'senhaErrada', newPassword: 'novaSenha123' });

    expect(res.status).toBe(401);

    const login = await request(app)
      .post('/api/auth/login')
      .send({ email: user.email, password: 'senha123' });
    expect(login.status).toBe(200);
  });

  it('troca a senha e invalida a antiga no login', async () => {
    const user = await registerUser();

    const res = await request(app)
      .post('/api/users/change-password')
      .set('Authorization', `Bearer ${user.token}`)
      .send({ currentPassword: 'senha123', newPassword: 'novaSenha123' });

    expect(res.status).toBe(204);

    const comAntiga = await request(app)
      .post('/api/auth/login')
      .send({ email: user.email, password: 'senha123' });
    expect(comAntiga.status).toBe(401);

    const comNova = await request(app)
      .post('/api/auth/login')
      .send({ email: user.email, password: 'novaSenha123' });
    expect(comNova.status).toBe(200);
  });
});

describe('DELETE /api/users/:id', () => {
  it('impede que um usuário exclua a conta de outro', async () => {
    const dono = await registerUser();
    const intruso = await registerUser();

    const res = await request(app)
      .delete(`/api/users/${dono.id}`)
      .set('Authorization', `Bearer ${intruso.token}`)
      .send({ password: 'senha123' });

    expect(res.status).toBe(403);

    const login = await request(app)
      .post('/api/auth/login')
      .send({ email: dono.email, password: 'senha123' });
    expect(login.status).toBe(200);
  });

  it('exige a senha para excluir a própria conta', async () => {
    const user = await registerUser();

    const semSenha = await request(app)
      .delete(`/api/users/${user.id}`)
      .set('Authorization', `Bearer ${user.token}`)
      .send({});
    expect(semSenha.status).toBe(400);

    const senhaErrada = await request(app)
      .delete(`/api/users/${user.id}`)
      .set('Authorization', `Bearer ${user.token}`)
      .send({ password: 'chutando' });
    expect(senhaErrada.status).toBe(401);

    const login = await request(app)
      .post('/api/auth/login')
      .send({ email: user.email, password: 'senha123' });
    expect(login.status).toBe(200);
  });

  it('exclui a própria conta com a senha correta', async () => {
    const user = await registerUser();

    const res = await request(app)
      .delete(`/api/users/${user.id}`)
      .set('Authorization', `Bearer ${user.token}`)
      .send({ password: 'senha123' });

    expect(res.status).toBe(204);

    const login = await request(app)
      .post('/api/auth/login')
      .send({ email: user.email, password: 'senha123' });
    expect(login.status).toBe(401);
  });
});

describe('PUT /api/users/:id', () => {
  it('impede que um usuário edite o perfil de outro', async () => {
    const dono = await registerUser();
    const intruso = await registerUser();

    const res = await request(app)
      .put(`/api/users/${dono.id}`)
      .set('Authorization', `Bearer ${intruso.token}`)
      .send({ name: 'Nome Sequestrado' });

    expect(res.status).toBe(403);
  });

  it('aceita atualização parcial sem exigir o objeto inteiro', async () => {
    const user = await registerUser();

    const res = await request(app)
      .put(`/api/users/${user.id}`)
      .set('Authorization', `Bearer ${user.token}`)
      .send({ whatsapp: '31999998888' });

    expect(res.status).toBe(200);
    expect(res.body.whatsapp).toBe('31999998888');
  });

  it('nunca devolve o hash da senha', async () => {
    const user = await registerUser();

    const res = await request(app)
      .put(`/api/users/${user.id}`)
      .set('Authorization', `Bearer ${user.token}`)
      .send({ name: 'Nome Novo' });

    expect(res.body).not.toHaveProperty('password');
  });
});

describe('conta demo', () => {
  afterEach(() => {
    delete process.env.DEMO_USER_EMAIL;
  });

  async function registerDemo(): Promise<TestUser> {
    const demo = await registerUser();
    process.env.DEMO_USER_EMAIL = demo.email;
    return demo;
  }

  it('não troca a senha e continua entrando com a original', async () => {
    const demo = await registerDemo();

    const res = await request(app)
      .post('/api/users/change-password')
      .set('Authorization', `Bearer ${demo.token}`)
      .send({ currentPassword: 'senha123', newPassword: 'novaSenha123' });
    expect(res.status).toBe(403);

    const login = await request(app)
      .post('/api/auth/login')
      .send({ email: demo.email, password: 'senha123' });
    expect(login.status).toBe(200);
  });

  it('não exclui a própria conta', async () => {
    const demo = await registerDemo();

    const res = await request(app)
      .delete(`/api/users/${demo.id}`)
      .set('Authorization', `Bearer ${demo.token}`)
      .send({ password: 'senha123' });
    expect(res.status).toBe(403);

    const login = await request(app)
      .post('/api/auth/login')
      .send({ email: demo.email, password: 'senha123' });
    expect(login.status).toBe(200);
  });

  it('não troca o e-mail pelo perfil, mas troca o nome', async () => {
    const demo = await registerDemo();

    const email = await request(app)
      .put(`/api/users/${demo.id}`)
      .set('Authorization', `Bearer ${demo.token}`)
      .send({ email: 'outro@petfinder.test' });
    expect(email.status).toBe(403);

    const nome = await request(app)
      .put(`/api/users/${demo.id}`)
      .set('Authorization', `Bearer ${demo.token}`)
      .send({ name: 'Visitante Demo' });
    expect(nome.status).toBe(200);
  });
});
