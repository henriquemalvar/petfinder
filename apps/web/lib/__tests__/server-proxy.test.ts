import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

const cookieValue = { token: undefined as string | undefined };

vi.mock('next/headers', () => ({
  cookies: async () => ({
    get: (name: string) =>
      name === 'token' && cookieValue.token ? { value: cookieValue.token } : undefined,
  }),
}));

const { forward, proxy, toNextResponse, Unauthorized } = await import('../server-proxy');

const fetchMock = vi.fn();

beforeEach(() => {
  cookieValue.token = undefined;
  fetchMock.mockReset();
  vi.stubGlobal('fetch', fetchMock);
});

afterEach(() => {
  vi.unstubAllGlobals();
});

function apiResponde(body: unknown, status = 200) {
  fetchMock.mockResolvedValue(
    new Response(status === 204 ? null : JSON.stringify(body), {
      status,
      headers: { 'Content-Type': 'application/json' },
    }),
  );
}

function chamadaFeita() {
  const [url, init] = fetchMock.mock.calls[0];
  return { url: String(url), init: init as RequestInit };
}

describe('forward', () => {
  it('repassa o cookie de sessão como Bearer', async () => {
    cookieValue.token = 'jwt-do-usuario';
    apiResponde({ ok: true });

    await forward('/api/pets/1', { method: 'PUT', body: { name: 'Rex' } });

    const { init } = chamadaFeita();
    expect((init.headers as Record<string, string>).Authorization).toBe('Bearer jwt-do-usuario');
  });

  it('não manda Authorization quando não há sessão', async () => {
    apiResponde({ ok: true });

    await forward('/api/posts');

    const { init } = chamadaFeita();
    expect(init.headers).not.toHaveProperty('Authorization');
  });

  it('só declara Content-Type quando existe corpo JSON', async () => {
    apiResponde({ ok: true });

    await forward('/api/posts/1', { method: 'DELETE' });

    const { init } = chamadaFeita();
    expect(init.headers).not.toHaveProperty('Content-Type');
  });

  it('manda FormData sem serializar como JSON', async () => {
    const formData = new FormData();
    formData.append('image', 'x');
    apiResponde({ url: 'https://cdn/x.png' });

    await forward('/api/uploads', { method: 'POST', formData });

    const { init } = chamadaFeita();
    expect(init.body).toBe(formData);
    expect(init.headers).not.toHaveProperty('Content-Type');
  });

  it('recusa a chamada quando a rota exige sessão e não há cookie', async () => {
    await expect(forward('/api/notifications', { requireAuth: true })).rejects.toBeInstanceOf(
      Unauthorized,
    );
    expect(fetchMock).not.toHaveBeenCalled();
  });
});

describe('toNextResponse', () => {
  it('devolve 204 sem corpo quando a API responde 204', async () => {
    const res = await toNextResponse(new Response(null, { status: 204 }));

    expect(res.status).toBe(204);
    expect(await res.text()).toBe('');
  });

  it('devolve 204 para os status listados em emptyOn', async () => {
    const res = await toNextResponse(new Response('{}', { status: 200 }), { emptyOn: [200] });

    expect(res.status).toBe(204);
  });

  it('preserva corpo e status de erro da API', async () => {
    const res = await toNextResponse(
      new Response(JSON.stringify({ error: 'Não encontrado' }), { status: 404 }),
    );

    expect(res.status).toBe(404);
    expect(await res.json()).toEqual({ error: 'Não encontrado' });
  });

  it('usa a mensagem de fallback quando a resposta não é JSON', async () => {
    const res = await toNextResponse(new Response('<html>502</html>', { status: 502 }), {
      fallbackError: 'Erro ao trocar a senha',
    });

    expect(res.status).toBe(502);
    expect(await res.json()).toEqual({ error: 'Erro ao trocar a senha' });
  });
});

describe('proxy', () => {
  it('traduz a falta de sessão em 401 sem chamar a API', async () => {
    const res = await proxy('/api/notifications', { requireAuth: true });

    expect(res.status).toBe(401);
    expect(await res.json()).toEqual({ error: 'Não autorizado' });
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it('encaminha para a API e devolve corpo e status', async () => {
    cookieValue.token = 'jwt';
    apiResponde({ notifications: [], unreadCount: 0 });

    const res = await proxy('/api/notifications', { requireAuth: true, cache: 'no-store' });

    expect(res.status).toBe(200);
    expect(await res.json()).toEqual({ notifications: [], unreadCount: 0 });
    expect(chamadaFeita().init.cache).toBe('no-store');
  });

  it('propaga erro de rede em vez de mascarar como 401', async () => {
    fetchMock.mockRejectedValue(new Error('ECONNREFUSED'));

    await expect(proxy('/api/posts')).rejects.toThrow('ECONNREFUSED');
  });
});
