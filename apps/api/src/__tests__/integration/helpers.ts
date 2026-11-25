import request from 'supertest';
import { app } from '../../httpApp';

export interface TestUser {
  id: string;
  email: string;
  token: string;
}

let counter = 0;

export async function registerUser(): Promise<TestUser> {
  counter += 1;
  const email = `user${counter}.${Date.now()}@petfinder.test`;
  const res = await request(app).post('/api/auth/register').send({
    name: `Usuario ${counter}`,
    email,
    password: 'senha123',
  });

  if (res.status !== 201 && res.status !== 200) {
    throw new Error(`registerUser falhou: ${res.status} ${JSON.stringify(res.body)}`);
  }

  return { id: res.body.user.id, email, token: res.body.token };
}

export async function createPet(user: TestUser, overrides: Record<string, unknown> = {}) {
  const res = await request(app)
    .post('/api/pets')
    .set('Authorization', `Bearer ${user.token}`)
    .send({
      name: 'Rex',
      type: 'Cachorro',
      breed: 'Vira-lata',
      age: '3 anos',
      gender: 'MALE',
      size: 'MEDIUM',
      description: 'Cachorro dócil de porte médio',
      castrated: true,
      vaccinated: true,
      location: 'Belo Horizonte',
      ...overrides,
    });

  if (res.status !== 201) {
    throw new Error(`createPet falhou: ${res.status} ${JSON.stringify(res.body)}`);
  }

  return res.body;
}

export { app, request };
