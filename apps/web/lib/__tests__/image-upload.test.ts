import { describe, expect, it } from 'vitest';
import { MAX_UPLOAD_DIMENSION, fitWithin, shouldShrink, shrinkImage } from '../image-upload';

function fileOf(bytes: number, type: string, name = 'foto.jpg'): File {
  return new File([new Uint8Array(bytes)], name, { type });
}

describe('fitWithin', () => {
  it('reduz pelo lado maior mantendo a proporção', () => {
    expect(fitWithin(4000, 3000, MAX_UPLOAD_DIMENSION)).toEqual({ width: 1600, height: 1200 });
    expect(fitWithin(3000, 4000, MAX_UPLOAD_DIMENSION)).toEqual({ width: 1200, height: 1600 });
  });

  it('não amplia imagens menores que o limite', () => {
    expect(fitWithin(800, 600, MAX_UPLOAD_DIMENSION)).toEqual({ width: 800, height: 600 });
  });
});

describe('shouldShrink', () => {
  it('reduz fotos grandes', () => {
    expect(shouldShrink(fileOf(3 * 1024 * 1024, 'image/jpeg'))).toBe(true);
  });

  it('mantém fotos pequenas, GIFs e arquivos que não são imagem', () => {
    expect(shouldShrink(fileOf(500 * 1024, 'image/jpeg'))).toBe(false);
    expect(shouldShrink(fileOf(3 * 1024 * 1024, 'image/gif'))).toBe(false);
    expect(shouldShrink(fileOf(3 * 1024 * 1024, 'application/pdf'))).toBe(false);
  });
});

describe('shrinkImage', () => {
  it('devolve o mesmo arquivo quando não precisa reduzir', async () => {
    const file = fileOf(500 * 1024, 'image/jpeg');
    expect(await shrinkImage(file)).toBe(file);
  });

  it('devolve o original quando o navegador não consegue decodificar', async () => {
    const file = fileOf(3 * 1024 * 1024, 'image/heic', 'foto.heic');
    expect(await shrinkImage(file)).toBe(file);
  });
});
