import { Paginated, Pagination } from '../types';

const DEFAULT_LIMIT = 20;
const MAX_LIMIT = 100;

/**
 * Normaliza os parâmetros de paginação vindos da query: página mínima 1,
 * limite padrão de 20 e teto de 100 para evitar que um cliente peça uma
 * página gigante e derrube o banco. Retorna também o `skip` já calculado.
 */
export function resolvePagination(pagination: Pagination = {}) {
  const page = pagination.page && pagination.page > 0 ? Math.floor(pagination.page) : 1;
  const rawLimit =
    pagination.limit && pagination.limit > 0 ? Math.floor(pagination.limit) : DEFAULT_LIMIT;
  const limit = Math.min(rawLimit, MAX_LIMIT);
  return { page, limit, skip: (page - 1) * limit };
}

export function buildPaginated<T>(
  data: T[],
  total: number,
  page: number,
  limit: number,
): Paginated<T> {
  return {
    data,
    total,
    page,
    limit,
    totalPages: limit > 0 ? Math.ceil(total / limit) : 0,
  };
}
