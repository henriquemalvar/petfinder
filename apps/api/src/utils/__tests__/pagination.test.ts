import { describe, it, expect } from 'vitest';
import { buildPaginated, resolvePagination } from '../pagination';

describe('resolvePagination', () => {
  it('usa padrões quando nada é informado', () => {
    expect(resolvePagination()).toEqual({ page: 1, limit: 20, skip: 0 });
  });

  it('calcula o skip a partir de page e limit', () => {
    expect(resolvePagination({ page: 3, limit: 10 })).toEqual({ page: 3, limit: 10, skip: 20 });
  });

  it('força página mínima 1 para valores inválidos', () => {
    expect(resolvePagination({ page: 0 }).page).toBe(1);
    expect(resolvePagination({ page: -5 }).page).toBe(1);
  });

  it('limita o take ao teto de 100', () => {
    expect(resolvePagination({ limit: 5000 }).limit).toBe(100);
  });

  it('cai no padrão quando limit é inválido', () => {
    expect(resolvePagination({ limit: 0 }).limit).toBe(20);
    expect(resolvePagination({ limit: -1 }).limit).toBe(20);
  });
});

describe('buildPaginated', () => {
  it('monta o envelope com totalPages arredondado para cima', () => {
    expect(buildPaginated([1, 2], 21, 1, 10)).toEqual({
      data: [1, 2],
      total: 21,
      page: 1,
      limit: 10,
      totalPages: 3,
    });
  });

  it('totalPages é 0 quando não há registros', () => {
    expect(buildPaginated([], 0, 1, 20).totalPages).toBe(0);
  });
});
