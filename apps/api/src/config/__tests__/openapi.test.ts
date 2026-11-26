import { describe, expect, it } from 'vitest';
import committedSpec from '../openapi.json';
import { buildOpenApiSpec } from '../openapiSpec';

describe('openapi.json', () => {
  it('está em dia com a documentação das rotas; rode npm run openapi se falhar', () => {
    expect(committedSpec).toEqual(buildOpenApiSpec());
  });

  it('documenta as rotas da API', () => {
    expect(Object.keys(committedSpec.paths).length).toBeGreaterThan(0);
  });
});
