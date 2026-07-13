import { describe, it, expect, vi } from 'vitest';
import { PostService } from '../PostService';
import { AppError } from '../../errors/AppError';

function buildDeps() {
  const repository = {
    findById: vi.fn(),
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
