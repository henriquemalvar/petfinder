import { describe, it, expect, vi } from 'vitest';
import { UserService } from '../UserService';

function buildService() {
  const repository = {
    findById: vi.fn(),
    findByEmail: vi.fn(async () => null),
    update: vi.fn(async (id: string, data: any) => ({ id, password: 'h', ...data })),
    delete: vi.fn(async () => undefined),
  };
  const service = new UserService(repository as any);
  return { service, repository };
}

describe('UserService ownership', () => {
  it('impede que um usuário edite a conta de outro', async () => {
    const { service, repository } = buildService();
    repository.findById.mockResolvedValue({ id: 'victim', email: 'v@x.com' });

    await expect(
      service.update('victim', { name: 'hacked' } as any, 'attacker')
    ).rejects.toMatchObject({ statusCode: 403 });

    expect(repository.update).not.toHaveBeenCalled();
  });

  it('permite que o usuário edite a própria conta', async () => {
    const { service, repository } = buildService();
    repository.findById.mockResolvedValue({ id: 'me', email: 'me@x.com' });

    await service.update('me', { name: 'novo nome' } as any, 'me');

    expect(repository.update).toHaveBeenCalled();
  });

  it('impede que um usuário apague a conta de outro', async () => {
    const { service, repository } = buildService();
    repository.findById.mockResolvedValue({ id: 'victim' });

    await expect(service.delete('victim', 'attacker')).rejects.toMatchObject({ statusCode: 403 });
    expect(repository.delete).not.toHaveBeenCalled();
  });
});
