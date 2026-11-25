import { describe, it, expect, vi, beforeEach } from 'vitest';
import { boundingBox } from '../../utils/geo';

const { post, user, notification } = vi.hoisted(() => ({
  post: { findUnique: vi.fn() },
  user: { findMany: vi.fn() },
  notification: { createMany: vi.fn() },
}));

vi.mock('../../config/prisma', () => ({
  prisma: { post, user, notification },
}));

import { NotificationService } from '../NotificationService';

const PET_LAT = -19.92;
const PET_LON = -43.94;

function makePost(overrides: Record<string, unknown> = {}) {
  return {
    id: 'p1',
    userId: 'owner',
    type: 'LOST',
    pet: { name: 'Rex', latitude: PET_LAT, longitude: PET_LON },
    ...overrides,
  };
}

beforeEach(() => {
  vi.clearAllMocks();
  notification.createMany.mockResolvedValue({ count: 0 });
});

describe('NotificationService.notifyNearbyUsers', () => {
  it('mede o raio pela coordenada do PET e exclui o autor do post', async () => {
    post.findUnique.mockResolvedValue(makePost());
    user.findMany.mockResolvedValue([]);

    await new NotificationService().notifyNearbyUsers('p1');

    const where = user.findMany.mock.calls[0][0].where;
    const box = boundingBox(PET_LAT, PET_LON, 10);
    expect(where.id).toEqual({ not: 'owner' });
    expect(where.latitude).toEqual({ gte: box.minLat, lte: box.maxLat });
    expect(where.longitude).toEqual({ gte: box.minLon, lte: box.maxLon });
  });

  it('grava notificação in-app apenas para quem está dentro do raio real', async () => {
    post.findUnique.mockResolvedValue(makePost());
    // u1 quase em cima do pet (dentro dos 10km); u2 no canto da caixa
    // envolvente (~14km na diagonal), fora do círculo de 10km.
    const box = boundingBox(PET_LAT, PET_LON, 10);
    user.findMany.mockResolvedValue([
      { id: 'u1', latitude: PET_LAT + 0.001, longitude: PET_LON + 0.001 },
      { id: 'u2', latitude: box.minLat, longitude: box.minLon },
    ]);

    await new NotificationService().notifyNearbyUsers('p1');

    expect(notification.createMany).toHaveBeenCalledTimes(1);
    const data = notification.createMany.mock.calls[0][0].data;
    expect(data.map((d: { userId: string }) => d.userId)).toEqual(['u1']);
    expect(data[0]).toMatchObject({ postId: 'p1' });
  });

  it('não grava nada quando o pet não tem coordenadas', async () => {
    post.findUnique.mockResolvedValue(
      makePost({ pet: { name: 'Rex', latitude: null, longitude: null } }),
    );

    await new NotificationService().notifyNearbyUsers('p1');

    expect(user.findMany).not.toHaveBeenCalled();
    expect(notification.createMany).not.toHaveBeenCalled();
  });

  it('não grava nada quando não há vizinhos', async () => {
    post.findUnique.mockResolvedValue(makePost());
    user.findMany.mockResolvedValue([]);

    await new NotificationService().notifyNearbyUsers('p1');

    expect(notification.createMany).not.toHaveBeenCalled();
  });
});
