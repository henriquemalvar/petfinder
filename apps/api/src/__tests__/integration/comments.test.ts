import { describe, expect, it } from 'vitest';
import { app, createPet, registerUser, request, type TestUser } from './helpers';

async function createPost(user: TestUser) {
  const pet = await createPet(user);
  const res = await request(app)
    .post('/api/posts')
    .set('Authorization', `Bearer ${user.token}`)
    .send({
      title: 'Rex desapareceu no Santa Tereza',
      content: 'Sumiu na noite de ontem, usa coleira vermelha.',
      petId: pet.id,
      type: 'LOST',
    });
  return res.body;
}

describe('GET /api/posts/:postId/comments', () => {
  it('é público e devolve os comentários do mais novo para o mais antigo', async () => {
    const dono = await registerUser();
    const post = await createPost(dono);

    await request(app)
      .post(`/api/posts/${post.id}/comments`)
      .set('Authorization', `Bearer ${dono.token}`)
      .send({ text: 'primeiro' });
    await request(app)
      .post(`/api/posts/${post.id}/comments`)
      .set('Authorization', `Bearer ${dono.token}`)
      .send({ text: 'segundo' });

    const res = await request(app).get(`/api/posts/${post.id}/comments`);

    expect(res.status).toBe(200);
    expect(res.body.map((c: { text: string }) => c.text)).toEqual(['segundo', 'primeiro']);
  });

  it('devolve 404 para post inexistente', async () => {
    const res = await request(app).get(
      '/api/posts/8a5b4c3d-2e1f-4a5b-8c7d-6e5f4a3b2c1d/comments',
    );

    expect(res.status).toBe(404);
  });

  it('não expõe o email de quem comentou', async () => {
    const dono = await registerUser();
    const post = await createPost(dono);
    await request(app)
      .post(`/api/posts/${post.id}/comments`)
      .set('Authorization', `Bearer ${dono.token}`)
      .send({ text: 'oi' });

    const res = await request(app).get(`/api/posts/${post.id}/comments`);

    expect(res.body[0].user).not.toHaveProperty('email');
  });
});

describe('POST /api/posts/:postId/comments', () => {
  it('exige autenticação', async () => {
    const dono = await registerUser();
    const post = await createPost(dono);

    const res = await request(app)
      .post(`/api/posts/${post.id}/comments`)
      .send({ text: 'anonimo' });

    expect(res.status).toBe(401);
  });

  it('recusa texto vazio', async () => {
    const dono = await registerUser();
    const post = await createPost(dono);

    const res = await request(app)
      .post(`/api/posts/${post.id}/comments`)
      .set('Authorization', `Bearer ${dono.token}`)
      .send({ text: '' });

    expect(res.status).toBe(400);
  });

  it('recusa comentário em post inexistente', async () => {
    const user = await registerUser();

    const res = await request(app)
      .post('/api/posts/8a5b4c3d-2e1f-4a5b-8c7d-6e5f4a3b2c1d/comments')
      .set('Authorization', `Bearer ${user.token}`)
      .send({ text: 'oi' });

    expect(res.status).toBe(404);
  });
});
