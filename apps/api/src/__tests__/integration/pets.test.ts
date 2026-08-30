import { describe, expect, it } from 'vitest';
import { app, createPet, registerUser, request } from './helpers';

describe('PUT/PATCH/DELETE /api/pets/:id', () => {
  it('impede que um usuário edite o pet de outro', async () => {
    const dono = await registerUser();
    const intruso = await registerUser();
    const pet = await createPet(dono);

    const res = await request(app)
      .patch(`/api/pets/${pet.id}`)
      .set('Authorization', `Bearer ${intruso.token}`)
      .send({ name: 'Sequestrado' });

    expect(res.status).toBe(403);

    const depois = await request(app)
      .get(`/api/pets/${pet.id}`)
      .set('Authorization', `Bearer ${dono.token}`);
    expect(depois.body.name).toBe('Rex');
  });

  it('impede que um usuário exclua o pet de outro', async () => {
    const dono = await registerUser();
    const intruso = await registerUser();
    const pet = await createPet(dono);

    const res = await request(app)
      .delete(`/api/pets/${pet.id}`)
      .set('Authorization', `Bearer ${intruso.token}`);

    expect(res.status).toBe(403);

    const depois = await request(app)
      .get(`/api/pets/${pet.id}`)
      .set('Authorization', `Bearer ${dono.token}`);
    expect(depois.status).toBe(200);
  });

  it('aceita PATCH com um campo só, sem exigir o objeto inteiro', async () => {
    const dono = await registerUser();
    const pet = await createPet(dono);

    const res = await request(app)
      .patch(`/api/pets/${pet.id}`)
      .set('Authorization', `Bearer ${dono.token}`)
      .send({ name: 'Rex Atualizado' });

    expect(res.status).toBe(200);
    expect(res.body.name).toBe('Rex Atualizado');
    expect(res.body.breed).toBe('Vira-lata');
  });

  it('exige autenticação', async () => {
    const dono = await registerUser();
    const pet = await createPet(dono);

    const res = await request(app).patch(`/api/pets/${pet.id}`).send({ name: 'X' });

    expect(res.status).toBe(401);
  });
});
