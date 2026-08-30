import { describe, expect, it } from 'vitest';
import { app, createPet, registerUser, request, type TestUser } from './helpers';

async function createPost(user: TestUser, overrides: Record<string, unknown> = {}) {
  const pet = await createPet(user);
  const res = await request(app)
    .post('/api/posts')
    .set('Authorization', `Bearer ${user.token}`)
    .send({
      title: 'Rex desapareceu no Santa Tereza',
      content: 'Sumiu na noite de ontem, usa coleira vermelha.',
      petId: pet.id,
      type: 'LOST',
      ...overrides,
    });

  if (res.status !== 201) {
    throw new Error(`createPost falhou: ${res.status} ${JSON.stringify(res.body)}`);
  }

  return res.body;
}

describe('PATCH /api/posts/:id', () => {
  it('impede que um usuário edite o anúncio de outro', async () => {
    const dono = await registerUser();
    const intruso = await registerUser();
    const post = await createPost(dono);

    const res = await request(app)
      .patch(`/api/posts/${post.id}`)
      .set('Authorization', `Bearer ${intruso.token}`)
      .send({ title: 'Titulo sequestrado' });

    expect(res.status).toBe(403);
  });

  it('marca o anúncio como resolvido mandando só o status', async () => {
    const dono = await registerUser();
    const post = await createPost(dono);

    const res = await request(app)
      .patch(`/api/posts/${post.id}`)
      .set('Authorization', `Bearer ${dono.token}`)
      .send({ status: 'RESOLVED' });

    expect(res.status).toBe(200);
    expect(res.body.status).toBe('RESOLVED');
    expect(res.body.title).toBe('Rex desapareceu no Santa Tereza');
  });

  it('recusa um status fora do enum', async () => {
    const dono = await registerUser();
    const post = await createPost(dono);

    const res = await request(app)
      .patch(`/api/posts/${post.id}`)
      .set('Authorization', `Bearer ${dono.token}`)
      .send({ status: 'ARQUIVADO' });

    expect(res.status).toBe(400);
  });
});

describe('DELETE /api/posts/:id', () => {
  it('impede que um usuário exclua o anúncio de outro', async () => {
    const dono = await registerUser();
    const intruso = await registerUser();
    const post = await createPost(dono);

    const res = await request(app)
      .delete(`/api/posts/${post.id}`)
      .set('Authorization', `Bearer ${intruso.token}`);

    expect(res.status).toBe(403);

    const depois = await request(app).get(`/api/posts/${post.id}`);
    expect(depois.status).toBe(200);
  });

  it('deixa o dono excluir o próprio anúncio', async () => {
    const dono = await registerUser();
    const post = await createPost(dono);

    const res = await request(app)
      .delete(`/api/posts/${post.id}`)
      .set('Authorization', `Bearer ${dono.token}`);

    expect(res.status).toBe(204);

    const depois = await request(app).get(`/api/posts/${post.id}`);
    expect(depois.status).toBe(404);
  });
});

describe('GET /api/posts', () => {
  it('pagina a listagem e informa o total', async () => {
    const dono = await registerUser();
    await createPost(dono);
    await createPost(dono);
    await createPost(dono);

    const res = await request(app).get('/api/posts').query({ page: 1, limit: 2 });

    expect(res.status).toBe(200);
    expect(res.body.posts).toHaveLength(2);
    expect(res.body.total).toBe(3);
    expect(res.body.totalPages).toBe(2);
  });

  it('filtra por tipo', async () => {
    const dono = await registerUser();
    await createPost(dono, { type: 'LOST' });
    await createPost(dono, { type: 'ADOPTION' });

    const res = await request(app).get('/api/posts').query({ type: 'ADOPTION' });

    expect(res.status).toBe(200);
    expect(res.body.posts).toHaveLength(1);
    expect(res.body.posts[0].type).toBe('ADOPTION');
  });

  it('é público, não exige token', async () => {
    const res = await request(app).get('/api/posts');

    expect(res.status).toBe(200);
  });
});
