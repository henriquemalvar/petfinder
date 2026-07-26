import { describe, it, expect, vi } from 'vitest';
import * as bcrypt from 'bcryptjs';
import { UserService } from '../UserService';

const HASH = bcrypt.hashSync('senha-atual', 10);

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

describe('UserService.changePassword', () => {
  it('recusa conta sem senha (login Google)', async () => {
    const { service, repository } = buildService();
    repository.findById.mockResolvedValue({ id: 'me', password: null });

    await expect(service.changePassword('me', 'x', 'nova-senha')).rejects.toMatchObject({
      statusCode: 400,
    });
    expect(repository.update).not.toHaveBeenCalled();
  });

  it('recusa quando a senha atual está incorreta', async () => {
    const { service, repository } = buildService();
    repository.findById.mockResolvedValue({ id: 'me', password: HASH });

    await expect(service.changePassword('me', 'errada', 'nova-senha')).rejects.toMatchObject({
      statusCode: 401,
    });
    expect(repository.update).not.toHaveBeenCalled();
  });

  it('troca a senha quando a atual confere', async () => {
    const { service, repository } = buildService();
    repository.findById.mockResolvedValue({ id: 'me', password: HASH });

    await service.changePassword('me', 'senha-atual', 'nova-senha');

    const [, data] = repository.update.mock.calls[0];
    expect(data.password).toBeDefined();
    expect(data.password).not.toBe('nova-senha'); // guardada com hash
  });
});

describe('UserService.delete confirmação', () => {
  it('exige senha para conta que tem senha', async () => {
    const { service, repository } = buildService();
    repository.findById.mockResolvedValue({ id: 'me', password: HASH });

    await expect(service.delete('me', 'me')).rejects.toMatchObject({ statusCode: 400 });
    expect(repository.delete).not.toHaveBeenCalled();
  });

  it('recusa senha incorreta na exclusão', async () => {
    const { service, repository } = buildService();
    repository.findById.mockResolvedValue({ id: 'me', password: HASH });

    await expect(service.delete('me', 'me', 'errada')).rejects.toMatchObject({ statusCode: 401 });
    expect(repository.delete).not.toHaveBeenCalled();
  });

  it('exclui quando a senha confere', async () => {
    const { service, repository } = buildService();
    repository.findById.mockResolvedValue({ id: 'me', password: HASH });

    await service.delete('me', 'me', 'senha-atual');

    expect(repository.delete).toHaveBeenCalledWith('me');
  });

  it('exclui conta só-Google sem exigir senha', async () => {
    const { service, repository } = buildService();
    repository.findById.mockResolvedValue({ id: 'me', password: null });

    await service.delete('me', 'me');

    expect(repository.delete).toHaveBeenCalledWith('me');
  });
});
