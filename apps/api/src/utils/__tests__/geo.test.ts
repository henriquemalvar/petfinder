import { describe, it, expect } from 'vitest';
import { boundingBox, getDistanceKm } from '../geo';

describe('getDistanceKm', () => {
  it('é zero para o mesmo ponto', () => {
    expect(getDistanceKm(-19.92, -43.94, -19.92, -43.94)).toBe(0);
  });

  it('é simétrico', () => {
    const a = getDistanceKm(-19.92, -43.94, -23.55, -46.63);
    const b = getDistanceKm(-23.55, -46.63, -19.92, -43.94);
    expect(a).toBeCloseTo(b, 6);
  });

  it('aproxima a distância BH -> São Paulo (~490km)', () => {
    const d = getDistanceKm(-19.9167, -43.9345, -23.5505, -46.6333);
    expect(d).toBeGreaterThan(480);
    expect(d).toBeLessThan(500);
  });

  it('~111km por grau de latitude no meridiano', () => {
    const d = getDistanceKm(0, 0, 1, 0);
    expect(d).toBeGreaterThan(110);
    expect(d).toBeLessThan(112);
  });
});

describe('boundingBox', () => {
  it('contém o ponto central', () => {
    const box = boundingBox(-19.92, -43.94, 10);
    expect(box.minLat).toBeLessThan(-19.92);
    expect(box.maxLat).toBeGreaterThan(-19.92);
    expect(box.minLon).toBeLessThan(-43.94);
    expect(box.maxLon).toBeGreaterThan(-43.94);
  });

  it('a caixa cresce com o raio', () => {
    const small = boundingBox(-19.92, -43.94, 5);
    const big = boundingBox(-19.92, -43.94, 20);
    expect(big.maxLat - big.minLat).toBeGreaterThan(small.maxLat - small.minLat);
  });

  it('abre a caixa em longitude perto do polo (evita divisão por ~0)', () => {
    const box = boundingBox(90, 0, 10);
    expect(box.maxLon - box.minLon).toBe(360);
  });
});
