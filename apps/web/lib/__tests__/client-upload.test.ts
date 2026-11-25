import { afterEach, describe, expect, it, vi } from 'vitest';
import { clientUpload } from '../client-api';
import { UploadTooLarge } from '../image-upload';

afterEach(() => {
  vi.unstubAllGlobals();
});

describe('clientUpload', () => {
  it('recusa antes de enviar quando a foto passa de 4 MB', async () => {
    const fetchMock = vi.fn();
    vi.stubGlobal('fetch', fetchMock);
    const gif = new File([new Uint8Array(5 * 1024 * 1024)], 'grande.gif', { type: 'image/gif' });

    await expect(clientUpload(gif)).rejects.toBeInstanceOf(UploadTooLarge);
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it('envia fotos dentro do limite', async () => {
    const fetchMock = vi.fn().mockResolvedValue(
      new Response(JSON.stringify({ url: 'https://res.cloudinary.com/x.jpg' }), { status: 200 }),
    );
    vi.stubGlobal('fetch', fetchMock);
    const foto = new File([new Uint8Array(200 * 1024)], 'foto.jpg', { type: 'image/jpeg' });

    await expect(clientUpload(foto)).resolves.toEqual({ url: 'https://res.cloudinary.com/x.jpg' });
    expect(fetchMock).toHaveBeenCalledWith('/api/uploads', expect.objectContaining({ method: 'POST' }));
  });
});
