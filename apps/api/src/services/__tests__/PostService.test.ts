import { describe, it, expect, vi } from 'vitest';
import { PostService } from '../PostService';
import { AppError } from '../../errors/AppError';

function buildDeps() {
  const repository = {
    findById: vi.fn(),
    create: vi.fn(async (data: any) => ({ id: 'novo-post', ...data })),
    update: vi.fn(async (id: string, data: any) => ({ id, userId: 'owner', ...data })),
    delete: vi.fn(async () => undefined),
  };
  const notificationService = { notifyNearbyUsers: vi.fn(async () => undefined) };
  const service = new PostService(repository as any, notificationService as any);
  return { service, repository, notificationService };
}

describe('PostService ownership', () => {
  it('impede que um usuário edite o post de outro', async () => {
    const { service, repository } = buildDeps();
    repository.findById.mockResolvedValue({ id: 'p1', userId: 'owner' });

    await expect(
      service.update('p1', { title: 'hack' } as any, 'attacker')
    ).rejects.toMatchObject({ statusCode: 403 });

    expect(repository.update).not.toHaveBeenCalled();
  });

  it('permite que o dono edite o próprio post', async () => {
    const { service, repository } = buildDeps();
    repository.findById.mockResolvedValue({ id: 'p1', userId: 'owner' });

    await service.update('p1', { title: 'novo' } as any, 'owner');

    expect(repository.update).toHaveBeenCalledWith('p1', { title: 'novo' });
  });

  it('impede que um usuário apague o post de outro', async () => {
    const { service, repository } = buildDeps();
    repository.findById.mockResolvedValue({ id: 'p1', userId: 'owner' });

    await expect(service.delete('p1', 'attacker')).rejects.toMatchObject({ statusCode: 403 });
    expect(repository.delete).not.toHaveBeenCalled();
  });

  it('retorna 404 quando o post não existe', async () => {
    const { service, repository } = buildDeps();
    repository.findById.mockResolvedValue(null);

    await expect(service.update('missing', {} as any, 'owner')).rejects.toBeInstanceOf(AppError);
    await expect(service.update('missing', {} as any, 'owner')).rejects.toMatchObject({ statusCode: 404 });
  });
});

describe('PostService notificação', () => {
  it('notifica a vizinhança ao criar um anúncio', async () => {
    const { service, notificationService } = buildDeps();

    const post = await service.create({ title: 'Rex sumiu', userId: 'owner' } as any);

    expect(post.id).toBe('novo-post');
    expect(notificationService.notifyNearbyUsers).toHaveBeenCalledWith('novo-post');
  });

  it('não notifica a vizinhança ao marcar como resolvido', async () => {
    const { service, repository, notificationService } = buildDeps();
    repository.findById.mockResolvedValue({ id: 'p1', userId: 'owner' });
    repository.update.mockResolvedValue({ id: 'p1', userId: 'owner', status: 'RESOLVED' });

    await service.update('p1', { status: 'RESOLVED' } as any, 'owner');

    expect(notificationService.notifyNearbyUsers).not.toHaveBeenCalled();
  });

  it('não notifica ao editar um anúncio ativo (evita spam no sino dos vizinhos)', async () => {
    const { service, repository, notificationService } = buildDeps();
    repository.findById.mockResolvedValue({ id: 'p1', userId: 'owner' });
    repository.update.mockResolvedValue({ id: 'p1', userId: 'owner', status: 'ACTIVE' });

    await service.update('p1', { content: 'novo texto do anúncio' } as any, 'owner');

    expect(notificationService.notifyNearbyUsers).not.toHaveBeenCalled();
  });
});
