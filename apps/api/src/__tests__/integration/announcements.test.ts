import { describe, expect, it } from 'vitest';
import { prisma } from '../../config/prisma';
import { app, registerUser, request, type TestUser } from './helpers';

const PET_BASE = {
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
};

function criarAnuncio(user: TestUser, body: Record<string, unknown>) {
  return request(app)
    .post('/api/announcements')
    .set('Authorization', `Bearer ${user.token}`)
    .send(body);
}

describe('POST /api/announcements', () => {
  it('cria pet e post numa tacada só', async () => {
    const user = await registerUser();

    const res = await criarAnuncio(user, { type: 'LOST', pet: PET_BASE });

    expect(res.status).toBe(201);
    expect(res.body.type).toBe('LOST');
    expect(res.body.status).toBe('ACTIVE');
    expect(res.body.pet.name).toBe('Rex');
    expect(res.body.pet.userId).toBe(user.id);
    expect(res.body.userId).toBe(user.id);
    expect(await prisma.pet.count({ where: { userId: user.id } })).toBe(1);
    expect(await prisma.post.count({ where: { userId: user.id } })).toBe(1);
  });

  it('gera título e conteúdo padrão quando não vêm no corpo', async () => {
    const user = await registerUser();

    const res = await criarAnuncio(user, { type: 'LOST', pet: PET_BASE });

    expect(res.body.title).toBe('Rex desapareceu');
    expect(res.body.content).toContain('Belo Horizonte');
  });

  it('respeita título e conteúdo enviados', async () => {
    const user = await registerUser();

    const res = await criarAnuncio(user, {
      type: 'ADOPTION',
      title: 'Rex procura um lar',
      content: 'Ele é dócil e já está castrado.',
      pet: PET_BASE,
    });

    expect(res.body.title).toBe('Rex procura um lar');
    expect(res.body.content).toBe('Ele é dócil e já está castrado.');
  });

  it('atualiza os dados de contato do usuário quando enviados', async () => {
    const user = await registerUser();

    await criarAnuncio(user, {
      type: 'LOST',
      pet: PET_BASE,
      whatsapp: '31999998888',
      contactPreference: 'WHATSAPP',
    });

    const salvo = await prisma.user.findUnique({ where: { id: user.id } });
    expect(salvo?.whatsapp).toBe('31999998888');
    expect(salvo?.contactPreference).toBe('WHATSAPP');
  });

  it('preserva o contato já cadastrado quando o anúncio não manda nada', async () => {
    const user = await registerUser();
    await prisma.user.update({
      where: { id: user.id },
      data: { whatsapp: '31911112222', contactPreference: 'WHATSAPP' },
    });

    await criarAnuncio(user, { type: 'LOST', pet: PET_BASE });

    const salvo = await prisma.user.findUnique({ where: { id: user.id } });
    expect(salvo?.whatsapp).toBe('31911112222');
    expect(salvo?.contactPreference).toBe('WHATSAPP');
  });

  it('não deixa pet órfão quando o anúncio é inválido', async () => {
    const user = await registerUser();

    const res = await criarAnuncio(user, {
      type: 'LOST',
      pet: { ...PET_BASE, description: 'curta' },
    });

    expect(res.status).toBe(400);
    expect(await prisma.pet.count({ where: { userId: user.id } })).toBe(0);
  });

  it('exige autenticação', async () => {
    const res = await request(app)
      .post('/api/announcements')
      .send({ type: 'LOST', pet: PET_BASE });

    expect(res.status).toBe(401);
  });

  it('guarda as coordenadas do pet para o raio de notificação', async () => {
    const user = await registerUser();

    const res = await criarAnuncio(user, {
      type: 'LOST',
      pet: { ...PET_BASE, latitude: -19.9191, longitude: -43.9386 },
    });

    expect(res.body.pet.latitude).toBe(-19.9191);
    expect(res.body.pet.longitude).toBe(-43.9386);
  });

  it('não expõe a senha do autor na resposta', async () => {
    const user = await registerUser();

    const res = await criarAnuncio(user, { type: 'LOST', pet: PET_BASE });

    expect(res.body.user).not.toHaveProperty('password');
  });
});
