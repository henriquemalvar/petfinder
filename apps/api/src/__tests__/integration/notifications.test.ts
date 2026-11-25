import { describe, expect, it } from 'vitest';
import { prisma } from '../../config/prisma';
import { NotificationService } from '../../services/NotificationService';
import { app, registerUser, request, type TestUser } from './helpers';

const PRACA_SETE = { latitude: -19.9191, longitude: -43.9386 };
const PAMPULHA = { latitude: -19.8557, longitude: -43.9906 };
const RIO = { latitude: -22.9068, longitude: -43.1729 };

async function criarPostSemNotificar(
  user: TestUser,
  local?: { latitude: number; longitude: number },
) {
  const pet = await prisma.pet.create({
    data: {
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
      userId: user.id,
      ...local,
    },
  });

  return prisma.post.create({
    data: {
      title: 'Rex desapareceu no centro',
      content: 'Sumiu na noite de ontem, usa coleira vermelha.',
      type: 'LOST',
      petId: pet.id,
      userId: user.id,
    },
  });
}

async function moradorEm(local: { latitude: number; longitude: number }): Promise<TestUser> {
  const user = await registerUser();
  await prisma.user.update({ where: { id: user.id }, data: local });
  return user;
}

async function listarNotificacoes(user: TestUser) {
  const res = await request(app)
    .get('/api/notifications')
    .set('Authorization', `Bearer ${user.token}`);
  expect(res.status).toBe(200);
  return res.body;
}

describe('notifyNearbyUsers', () => {
  it('notifica quem está dentro do raio de 10km', async () => {
    const anunciante = await registerUser();
    const vizinho = await moradorEm(PAMPULHA);
    const post = await criarPostSemNotificar(anunciante, PRACA_SETE);

    await new NotificationService().notifyNearbyUsers(post.id);

    const body = await listarNotificacoes(vizinho);
    expect(body.notifications).toHaveLength(1);
    expect(body.unreadCount).toBe(1);
    expect(body.notifications[0].message).toContain('Rex');
  });

  it('não notifica quem está fora do raio', async () => {
    const anunciante = await registerUser();
    const distante = await moradorEm(RIO);
    const post = await criarPostSemNotificar(anunciante, PRACA_SETE);

    await new NotificationService().notifyNearbyUsers(post.id);

    expect((await listarNotificacoes(distante)).notifications).toHaveLength(0);
  });

  it('não notifica o próprio autor do anúncio', async () => {
    const anunciante = await moradorEm(PRACA_SETE);
    const post = await criarPostSemNotificar(anunciante, PRACA_SETE);

    await new NotificationService().notifyNearbyUsers(post.id);

    expect((await listarNotificacoes(anunciante)).notifications).toHaveLength(0);
  });

  it('não notifica ninguém quando o pet não tem coordenada', async () => {
    const anunciante = await registerUser();
    const vizinho = await moradorEm(PAMPULHA);
    const post = await criarPostSemNotificar(anunciante);

    await new NotificationService().notifyNearbyUsers(post.id);

    expect((await listarNotificacoes(vizinho)).notifications).toHaveLength(0);
  });
});

describe('GET /api/notifications', () => {
  it('exige autenticação', async () => {
    const res = await request(app).get('/api/notifications');

    expect(res.status).toBe(401);
  });
});

describe('PATCH /api/notifications/:id/read', () => {
  it('marca a notificação como lida', async () => {
    const anunciante = await registerUser();
    const vizinho = await moradorEm(PAMPULHA);
    const post = await criarPostSemNotificar(anunciante, PRACA_SETE);
    await new NotificationService().notifyNearbyUsers(post.id);
    const notificacao = (await listarNotificacoes(vizinho)).notifications[0];
    expect(notificacao.read).toBe(false);

    const res = await request(app)
      .patch(`/api/notifications/${notificacao.id}/read`)
      .set('Authorization', `Bearer ${vizinho.token}`);

    expect(res.status).toBe(204);
    const depois = await listarNotificacoes(vizinho);
    expect(depois.notifications[0].read).toBe(true);
    expect(depois.unreadCount).toBe(0);
  });

  it('não deixa marcar como lida a notificação de outro usuário', async () => {
    const anunciante = await registerUser();
    const vizinho = await moradorEm(PAMPULHA);
    const intruso = await registerUser();
    const post = await criarPostSemNotificar(anunciante, PRACA_SETE);
    await new NotificationService().notifyNearbyUsers(post.id);
    const notificacao = (await listarNotificacoes(vizinho)).notifications[0];

    await request(app)
      .patch(`/api/notifications/${notificacao.id}/read`)
      .set('Authorization', `Bearer ${intruso.token}`);

    expect((await listarNotificacoes(vizinho)).notifications[0].read).toBe(false);
  });
});
