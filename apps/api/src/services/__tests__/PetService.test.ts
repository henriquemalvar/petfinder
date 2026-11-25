import { describe, it, expect, vi } from 'vitest';
import { PetService } from '../PetService';
import { AppError } from '../../errors/AppError';

function buildDeps() {
  const repository = {
    findById: vi.fn(),
    update: vi.fn(async (id: string, data: any) => ({ id, userId: 'owner', ...data })),
    delete: vi.fn(async () => undefined),
  };
  const service = new PetService(repository as any);
  return { service, repository };
}

describe('PetService ownership', () => {
  it('impede que um usuário edite o pet de outro', async () => {
    const { service, repository } = buildDeps();
    repository.findById.mockResolvedValue({ id: 'pet1', userId: 'owner' });

    await expect(
      service.update('pet1', { name: 'hack' } as any, 'attacker')
    ).rejects.toMatchObject({ statusCode: 403 });

    expect(repository.update).not.toHaveBeenCalled();
  });

  it('permite que o dono edite o próprio pet', async () => {
    const { service, repository } = buildDeps();
    repository.findById.mockResolvedValue({ id: 'pet1', userId: 'owner' });

    await service.update('pet1', { name: 'Rex' } as any, 'owner');

    expect(repository.update).toHaveBeenCalledWith('pet1', { name: 'Rex' });
  });

  it('impede que um usuário apague o pet de outro', async () => {
    const { service, repository } = buildDeps();
    repository.findById.mockResolvedValue({ id: 'pet1', userId: 'owner' });

    await expect(service.delete('pet1', 'attacker')).rejects.toMatchObject({ statusCode: 403 });
    expect(repository.delete).not.toHaveBeenCalled();
  });

  it('permite que o dono apague o próprio pet', async () => {
    const { service, repository } = buildDeps();
    repository.findById.mockResolvedValue({ id: 'pet1', userId: 'owner' });

    await service.delete('pet1', 'owner');

    expect(repository.delete).toHaveBeenCalledWith('pet1');
  });

  it('retorna 404 quando o pet não existe', async () => {
    const { service, repository } = buildDeps();
    repository.findById.mockResolvedValue(null);

    await expect(service.update('missing', {} as any, 'owner')).rejects.toBeInstanceOf(AppError);
    await expect(service.update('missing', {} as any, 'owner')).rejects.toMatchObject({ statusCode: 404 });
    await expect(service.delete('missing', 'owner')).rejects.toMatchObject({ statusCode: 404 });
  });
});
